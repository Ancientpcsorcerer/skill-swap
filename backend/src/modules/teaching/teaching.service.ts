import { query, queryOne, withTransaction } from '../../db/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { zoomService } from './zoom.service';

export interface TeachingProfileRecord {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  headline: string;
  bio: string;
  hourly_rate: string;
  status: 'available' | 'busy' | 'paused';
  availability_slots: Array<{ day: string; time: string }>;
  skills: string[];
  is_published: boolean;
}

export interface TeachingRequestRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_username: string;
  student_avatar_url: string | null;
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  teacher_avatar_url: string | null;
  skill: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ClassRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  teacher_avatar_url: string | null;
  title: string;
  description: string;
  skill: string;
  schedule: string;
  meeting_url: string | null;
  max_students: number;
  member_count: number;
  is_enrolled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  relationship_type: 'direct' | 'class';
  skill: string;
  connected_at: string;
}

export interface ClassSessionRecord {
  id: string;
  class_id: string | null;
  class_title: string | null;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar_url: string | null;
  student_id: string | null;
  student_name: string | null;
  track_id: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  meeting_id: string | null;
  meeting_provider: string;
  timezone: string;
  teacher_info: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export class TeachingService {
  async getProfile(userId: string): Promise<TeachingProfileRecord> {
    const user = await queryOne<{ id: string; name: string; username: string; avatar_url: string | null; bio: string }>(
      `SELECT id, name, username, avatar_url, bio FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) throw new NotFoundError('User not found');

    const profile = await queryOne<{
      headline: string;
      bio: string;
      hourly_rate: string;
      status: string;
      availability_slots: any;
    }>(
      `SELECT headline, bio, hourly_rate, status, availability_slots FROM teaching_profiles WHERE user_id = $1`,
      [userId]
    );

    const skills = await query<{ skill: string }>(
      `SELECT skill FROM teaching_skills WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );

    return {
      user_id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      headline: profile?.headline || '',
      bio: profile?.bio || user.bio || '',
      hourly_rate: profile?.hourly_rate || '',
      status: (profile?.status as any) || 'available',
      availability_slots: Array.isArray(profile?.availability_slots) ? profile.availability_slots : [],
      skills: skills.map((s) => s.skill),
      is_published: Boolean(profile),
    };
  }

  async updateProfile(
    userId: string,
    data: {
      headline?: string;
      bio?: string;
      hourly_rate?: string;
      status?: 'available' | 'busy' | 'paused';
      availability_slots?: Array<{ day: string; time: string }>;
      skills?: string[];
    }
  ): Promise<TeachingProfileRecord> {
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO teaching_profiles (user_id, headline, bio, hourly_rate, status, availability_slots, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           headline = COALESCE($2, teaching_profiles.headline),
           bio = COALESCE($3, teaching_profiles.bio),
           hourly_rate = COALESCE($4, teaching_profiles.hourly_rate),
           status = COALESCE($5, teaching_profiles.status),
           availability_slots = COALESCE($6, teaching_profiles.availability_slots),
           updated_at = NOW()`,
        [
          userId,
          data.headline ?? '',
          data.bio ?? '',
          data.hourly_rate ?? '',
          data.status ?? 'available',
          JSON.stringify(data.availability_slots ?? []),
        ]
      );

      if (data.skills) {
        await client.query(`DELETE FROM teaching_skills WHERE user_id = $1`, [userId]);
        for (const skill of data.skills) {
          if (skill.trim()) {
            await client.query(
              `INSERT INTO teaching_skills (user_id, skill, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
              [userId, skill.trim()]
            );
          }
        }
      }
    });

    return this.getProfile(userId);
  }

  async listTeachers(skill?: string): Promise<TeachingProfileRecord[]> {
    let sql = `
      SELECT u.id as user_id, u.name, u.username, u.avatar_url,
             COALESCE(tp.headline, '') as headline,
             COALESCE(tp.bio, u.bio) as bio,
             COALESCE(tp.hourly_rate, '') as hourly_rate,
             COALESCE(tp.status, 'available') as status,
             COALESCE(tp.availability_slots, '[]'::jsonb) as availability_slots
      FROM users u
      LEFT JOIN teaching_profiles tp ON tp.user_id = u.id
      WHERE (tp.status IS NULL OR tp.status != 'paused')
    `;
    const params: any[] = [];

    if (skill) {
      sql += ` AND EXISTS (SELECT 1 FROM teaching_skills ts WHERE ts.user_id = u.id AND LOWER(ts.skill) = LOWER($1))`;
      params.push(skill);
    } else {
      sql += ` AND (tp.user_id IS NOT NULL OR EXISTS (SELECT 1 FROM teaching_skills ts WHERE ts.user_id = u.id))`;
    }

    sql += ` LIMIT 50`;

    const rows = await query<any>(sql, params);
    const teacherIds = rows.map((r) => r.user_id);

    let allSkills: Record<string, string[]> = {};
    if (teacherIds.length > 0) {
      const skillsRows = await query<{ user_id: string; skill: string }>(
        `SELECT user_id, skill FROM teaching_skills WHERE user_id = ANY($1::uuid[])`,
        [teacherIds]
      );
      for (const s of skillsRows) {
        if (!allSkills[s.user_id]) allSkills[s.user_id] = [];
        allSkills[s.user_id].push(s.skill);
      }
    }

    return rows.map((r) => ({
      user_id: r.user_id,
      name: r.name,
      username: r.username,
      avatar_url: r.avatar_url,
      headline: r.headline,
      bio: r.bio,
      hourly_rate: r.hourly_rate,
      status: r.status,
      availability_slots: Array.isArray(r.availability_slots) ? r.availability_slots : [],
      skills: allSkills[r.user_id] || [],
      is_published: true,
    }));
  }

  async createRequest(
    studentId: string,
    data: { teacherId: string; skill: string; message: string }
  ): Promise<TeachingRequestRecord> {
    if (studentId === data.teacherId) {
      throw new BadRequestError('Cannot send a teaching request to yourself.');
    }
    if (!data.skill?.trim()) {
      throw new BadRequestError('Skill is required for teaching request.');
    }

    const teacher = await queryOne<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [data.teacherId]);
    if (!teacher) throw new NotFoundError('Teacher not found.');

    const row = await queryOne<{ id: string }>(
      `INSERT INTO teaching_requests (student_id, teacher_id, skill, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
       RETURNING id`,
      [studentId, data.teacherId, data.skill.trim(), data.message?.trim() || '']
    );

    const full = await this.listRequests(studentId);
    const found = full.outgoing.find((r) => r.id === row!.id);
    return found!;
  }

  async listRequests(userId: string): Promise<{ incoming: TeachingRequestRecord[]; outgoing: TeachingRequestRecord[] }> {
    const baseSql = `
      SELECT tr.id, tr.skill, tr.message, tr.status, tr.created_at, tr.updated_at,
             tr.student_id, su.name as student_name, su.username as student_username, su.avatar_url as student_avatar_url,
             tr.teacher_id, tu.name as teacher_name, tu.username as teacher_username, tu.avatar_url as teacher_avatar_url
      FROM teaching_requests tr
      JOIN users su ON su.id = tr.student_id
      JOIN users tu ON tu.id = tr.teacher_id
    `;

    const incomingRows = await query<TeachingRequestRecord>(
      `${baseSql} WHERE tr.teacher_id = $1 ORDER BY tr.created_at DESC`,
      [userId]
    );

    const outgoingRows = await query<TeachingRequestRecord>(
      `${baseSql} WHERE tr.student_id = $1 ORDER BY tr.created_at DESC`,
      [userId]
    );

    return { incoming: incomingRows, outgoing: outgoingRows };
  }

  async respondRequest(
    teacherId: string,
    requestId: string,
    action: 'accepted' | 'declined'
  ): Promise<TeachingRequestRecord> {
    const request = await queryOne<TeachingRequestRecord>(
      `SELECT * FROM teaching_requests WHERE id = $1`,
      [requestId]
    );
    if (!request) throw new NotFoundError('Teaching request not found.');
    if (request.teacher_id !== teacherId) {
      throw new ForbiddenError('You are not authorized to respond to this request.');
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE teaching_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [action, requestId]
      );

      if (action === 'accepted') {
        // Form mutual connection
        await client.query(
          `INSERT INTO connections (requester_id, addressee_id, status, created_at, updated_at)
           VALUES ($1, $2, 'accepted', NOW(), NOW())
           ON CONFLICT (requester_id, addressee_id)
           DO UPDATE SET status = 'accepted', updated_at = NOW()`,
          [teacherId, request.student_id]
        );

        // Pre-create direct conversation between teacher & student
        const [p1, p2] = teacherId < request.student_id ? [teacherId, request.student_id] : [request.student_id, teacherId];
        await client.query(
          `INSERT INTO chat_conversations (participant_one_id, participant_two_id, type, updated_at)
           VALUES ($1, $2, 'direct', NOW())
           ON CONFLICT (participant_one_id, participant_two_id) DO NOTHING`,
          [p1, p2]
        );
      }
    });

    const full = await this.listRequests(teacherId);
    return full.incoming.find((r) => r.id === requestId)!;
  }

  async listStudents(teacherId: string): Promise<StudentRecord[]> {
    const rows = await query<StudentRecord>(
      `SELECT DISTINCT u.id, u.name, u.username, u.avatar_url, u.bio,
              'direct' as relationship_type,
              tr.skill,
              tr.updated_at as connected_at
       FROM teaching_requests tr
       JOIN users u ON u.id = tr.student_id
       WHERE tr.teacher_id = $1 AND tr.status = 'accepted'
       UNION
       SELECT DISTINCT u.id, u.name, u.username, u.avatar_url, u.bio,
              'class' as relationship_type,
              c.skill,
              cm.joined_at as connected_at
       FROM class_members cm
       JOIN classes c ON c.id = cm.class_id
       JOIN users u ON u.id = cm.student_id
       WHERE c.teacher_id = $1 AND cm.student_id != $1
       ORDER BY connected_at DESC`,
      [teacherId]
    );

    return rows;
  }

  async listClasses(userId?: string): Promise<ClassRecord[]> {
    const rows = await query<any>(
      `SELECT c.id, c.teacher_id, c.title, c.description, c.skill, c.schedule, c.meeting_url, c.max_students,
              c.created_at, c.updated_at,
              u.name as teacher_name, u.username as teacher_username, u.avatar_url as teacher_avatar_url,
              (SELECT COUNT(*)::int FROM class_members cm WHERE cm.class_id = c.id) as member_count,
              CASE WHEN $1::text IS NOT NULL THEN
                EXISTS(SELECT 1 FROM class_members cm WHERE cm.class_id = c.id AND cm.student_id = $1::uuid)
              ELSE false END as is_enrolled
       FROM classes c
       JOIN users u ON u.id = c.teacher_id
       ORDER BY c.created_at DESC`,
      [userId || null]
    );

    return rows.map((r) => ({
      ...r,
      member_count: Number(r.member_count || 0),
      is_enrolled: Boolean(r.is_enrolled),
    }));
  }

  async createClass(
    teacherId: string,
    data: {
      title: string;
      description: string;
      skill: string;
      schedule?: string;
      meeting_url?: string;
      max_students?: number;
    }
  ): Promise<ClassRecord> {
    if (!data.title?.trim() || !data.skill?.trim()) {
      throw new BadRequestError('Class title and skill are required.');
    }

    const classRow = await withTransaction(async (client) => {
      const c = await client.query<{ id: string }>(
        `INSERT INTO classes (teacher_id, title, description, skill, schedule, meeting_url, max_students, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          teacherId,
          data.title.trim(),
          data.description?.trim() || '',
          data.skill.trim(),
          data.schedule?.trim() || '',
          data.meeting_url?.trim() || null,
          data.max_students || 20,
        ]
      );
      const classId = c.rows[0].id;

      // Teacher is first member of the class
      await client.query(
        `INSERT INTO class_members (class_id, student_id, joined_at) VALUES ($1, $2, NOW())`,
        [classId, teacherId]
      );

      // Create group chat conversation for this class
      const conv = await client.query<{ id: string }>(
        `INSERT INTO chat_conversations (class_id, type, updated_at)
         VALUES ($1, 'class_group', NOW())
         RETURNING id`,
        [classId]
      );
      const conversationId = conv.rows[0].id;

      // Add teacher to chat_group_members
      await client.query(
        `INSERT INTO chat_group_members (conversation_id, user_id, joined_at)
         VALUES ($1, $2, NOW())`,
        [conversationId, teacherId]
      );

      return classId;
    });

    const classes = await this.listClasses(teacherId);
    return classes.find((c) => c.id === classRow)!;
  }

  async joinClass(studentId: string, classId: string): Promise<{ success: boolean; memberCount: number }> {
    const cls = await queryOne<{ id: string; max_students: number }>(
      `SELECT id, max_students FROM classes WHERE id = $1`,
      [classId]
    );
    if (!cls) throw new NotFoundError('Class not found.');

    const currentCountRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM class_members WHERE class_id = $1`,
      [classId]
    );
    const count = Number(currentCountRow?.count || 0);
    if (count >= cls.max_students) {
      throw new BadRequestError('This class is already full.');
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO class_members (class_id, student_id, joined_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        [classId, studentId]
      );

      // Add to class group chat conversation
      const conv = await client.query<{ id: string }>(
        `SELECT id FROM chat_conversations WHERE class_id = $1 LIMIT 1`,
        [classId]
      );
      if (conv.rows.length > 0) {
        await client.query(
          `INSERT INTO chat_group_members (conversation_id, user_id, joined_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (conversation_id, user_id) DO NOTHING`,
          [conv.rows[0].id, studentId]
        );
      }
    });

    const updatedCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM class_members WHERE class_id = $1`,
      [classId]
    );

    return { success: true, memberCount: Number(updatedCount?.count || count) };
  }

  async leaveClass(studentId: string, classId: string): Promise<{ success: boolean; memberCount: number }> {
    await withTransaction(async (client) => {
      await client.query(`DELETE FROM class_members WHERE class_id = $1 AND student_id = $2`, [classId, studentId]);

      const conv = await client.query<{ id: string }>(
        `SELECT id FROM chat_conversations WHERE class_id = $1 LIMIT 1`,
        [classId]
      );
      if (conv.rows.length > 0) {
        await client.query(
          `DELETE FROM chat_group_members WHERE conversation_id = $1 AND user_id = $2`,
          [conv.rows[0].id, studentId]
        );
      }
    });

    const updatedCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM class_members WHERE class_id = $1`,
      [classId]
    );

    return { success: true, memberCount: Number(updatedCount?.count || 0) };
  }

  async listSessions(userId?: string, trackId?: string): Promise<ClassSessionRecord[]> {
    let sql = `
      SELECT cs.id, cs.class_id, c.title as class_title,
             cs.teacher_id, tu.name as teacher_name, tu.avatar_url as teacher_avatar_url,
             cs.student_id, su.name as student_name,
             cs.track_id, cs.title, cs.scheduled_at, cs.duration_minutes,
             cs.meeting_url, cs.meeting_id, cs.meeting_provider, cs.timezone, cs.teacher_info,
             cs.status, cs.created_at, cs.updated_at
      FROM class_sessions cs
      JOIN users tu ON tu.id = cs.teacher_id
      LEFT JOIN users su ON su.id = cs.student_id
      LEFT JOIN classes c ON c.id = cs.class_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (trackId) {
      params.push(trackId);
      sql += ` AND cs.track_id = $${params.length}`;
    } else if (userId) {
      params.push(userId);
      sql += ` AND (
        cs.teacher_id = $${params.length}
        OR cs.student_id = $${params.length}
        OR cs.class_id IN (SELECT class_id FROM class_members WHERE student_id = $${params.length})
      )`;
    }

    sql += ` ORDER BY cs.scheduled_at ASC LIMIT 50`;

    const rows = await query<ClassSessionRecord>(sql, params);
    return rows;
  }

  async createSession(
    teacherId: string,
    data: {
      class_id?: string;
      classId?: string;
      student_id?: string;
      studentId?: string;
      track_id?: string;
      trackId?: string;
      title: string;
      scheduled_at?: string;
      scheduledAt?: string;
      duration_minutes?: number;
      durationMinutes?: number;
      timezone?: string;
      teacher_info?: string;
      teacherInfo?: string;
      meeting_url?: string;
      meetingUrl?: string;
      require_zoom?: boolean;
      requireZoom?: boolean;
    }
  ): Promise<ClassSessionRecord> {
    const scheduledAt = data.scheduled_at || data.scheduledAt;
    if (!data.title?.trim() || !scheduledAt) {
      throw new BadRequestError('Session title and scheduled_at are required.');
    }

    const classId = data.class_id || data.classId || null;
    const studentId = data.student_id || data.studentId || null;
    const trackId = data.track_id || data.trackId || null;
    const durationMinutes = data.duration_minutes || data.durationMinutes || 45;
    const timezone = data.timezone || 'UTC';
    const teacherInfo = data.teacher_info || data.teacherInfo || null;
    const requireZoom = data.require_zoom ?? data.requireZoom ?? false;

    let meetingUrl = data.meeting_url || data.meetingUrl || null;
    let meetingId: string | null = null;
    let meetingPassword: string | null = null;
    let meetingProvider = 'zoom';

    // Check Zoom integration status
    const zoomStatus = await zoomService.getZoomStatus(teacherId);

    if (zoomStatus.connected) {
      try {
        const zoomResult = await zoomService.createMeeting(teacherId, {
          topic: data.title.trim(),
          scheduledAt,
          durationMinutes,
          timezone,
        });
        meetingId = zoomResult.meetingId;
        meetingUrl = zoomResult.meetingUrl;
        meetingPassword = zoomResult.password || null;
        meetingProvider = 'zoom';
      } catch (err: any) {
        if (requireZoom) {
          throw new BadRequestError(`Unable to create Zoom meeting: ${err.message}`);
        }
        console.warn('Notice: Failed to create Zoom meeting via Zoom API:', err.message);
      }
    } else if (requireZoom) {
      throw new BadRequestError('Zoom is not connected. Please connect your Zoom account to schedule a meeting.');
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO class_sessions (
         class_id, teacher_id, student_id, track_id, title, scheduled_at, duration_minutes,
         meeting_url, meeting_id, meeting_password, meeting_provider, timezone, teacher_info,
         status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'scheduled', NOW(), NOW())
       RETURNING id`,
      [
        classId,
        teacherId,
        studentId,
        trackId,
        data.title.trim(),
        scheduledAt,
        durationMinutes,
        meetingUrl,
        meetingId,
        meetingPassword,
        meetingProvider,
        timezone,
        teacherInfo,
      ]
    );

    const sessions = await this.listSessions(teacherId);
    return sessions.find((s) => s.id === row!.id)!;
  }

  async updateSession(
    teacherId: string,
    sessionId: string,
    data: {
      title?: string;
      scheduled_at?: string;
      scheduledAt?: string;
      duration_minutes?: number;
      durationMinutes?: number;
      timezone?: string;
      teacher_info?: string;
      teacherInfo?: string;
    }
  ): Promise<ClassSessionRecord> {
    const existing = await queryOne<ClassSessionRecord>(
      `SELECT * FROM class_sessions WHERE id = $1`,
      [sessionId]
    );
    if (!existing) throw new NotFoundError('Session not found.');
    if (existing.teacher_id !== teacherId) {
      throw new ForbiddenError('You are not authorized to update this session.');
    }
    if (existing.status === 'cancelled') {
      throw new BadRequestError('Cannot update a cancelled session.');
    }

    const title = data.title?.trim() || existing.title;
    const scheduledAt = data.scheduled_at || data.scheduledAt || existing.scheduled_at;
    const durationMinutes = data.duration_minutes || data.durationMinutes || existing.duration_minutes;
    const timezone = data.timezone || existing.timezone || 'UTC';
    const teacherInfo =
      data.teacher_info !== undefined
        ? data.teacher_info
        : data.teacherInfo !== undefined
        ? data.teacherInfo
        : existing.teacher_info;

    // Reschedule existing Zoom meeting if present
    if (existing.meeting_id) {
      try {
        await zoomService.updateMeeting(teacherId, existing.meeting_id, {
          topic: title,
          scheduledAt,
          durationMinutes,
          timezone,
        });
      } catch (err: any) {
        console.warn('Notice: Failed to update Zoom meeting on Zoom API:', err.message);
      }
    }

    await query(
      `UPDATE class_sessions
       SET title = $1, scheduled_at = $2, duration_minutes = $3, timezone = $4, teacher_info = $5, updated_at = NOW()
       WHERE id = $6`,
      [title, scheduledAt, durationMinutes, timezone, teacherInfo, sessionId]
    );

    const sessions = await this.listSessions(teacherId);
    return sessions.find((s) => s.id === sessionId)!;
  }

  async cancelSession(teacherId: string, sessionId: string): Promise<ClassSessionRecord> {
    const existing = await queryOne<ClassSessionRecord>(
      `SELECT * FROM class_sessions WHERE id = $1`,
      [sessionId]
    );
    if (!existing) throw new NotFoundError('Session not found.');
    if (existing.teacher_id !== teacherId) {
      throw new ForbiddenError('You are not authorized to cancel this session.');
    }

    // Cancel remote Zoom meeting if present
    if (existing.meeting_id) {
      await zoomService.deleteMeeting(teacherId, existing.meeting_id);
    }

    await query(
      `UPDATE class_sessions
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    const sessions = await this.listSessions(teacherId);
    return sessions.find((s) => s.id === sessionId)!;
  }
}

export const teachingService = new TeachingService();
