import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Avatar } from '../../app/components/Avatar';
import { navigate } from '../../app/navigation';
import { useAuthGate } from '../../app/session/AuthGateContext';
import type {
  TeachingProfile,
  TeachingRequest,
  ClassItem,
  StudentItem,
  ClassSession,
} from '../../app/data/models';

interface TeachingViewProps {
  isAuthenticated: boolean;
}

export function TeachingView({ isAuthenticated }: TeachingViewProps) {
  const { requireAuth } = useAuthGate();

  const [profile, setProfile] = useState<TeachingProfile | null>(null);
  const [requests, setRequests] = useState<{ incoming: TeachingRequest[]; outgoing: TeachingRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Modals & forms
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editStatus, setEditStatus] = useState<'available' | 'busy' | 'paused'>('available');
  const [editSkills, setEditSkills] = useState('');

  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [classTitle, setClassTitle] = useState('');
  const [classSkill, setClassSkill] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classSchedule, setClassSchedule] = useState('');
  const [classMeetingUrl, setClassMeetingUrl] = useState('');

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDuration, setSessionDuration] = useState('45');
  const [sessionMeetingUrl, setSessionMeetingUrl] = useState('');

  const loadAllTeachingData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setErrorNotice('');
    try {
      const [p, r, st, cl, se] = await Promise.all([
        api.teaching.getProfile().catch(() => null),
        api.teaching.getRequests().catch(() => ({ incoming: [], outgoing: [] })),
        api.teaching.getStudents().catch(() => []),
        api.teaching.getClasses().catch(() => []),
        api.teaching.getSessions().catch(() => []),
      ]);

      if (p) {
        setProfile(p);
        setEditHeadline(p.headline);
        setEditBio(p.bio);
        setEditRate(p.hourly_rate);
        setEditStatus(p.status);
        setEditSkills(p.skills.join(', '));
      }
      setRequests(r);
      setStudents(Array.isArray(st) ? st : []);
      setClasses(Array.isArray(cl) ? cl : []);
      setSessions(Array.isArray(se) ? se : []);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to load teaching data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllTeachingData();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth('update teaching profile', () => {})) return;
    try {
      const skillsArray = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await api.teaching.updateProfile({
        headline: editHeadline.trim(),
        bio: editBio.trim(),
        hourly_rate: editRate.trim(),
        status: editStatus,
        skills: skillsArray,
      });

      setProfile(updated);
      setIsEditingProfile(false);
      setSuccessNotice('Teaching profile updated successfully.');
      setTimeout(() => setSuccessNotice(''), 3500);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update teaching profile.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.teaching.acceptRequest(requestId);
      setSuccessNotice('Teaching request accepted. Student connected and chat created.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadAllTeachingData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.teaching.declineRequest(requestId);
      setSuccessNotice('Teaching request declined.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadAllTeachingData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to decline request.');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle.trim() || !classSkill.trim()) return;
    try {
      await api.teaching.createClass({
        title: classTitle.trim(),
        skill: classSkill.trim(),
        description: classDesc.trim(),
        schedule: classSchedule.trim(),
        meeting_url: classMeetingUrl.trim() || undefined,
      });

      setClassTitle('');
      setClassSkill('');
      setClassDesc('');
      setClassSchedule('');
      setClassMeetingUrl('');
      setIsCreatingClass(false);
      setSuccessNotice('Class created successfully with group chat room.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadAllTeachingData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to create class.');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate) return;
    try {
      await api.teaching.createSession({
        title: sessionTitle.trim(),
        scheduled_at: new Date(sessionDate).toISOString(),
        duration_minutes: Number(sessionDuration) || 45,
        meeting_url: sessionMeetingUrl.trim() || undefined,
      });

      setSessionTitle('');
      setSessionDate('');
      setSessionMeetingUrl('');
      setIsCreatingSession(false);
      setSuccessNotice('Live session scheduled successfully.');
      setTimeout(() => setSuccessNotice(''), 3500);
      loadAllTeachingData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to schedule session.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="teaching-unauth-card" style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #dfddd8' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#141514', marginBottom: '8px' }}>Teaching & Mentorship Studio</h2>
        <p style={{ fontSize: '14px', color: '#656862', maxWidth: '480px', margin: '0 auto 20px' }}>
          Connect your expertise with learners. Manage your teaching availability, conduct classes, and schedule live sessions.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => requireAuth('access the Teaching Studio', () => {})}
        >
          Sign In to Access Teaching Studio &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-view-root" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Notifications */}
      {isLoading && (
        <div style={{ padding: '8px 16px', background: '#f5f3ee', border: '1px solid #dfddd8', borderRadius: '8px', color: '#656862', fontSize: '12.5px' }}>
          Synchronizing teaching studio with PostgreSQL...
        </div>
      )}
      {successNotice && (
        <div style={{ padding: '12px 16px', background: '#eef6ec', border: '1px solid #c8e4c3', borderRadius: '8px', color: '#2b5420', fontSize: '13px' }}>
          ✓ {successNotice}
        </div>
      )}
      {errorNotice && (
        <div style={{ padding: '12px 16px', background: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '8px', color: '#9b1c1c', fontSize: '13px' }}>
          ⚠️ {errorNotice}
        </div>
      )}


      {/* 1. Teacher Profile Header Card */}
      <div className="teaching-card" style={{ background: '#fff', border: '1px solid #dfddd8', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Avatar name={profile?.name || 'Teacher'} avatarUrl={profile?.avatar_url} personId={profile?.user_id} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#141514' }}>{profile?.name}</h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: profile?.status === 'available' ? '#eef6ec' : profile?.status === 'busy' ? '#fef3c7' : '#f3f4f6',
                    color: profile?.status === 'available' ? '#2b5420' : profile?.status === 'busy' ? '#92400e' : '#4b5563',
                    border: '1px solid currentColor',
                  }}
                >
                  {profile?.status || 'available'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#656862' }}>
                {profile?.headline || 'Expert Practitioner & Mentor'}
              </p>
              {profile?.hourly_rate && (
                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '12.5px', fontWeight: 600, color: '#141514' }}>
                  Rate: {profile.hourly_rate}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              {isEditingProfile ? 'Close Editor' : 'Edit Teaching Profile'}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsCreatingClass(true)}
            >
              + Create Class
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsCreatingSession(true)}
            >
              + Schedule Session
            </button>
          </div>
        </div>

        {/* Skills Deck */}
        {profile?.skills && profile.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0eee8' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8e948d', marginRight: '4px', alignSelf: 'center' }}>
              Teaching:
            </span>
            {profile.skills.map((sk) => (
              <span key={sk} style={{ fontSize: '12px', background: '#f5f3ee', color: '#141514', padding: '3px 10px', borderRadius: '999px', border: '1px solid #dfddd8' }}>
                #{sk}
              </span>
            ))}
          </div>
        )}

        {/* Profile Edit Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dfddd8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Edit Teaching Profile</h3>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#656862' }}>Headline</label>
              <input
                type="text"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                placeholder="e.g. Senior Systems Engineer & Rust Mentor"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#656862' }}>Bio / Teaching Philosophy</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                placeholder="Describe your mentorship style and background..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#656862' }}>Hourly Rate or Exchange</label>
                <input
                  type="text"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  placeholder="e.g. Free / Skill Exchange / $45/hr"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#656862' }}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
                >
                  <option value="available">Available for Mentorship</option>
                  <option value="busy">Busy / Limited Slots</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#656862' }}>Teaching Skills (comma separated)</label>
              <input
                type="text"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="TypeScript, Three.js, Distributed Systems"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="secondary-button" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button type="submit" className="primary-button">Save Profile</button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Teaching Requests Section */}
      <div className="teaching-card" style={{ background: '#fff', border: '1px solid #dfddd8', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#141514' }}>
          Incoming Teaching Requests ({requests.incoming.filter((r) => r.status === 'pending').length})
        </h3>

        {requests.incoming.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fbf9f5', borderRadius: '8px', border: '1px dashed #dfddd8', color: '#656862', fontSize: '13.5px' }}>
            No teaching requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.incoming.map((req) => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fbf9f5', borderRadius: '8px', border: '1px solid #dfddd8', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Avatar name={req.student_name} avatarUrl={req.student_avatar_url} personId={req.student_id} small />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#141514' }}>{req.student_name}</strong>
                    <span style={{ fontSize: '12px', color: '#656862', marginLeft: '6px' }}>wants to learn <strong>#{req.skill}</strong></span>
                    {req.message && <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#4b5563' }}>"{req.message}"</p>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {req.status === 'pending' ? (
                    <>
                      <button type="button" className="primary-button" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => handleAcceptRequest(req.id)}>
                        Accept & Connect
                      </button>
                      <button type="button" className="secondary-button" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => handleDeclineRequest(req.id)}>
                        Decline
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: req.status === 'accepted' ? '#2b5420' : '#9b1c1c', textTransform: 'capitalize' }}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. My Classes Section */}
      <div className="teaching-card" style={{ background: '#fff', border: '1px solid #dfddd8', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#141514' }}>
            Classes ({classes.length})
          </h3>
          <button type="button" className="secondary-button" onClick={() => setIsCreatingClass(!isCreatingClass)}>
            {isCreatingClass ? 'Close' : '+ New Class'}
          </button>
        </div>

        {/* Create Class Form */}
        {isCreatingClass && (
          <form onSubmit={handleCreateClass} style={{ marginBottom: '20px', padding: '16px', background: '#fbf9f5', borderRadius: '8px', border: '1px solid #dfddd8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Launch a Collaborative Class</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Class Title (e.g. Masterclass: Full-Stack React)"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder="Focus Skill (e.g. React)"
                value={classSkill}
                onChange={(e) => setClassSkill(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
            </div>
            <textarea
              placeholder="Class description and curriculum overview..."
              value={classDesc}
              onChange={(e) => setClassDesc(e.target.value)}
              rows={2}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px', resize: 'vertical' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Schedule (e.g. Tuesdays & Thursdays 6 PM IST)"
                value={classSchedule}
                onChange={(e) => setClassSchedule(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
              <input
                type="url"
                placeholder="Zoom / Google Meet URL"
                value={classMeetingUrl}
                onChange={(e) => setClassMeetingUrl(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-button" onClick={() => setIsCreatingClass(false)}>Cancel</button>
              <button type="submit" className="primary-button">Publish Class</button>
            </div>
          </form>
        )}

        {classes.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fbf9f5', borderRadius: '8px', border: '1px dashed #dfddd8', color: '#656862', fontSize: '13.5px' }}>
            No classes yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {classes.map((cls) => (
              <div key={cls.id} style={{ background: '#fbf9f5', border: '1px solid #dfddd8', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#141514' }}>{cls.title}</h4>
                    <span style={{ fontSize: '11px', background: '#eef3e8', color: '#3b5528', padding: '2px 8px', borderRadius: '999px', border: '1px solid #c9d8bf', fontWeight: 600 }}>
                      #{cls.skill}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#656862', margin: '4px 0 10px 0' }}>{cls.description}</p>
                  {cls.schedule && (
                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '8px' }}>
                      🗓️ <strong>{cls.schedule}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#8e948d', marginBottom: '12px' }}>
                    👥 {cls.member_count} / {cls.max_students} Students Enrolled
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e8e5dc', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    onClick={() => navigate('chat')}
                  >
                    💬 Class Group Chat
                  </button>
                  {cls.meeting_url && (
                    <a
                      href={cls.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary-button"
                      style={{ fontSize: '11.5px', padding: '4px 10px', textDecoration: 'none' }}
                    >
                      Join Meeting &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. My Students Section */}
      <div className="teaching-card" style={{ background: '#fff', border: '1px solid #dfddd8', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#141514' }}>
          My Students ({students.length})
        </h3>

        {students.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fbf9f5', borderRadius: '8px', border: '1px dashed #dfddd8', color: '#656862', fontSize: '13.5px' }}>
            No students yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {students.map((st) => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fbf9f5', borderRadius: '8px', border: '1px solid #dfddd8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={st.name} avatarUrl={st.avatar_url} personId={st.id} small />
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#141514', display: 'block' }}>{st.name}</strong>
                    <span style={{ fontSize: '11.5px', color: '#656862' }}>Learning #{st.skill}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => navigate('chat')}
                >
                  Chat &rarr;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Scheduled Sessions Section */}
      <div className="teaching-card" style={{ background: '#fff', border: '1px solid #dfddd8', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#141514' }}>
            Upcoming Sessions ({sessions.length})
          </h3>
          <button type="button" className="secondary-button" onClick={() => setIsCreatingSession(!isCreatingSession)}>
            {isCreatingSession ? 'Close' : '+ Schedule Session'}
          </button>
        </div>

        {/* Create Session Form */}
        {isCreatingSession && (
          <form onSubmit={handleCreateSession} style={{ marginBottom: '20px', padding: '16px', background: '#fbf9f5', borderRadius: '8px', border: '1px solid #dfddd8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Schedule Live Mentorship or Class Session</h4>
            <input
              type="text"
              placeholder="Session Title (e.g. Architecture Deep-Dive & Code Review)"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              required
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
              <input
                type="number"
                placeholder="Duration (mins)"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
              <input
                type="url"
                placeholder="Meeting Link (Zoom / Meet)"
                value={sessionMeetingUrl}
                onChange={(e) => setSessionMeetingUrl(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfddd8', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-button" onClick={() => setIsCreatingSession(false)}>Cancel</button>
              <button type="submit" className="primary-button">Schedule</button>
            </div>
          </form>
        )}

        {sessions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fbf9f5', borderRadius: '8px', border: '1px dashed #dfddd8', color: '#656862', fontSize: '13.5px' }}>
            <strong style={{ display: 'block', color: '#141514', marginBottom: '4px' }}>NO UPCOMING SESSION</strong>
            No live session has been scheduled yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map((sess) => (
              <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fbf9f5', borderRadius: '8px', border: '1px solid #dfddd8', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#141514', display: 'block' }}>{sess.title}</strong>
                  <span style={{ fontSize: '12px', color: '#656862' }}>
                    🗓️ {new Date(sess.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &bull; {sess.duration_minutes} mins
                    {sess.class_title && ` &bull; Class: ${sess.class_title}`}
                  </span>
                </div>
                {sess.meeting_url && (
                  <a
                    href={sess.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button"
                    style={{ fontSize: '12px', padding: '5px 12px', textDecoration: 'none' }}
                  >
                    Join Session &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
