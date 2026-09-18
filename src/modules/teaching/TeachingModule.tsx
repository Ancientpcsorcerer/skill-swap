import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Avatar } from '../../app/components/Avatar';
import { navigate, useApplicationRoute } from '../../app/navigation';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { useSession } from '../../app/session/SessionProvider';
import type {
  TeachingProfile,
  TeachingRequest,
  ClassItem,
  StudentItem,
  ClassSession,
  ZoomStatus,
} from '../../app/data/models';
import '../../styles/teaching.css';

type TeachingTab = 'profile' | 'requests' | 'students' | 'classes' | 'messages' | 'availability';

export function TeachingModule() {
  const route = useApplicationRoute();
  const { session } = useSession();
  const { openAuthModal } = useAuthGate();

  const tabQuery = route.query.get('tab') as TeachingTab | null;
  const initialTab: TeachingTab =
    tabQuery && ['profile', 'requests', 'students', 'classes', 'messages', 'availability'].includes(tabQuery)
      ? tabQuery
      : 'classes';

  const [activeTab, setActiveTab] = useState<TeachingTab>(initialTab);

  // Sync tab with route query if changed externally
  useEffect(() => {
    if (tabQuery && tabQuery !== activeTab && ['profile', 'requests', 'students', 'classes', 'messages', 'availability'].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleSelectTab = (tab: TeachingTab) => {
    setActiveTab(tab);
    navigate('teaching', undefined, false, { tab });
  };

  // Section-level independent data states (Smart Parallel Hydration)
  const [profile, setProfile] = useState<TeachingProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [requests, setRequests] = useState<{ incoming: TeachingRequest[]; outgoing: TeachingRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [zoomStatus, setZoomStatus] = useState<ZoomStatus | null>(null);
  const [zoomLoading, setZoomLoading] = useState(true);

  // Global notices
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Modals state
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
  const [classMaxStudents, setClassMaxStudents] = useState('25');

  // Schedule Session Modal
  const [isSchedulingSession, setIsSchedulingSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionClassId, setSessionClassId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('18:00');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [sessionTimezone, setSessionTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [sessionTeacherInfo, setSessionTeacherInfo] = useState('');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  // Edit / Reschedule Session Modal
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionDate, setEditSessionDate] = useState('');
  const [editSessionTime, setEditSessionTime] = useState('18:00');
  const [editSessionDuration, setEditSessionDuration] = useState('60');
  const [editSessionTimezone, setEditSessionTimezone] = useState('UTC');
  const [editSessionTeacherInfo, setEditSessionTeacherInfo] = useState('');
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);

  // Cancel Session Confirmation
  const [cancellingSession, setCancellingSession] = useState<ClassSession | null>(null);
  const [isCancellingSession, setIsCancellingSession] = useState(false);

  const isAuthenticated = Boolean(session?.identity?.id);

  // Parallel Data Hydration
  const hydrateData = useCallback(async () => {
    if (!isAuthenticated) return;

    // 1. Fetch Profile
    api.teaching
      .getProfile()
      .then((p) => {
        if (p) {
          setProfile(p);
          setEditHeadline(p.headline || '');
          setEditBio(p.bio || '');
          setEditRate(p.hourly_rate || '');
          setEditStatus(p.status || 'available');
          setEditSkills(p.skills?.join(', ') || '');
        }
      })
      .catch((err) => console.warn('Failed to load teaching profile:', err))
      .finally(() => setProfileLoading(false));

    // 2. Fetch Requests
    api.teaching
      .getRequests()
      .then((r) => setRequests(r))
      .catch((err) => console.warn('Failed to load requests:', err))
      .finally(() => setRequestsLoading(false));

    // 3. Fetch Students
    api.teaching
      .getStudents()
      .then((st) => setStudents(Array.isArray(st) ? st : []))
      .catch((err) => console.warn('Failed to load students:', err))
      .finally(() => setStudentsLoading(false));

    // 4. Fetch Classes
    api.teaching
      .getClasses()
      .then((cl) => setClasses(Array.isArray(cl) ? cl : []))
      .catch((err) => console.warn('Failed to load classes:', err))
      .finally(() => setClassesLoading(false));

    // 5. Fetch Sessions
    api.teaching
      .getSessions()
      .then((se) => setSessions(Array.isArray(se) ? se : []))
      .catch((err) => console.warn('Failed to load sessions:', err))
      .finally(() => setSessionsLoading(false));

    // 6. Fetch Zoom Status
    api.teaching
      .getZoomStatus()
      .then((zs) => setZoomStatus(zs))
      .catch((err) => console.warn('Failed to load zoom status:', err))
      .finally(() => setZoomLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      hydrateData();
    } else {
      setProfileLoading(false);
      setRequestsLoading(false);
      setStudentsLoading(false);
      setClassesLoading(false);
      setSessionsLoading(false);
      setZoomLoading(false);
    }
  }, [isAuthenticated, hydrateData]);

  // Handle Zoom Connection Flow
  const handleConnectZoom = async () => {
    try {
      const authUrl = await api.teaching.getZoomAuthorizeUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Unable to start Zoom authorization. Ensure Zoom credentials are configured on backend.');
    }
  };

  const handleDisconnectZoom = async () => {
    if (!confirm('Disconnect your Zoom integration? Existing scheduled sessions will retain their links, but new sessions will not auto-generate Zoom meetings.')) {
      return;
    }
    try {
      await api.teaching.disconnectZoom();
      setZoomStatus({ connected: false, configured: true, message: 'Disconnected' });
      setSuccessNotice('Zoom integration disconnected.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to disconnect Zoom.');
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorNotice('');
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
      setSuccessNotice('Teaching profile updated.');
      setTimeout(() => setSuccessNotice(''), 3500);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save teaching profile.');
    }
  };

  // Handle Requests
  const handleAcceptRequest = async (requestId: string) => {
    try {
      setErrorNotice('');
      await api.teaching.acceptRequest(requestId);
      setSuccessNotice('Teaching request accepted. Student connected.');
      setTimeout(() => setSuccessNotice(''), 3500);
      hydrateData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setErrorNotice('');
      await api.teaching.declineRequest(requestId);
      setSuccessNotice('Teaching request declined.');
      setTimeout(() => setSuccessNotice(''), 3500);
      hydrateData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to decline request.');
    }
  };

  // Handle Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle.trim() || !classSkill.trim()) return;
    try {
      setErrorNotice('');
      await api.teaching.createClass({
        title: classTitle.trim(),
        skill: classSkill.trim(),
        description: classDesc.trim(),
        schedule: classSchedule.trim() || undefined,
        max_students: Number(classMaxStudents) || 25,
      });

      setClassTitle('');
      setClassSkill('');
      setClassDesc('');
      setClassSchedule('');
      setIsCreatingClass(false);
      setSuccessNotice('Class created successfully.');
      setTimeout(() => setSuccessNotice(''), 3500);
      api.teaching.getClasses().then((cl) => setClasses(cl));
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to create class.');
    }
  };

  // Open Schedule Session Form
  const handleOpenScheduleSession = (presetClassId?: string) => {
    if (presetClassId) {
      setSessionClassId(presetClassId);
      const foundCls = classes.find((c) => c.id === presetClassId);
      if (foundCls && !sessionTitle) {
        setSessionTitle(`Session: ${foundCls.title}`);
      }
    }
    // Set default tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSessionDate(dateStr);
    setIsSchedulingSession(true);
  };

  // Handle Create Session with Auto-Generated Zoom Meeting
  const handleScheduleSessionSubmit = async (e: React.FormEvent, requireZoomMeeting: boolean) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !sessionDate || !sessionTime) {
      setErrorNotice('Please fill in session title, date, and start time.');
      return;
    }

    try {
      setErrorNotice('');
      setIsCreatingMeeting(true);

      const scheduledAtIso = new Date(`${sessionDate}T${sessionTime}:00`).toISOString();

      const created = await api.teaching.createSession({
        title: sessionTitle.trim(),
        class_id: sessionClassId || undefined,
        scheduled_at: scheduledAtIso,
        duration_minutes: Number(sessionDuration) || 60,
        timezone: sessionTimezone,
        teacher_info: sessionTeacherInfo.trim() || undefined,
        require_zoom: requireZoomMeeting,
      });

      setIsSchedulingSession(false);
      setSessionTitle('');
      setSessionTeacherInfo('');
      setSuccessNotice(
        created.meeting_url
          ? 'Live Zoom session scheduled and verified with Zoom API.'
          : 'Session scheduled successfully.'
      );
      setTimeout(() => setSuccessNotice(''), 4500);
      api.teaching.getSessions().then((se) => setSessions(se));
    } catch (err: any) {
      setErrorNotice(
        err.message?.includes('Zoom')
          ? `Unable to create Zoom meeting: ${err.message}`
          : err.message || 'Failed to schedule session.'
      );
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // Open Edit Session Dialog
  const handleOpenEditSession = (sessionItem: ClassSession) => {
    setEditingSession(sessionItem);
    setEditSessionTitle(sessionItem.title);
    setEditSessionDuration(String(sessionItem.duration_minutes || 60));
    setEditSessionTimezone(sessionItem.timezone || 'UTC');
    setEditSessionTeacherInfo(sessionItem.teacher_info || '');

    // Parse date and time
    try {
      const d = new Date(sessionItem.scheduled_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setEditSessionDate(`${year}-${month}-${day}`);
      setEditSessionTime(`${hours}:${minutes}`);
    } catch {
      setEditSessionDate('');
      setEditSessionTime('18:00');
    }
  };

  // Handle Save Rescheduled / Edited Session
  const handleUpdateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !editSessionTitle.trim() || !editSessionDate || !editSessionTime) return;

    try {
      setErrorNotice('');
      setIsUpdatingSession(true);

      const scheduledAtIso = new Date(`${editSessionDate}T${editSessionTime}:00`).toISOString();

      const updated = await api.teaching.updateSession(editingSession.id, {
        title: editSessionTitle.trim(),
        scheduled_at: scheduledAtIso,
        duration_minutes: Number(editSessionDuration) || 60,
        timezone: editSessionTimezone,
        teacher_info: editSessionTeacherInfo.trim() || undefined,
      });

      // Update session locally
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingSession(null);
      setSuccessNotice('Session and Zoom meeting details updated successfully.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update session.');
    } finally {
      setIsUpdatingSession(false);
    }
  };

  // Handle Cancel Session
  const handleConfirmCancelSession = async () => {
    if (!cancellingSession) return;
    try {
      setErrorNotice('');
      setIsCancellingSession(true);

      const cancelled = await api.teaching.cancelSession(cancellingSession.id);
      setSessions((prev) => prev.map((s) => (s.id === cancelled.id ? cancelled : s)));
      setCancellingSession(null);
      setSuccessNotice('Session has been cancelled and Zoom meeting removed.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to cancel session.');
    } finally {
      setIsCancellingSession(false);
    }
  };

  // Unauthenticated fallback shell
  if (!isAuthenticated) {
    return (
      <div className="teaching-module-root">
        <div className="teaching-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#141514', marginBottom: '8px' }}>
            Teaching Studio
          </h2>
          <p style={{ fontSize: '14px', color: '#656862', maxWidth: '480px', margin: '0 auto 20px' }}>
            Sign in to access your teaching dashboard, manage student relationships, launch classes, and schedule verified Zoom sessions.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => openAuthModal('login')}
          >
            Sign In to Access Teaching &rarr;
          </button>
        </div>
      </div>
    );
  }

  const pendingRequestsCount = requests.incoming.filter((r) => r.status === 'pending').length;

  return (
    <div className="teaching-module-root">
      {/* 1. Instant Editorial Hero Shell */}
      <div className="teaching-hero-banner">
        <div className="teaching-hero-content">
          <h1>Teaching Studio</h1>
          <p>
            Authoritative mentorship command center. Manage students, host interactive classes, and schedule automatically synchronized Zoom sessions.
          </p>
        </div>
        <div className="teaching-hero-actions">
          <button
            type="button"
            className="primary-button"
            style={{ background: '#ffffff', color: '#141514', fontWeight: 600 }}
            onClick={() => handleOpenScheduleSession()}
          >
            + Schedule Session
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => setIsCreatingClass(true)}
          >
            + New Class
          </button>
        </div>
      </div>

      {/* Notices */}
      {successNotice && (
        <div style={{ padding: '12px 18px', background: '#eef6ec', border: '1px solid #c8e4c3', borderRadius: '8px', color: '#2b5420', fontSize: '13.5px', fontWeight: 500 }}>
          ✓ {successNotice}
        </div>
      )}
      {errorNotice && (
        <div style={{ padding: '12px 18px', background: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '8px', color: '#9b1c1c', fontSize: '13.5px', fontWeight: 500 }}>
          ⚠️ {errorNotice}
        </div>
      )}

      {/* 2. Sub-Navigation Tabs */}
      <nav className="teaching-tabs-nav" aria-label="Teaching management tabs">
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => handleSelectTab('classes')}
        >
          Classes & Sessions
        </button>
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => handleSelectTab('requests')}
        >
          Teaching Requests
          {pendingRequestsCount > 0 && (
            <span className="teaching-badge-count">{pendingRequestsCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => handleSelectTab('students')}
        >
          My Students ({students.length})
        </button>
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleSelectTab('profile')}
        >
          Teaching Profile
        </button>
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => handleSelectTab('messages')}
        >
          Messages
        </button>
        <button
          type="button"
          className={`teaching-tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => handleSelectTab('availability')}
        >
          Availability & Zoom
          {zoomStatus?.connected && (
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} title="Zoom Connected" />
          )}
        </button>
      </nav>

      {/* 3. Section Content */}

      {/* TAB: CLASSES & SESSIONS */}
      {activeTab === 'classes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Sessions Subsection */}
          <div className="teaching-card">
            <div className="teaching-card-header">
              <div>
                <h2>Scheduled Sessions ({sessions.length})</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                  Live Zoom video sessions backed by PostgreSQL and Zoom API.
                </p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleOpenScheduleSession()}
              >
                + Schedule Session
              </button>
            </div>

            {sessionsLoading ? (
              <div className="teaching-skeleton-block">Loading scheduled sessions from PostgreSQL...</div>
            ) : sessions.length === 0 ? (
              <div className="teaching-skeleton-block" style={{ borderStyle: 'dashed' }}>
                <strong style={{ display: 'block', color: '#141514', marginBottom: '4px' }}>
                  No upcoming sessions
                </strong>
                Schedule a session for a class or private student. Zoom meetings are automatically created.
              </div>
            ) : (
              <div className="sessions-grid">
                {sessions.map((sess) => {
                  const isCancelled = sess.status === 'cancelled';
                  let formattedDate = sess.scheduled_at;
                  let formattedTime = '';
                  try {
                    const d = new Date(sess.scheduled_at);
                    formattedDate = d.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                    const end = new Date(d.getTime() + (sess.duration_minutes || 60) * 60000);
                    formattedTime = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  } catch {
                    formattedTime = `${sess.duration_minutes} mins`;
                  }

                  return (
                    <div
                      key={sess.id}
                      className={`session-card ${isCancelled ? 'cancelled' : ''}`}
                    >
                      <div className="session-title-block">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <h4>{sess.title}</h4>
                          <span className={`session-status-badge ${sess.status}`}>
                            {sess.status}
                          </span>
                        </div>
                        <div className="session-timing-meta">
                          <span>🗓️ <strong>{formattedDate}</strong></span>
                          <span>⏰ {formattedTime}</span>
                          <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px' }}>
                            {sess.timezone || 'UTC'}
                          </span>
                          {sess.class_title && (
                            <span style={{ color: '#2b5420', fontWeight: 600 }}>
                              Class: {sess.class_title}
                            </span>
                          )}
                        </div>
                        {sess.teacher_info && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#656862' }}>
                            {sess.teacher_info}
                          </p>
                        )}
                      </div>

                      <div className="session-actions">
                        {!isCancelled && sess.meeting_url ? (
                          <a
                            href={sess.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="primary-button"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            Join Meeting &rarr;
                          </a>
                        ) : !isCancelled && !sess.meeting_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#92400e' }}>
                              Meeting not configured
                            </span>
                            <button
                              type="button"
                              className="secondary-button"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={handleConnectZoom}
                            >
                              Connect Zoom
                            </button>
                          </div>
                        ) : null}

                        {!isCancelled && (
                          <>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => handleOpenEditSession(sess)}
                            >
                              Edit / Reschedule
                            </button>
                            <button
                              type="button"
                              className="quiet-button"
                              style={{ color: '#dc2626' }}
                              onClick={() => setCancellingSession(sess)}
                            >
                              Cancel Session
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Classes Subsection */}
          <div className="teaching-card">
            <div className="teaching-card-header">
              <div>
                <h2>Interactive Classes ({classes.length})</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                  Multi-student cohort courses with dedicated group discussions.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsCreatingClass(true)}
              >
                + New Class
              </button>
            </div>

            {classesLoading ? (
              <div className="teaching-skeleton-block">Loading class cohorts...</div>
            ) : classes.length === 0 ? (
              <div className="teaching-skeleton-block">
                No classes launched yet. Create your first cohort class above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    style={{
                      background: '#fbfbf9',
                      border: '1px solid var(--workspace-line, #dfddd8)',
                      borderRadius: '10px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#141514' }}>
                          {cls.title}
                        </h4>
                        <span style={{ fontSize: '11px', background: '#eef6ec', color: '#2b5420', padding: '2px 8px', borderRadius: '999px', border: '1px solid #c8e4c3', fontWeight: 600 }}>
                          #{cls.skill}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#656862', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                        {cls.description}
                      </p>
                      {cls.schedule && (
                        <div style={{ fontSize: '12.5px', color: '#4b5563', marginBottom: '6px' }}>
                          🗓️ <strong>{cls.schedule}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#8e948d', marginBottom: '14px' }}>
                        👥 {cls.member_count} / {cls.max_students} Students Enrolled
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #ece9e3', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        onClick={() => handleOpenScheduleSession(cls.id)}
                      >
                        Schedule Session
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        onClick={() => navigate('chat')}
                      >
                        💬 Group Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: TEACHING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="teaching-card">
          <div className="teaching-card-header">
            <div>
              <h2>Incoming Teaching Requests ({requests.incoming.length})</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                Learners requesting one-on-one mentorship or skill exchange.
              </p>
            </div>
          </div>

          {requestsLoading ? (
            <div className="teaching-skeleton-block">Loading teaching requests...</div>
          ) : requests.incoming.length === 0 ? (
            <div className="teaching-skeleton-block">
              No teaching requests yet. Learners can discover your skills on the Discover and Connect pages.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.incoming.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: '#fbfbf9',
                    borderRadius: '10px',
                    border: '1px solid var(--workspace-line, #dfddd8)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <Avatar name={req.student_name} avatarUrl={req.student_avatar_url} personId={req.student_id} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#141514' }}>{req.student_name}</strong>
                        <span style={{ fontSize: '12px', color: '#656862' }}>
                          wants mentorship in <strong style={{ color: '#2b5420' }}>#{req.skill}</strong>
                        </span>
                      </div>
                      {req.message && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleAcceptRequest(req.id)}
                        >
                          Accept & Connect
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleDeclineRequest(req.id)}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: req.status === 'accepted' ? '#2b5420' : '#9b1c1c',
                        }}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: MY STUDENTS */}
      {activeTab === 'students' && (
        <div className="teaching-card">
          <div className="teaching-card-header">
            <div>
              <h2>My Students ({students.length})</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                Learners currently enrolled in your classes or paired through accepted mentorship requests.
              </p>
            </div>
          </div>

          {studentsLoading ? (
            <div className="teaching-skeleton-block">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="teaching-skeleton-block">
              No students enrolled yet. Once you accept a request or a student joins a class, they appear here.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {students.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px',
                    background: '#fbfbf9',
                    borderRadius: '10px',
                    border: '1px solid var(--workspace-line, #dfddd8)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={st.name} avatarUrl={st.avatar_url} personId={st.id} />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#141514', display: 'block' }}>{st.name}</strong>
                      <span style={{ fontSize: '12px', color: '#656862' }}>
                        Learning #{st.skill} &bull; {st.relationship_type === 'class' ? 'Cohort' : 'Direct'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                    onClick={() => navigate('chat', undefined, false, { user: st.id })}
                  >
                    Chat &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TEACHING PROFILE */}
      {activeTab === 'profile' && (
        <div className="teaching-card">
          <div className="teaching-card-header">
            <div>
              <h2>Teaching Profile</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                Your public educator persona, mentorship focus, and availability status.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              {isEditingProfile ? 'Close Editor' : 'Edit Teaching Profile'}
            </button>
          </div>

          {profileLoading ? (
            <div className="teaching-skeleton-block">Loading teaching profile...</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
                <Avatar name={profile?.name || 'Teacher'} avatarUrl={profile?.avatar_url} personId={profile?.user_id} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{profile?.name}</h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: profile?.status === 'available' ? '#eef6ec' : '#fef3c7',
                        color: profile?.status === 'available' ? '#2b5420' : '#92400e',
                        border: '1px solid currentColor',
                      }}
                    >
                      {profile?.status || 'available'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#656862' }}>
                    {profile?.headline || 'Expert Practitioner & Mentor'}
                  </p>
                  {profile?.hourly_rate && (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#141514' }}>
                      Rate: {profile.hourly_rate}
                    </span>
                  )}
                </div>
              </div>

              {profile?.bio && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#fbfbf9', borderRadius: '8px', border: '1px solid #dfddd8' }}>
                  <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#8e948d', marginBottom: '4px' }}>
                    Teaching Philosophy & Background
                  </strong>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: 1.5 }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#8e948d', marginBottom: '8px' }}>
                    Focus Skills
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profile.skills.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: '12.5px',
                          background: '#f5f3ee',
                          color: '#141514',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          border: '1px solid #dfddd8',
                          fontWeight: 500,
                        }}
                      >
                        #{sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Profile Edit Form */}
              {isEditingProfile && (
                <form
                  onSubmit={handleSaveProfile}
                  style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid #dfddd8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Update Teaching Profile</h4>
                  <div className="teaching-form-group">
                    <label>Headline</label>
                    <input
                      type="text"
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      placeholder="e.g. Senior Distributed Systems Engineer & Rust Mentor"
                    />
                  </div>
                  <div className="teaching-form-group">
                    <label>Bio / Teaching Approach</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      placeholder="Share your experience and mentoring philosophy..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="teaching-form-group">
                      <label>Hourly Rate / Exchange Terms</label>
                      <input
                        type="text"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        placeholder="e.g. Skill Swap / Free / $50/hr"
                      />
                    </div>
                    <div className="teaching-form-group">
                      <label>Availability Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                      >
                        <option value="available">Available for Mentorship</option>
                        <option value="busy">Busy / Limited Slots</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>
                  <div className="teaching-form-group">
                    <label>Teaching Skills (comma separated)</label>
                    <input
                      type="text"
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      placeholder="e.g. React, TypeScript, GraphQL, Rust"
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Save Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="teaching-card">
          <div className="teaching-card-header">
            <div>
              <h2>Teaching Messages & Student Channels</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                Direct encrypted conversations with mentees and collaborative class group chats.
              </p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('chat')}
            >
              Open Full Chat &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', background: '#fbfbf9', border: '1px solid #dfddd8', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#141514' }}>
                Direct Student Messages
              </h4>
              <p style={{ fontSize: '13px', color: '#656862', margin: '0 0 14px 0' }}>
                Communicate privately with your accepted students regarding homework, progress, and review.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('chat')}
              >
                View Direct Chats ({students.length})
              </button>
            </div>

            <div style={{ padding: '20px', background: '#fbfbf9', border: '1px solid #dfddd8', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#141514' }}>
                Class Cohort Channels
              </h4>
              <p style={{ fontSize: '13px', color: '#656862', margin: '0 0 14px 0' }}>
                Group discussions for all enrolled students in your active classes.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('chat')}
              >
                View Class Groups ({classes.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AVAILABILITY & ZOOM */}
      {activeTab === 'availability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Real Zoom Integration Card */}
          <div className="teaching-card">
            <div className="teaching-card-header">
              <div>
                <h2>Zoom Video Conferencing</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                  Direct user-authorized OAuth integration. Automatically provisions real Zoom meetings with secure passcodes.
                </p>
              </div>
            </div>

            {zoomLoading ? (
              <div className="teaching-skeleton-block">Checking backend Zoom OAuth status...</div>
            ) : (
              <div className="zoom-integration-panel">
                <div className="zoom-brand-lockup">
                  <div className="zoom-brand-badge">Z</div>
                  <div className="zoom-meta">
                    <h4>Zoom Video Integration</h4>
                    <p>
                      {zoomStatus?.connected
                        ? `Connected as ${zoomStatus.zoomEmail || 'authorized account'}`
                        : 'Not connected. Connect Zoom to auto-generate real meetings for scheduled sessions.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`zoom-status-pill ${zoomStatus?.connected ? 'connected' : 'disconnected'}`}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                    {zoomStatus?.connected ? 'Connected' : 'Not Connected'}
                  </span>

                  {zoomStatus?.connected ? (
                    <button
                      type="button"
                      className="quiet-button"
                      style={{ color: '#dc2626' }}
                      onClick={handleDisconnectZoom}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-button"
                      style={{ background: '#2d8cff', borderColor: '#2d8cff' }}
                      onClick={handleConnectZoom}
                    >
                      Connect Zoom
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mentorship Availability Slots */}
          <div className="teaching-card">
            <div className="teaching-card-header">
              <div>
                <h2>Office Hours & Weekly Availability</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#656862' }}>
                  Set regular hours when learners can request sessions.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '14px',
                    background: '#fbfbf9',
                    border: '1px solid #dfddd8',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: '13.5px', color: '#141514' }}>{day}</strong>
                  <span style={{ fontSize: '12px', color: '#656862' }}>6:00 PM – 9:00 PM</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CLASS */}
      {isCreatingClass && (
        <div className="teaching-modal-backdrop" onClick={() => setIsCreatingClass(false)}>
          <div className="teaching-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="teaching-modal-header">
              <h3>Create Collaborative Class</h3>
              <button type="button" className="quiet-button" onClick={() => setIsCreatingClass(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="teaching-form-group">
                <label>Class Title</label>
                <input
                  type="text"
                  placeholder="e.g. Masterclass: Full-Stack TypeScript & React"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="teaching-form-group">
                  <label>Focus Skill</label>
                  <input
                    type="text"
                    placeholder="e.g. React"
                    value={classSkill}
                    onChange={(e) => setClassSkill(e.target.value)}
                    required
                  />
                </div>
                <div className="teaching-form-group">
                  <label>Max Students</label>
                  <input
                    type="number"
                    value={classMaxStudents}
                    onChange={(e) => setClassMaxStudents(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <div className="teaching-form-group">
                <label>Curriculum / Overview</label>
                <textarea
                  placeholder="Describe what students will build and learn..."
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="teaching-form-group">
                <label>Schedule (e.g. Tuesdays & Thursdays 6 PM IST)</label>
                <input
                  type="text"
                  placeholder="e.g. Tuesdays & Thursdays 7:00 PM IST"
                  value={classSchedule}
                  onChange={(e) => setClassSchedule(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="secondary-button" onClick={() => setIsCreatingClass(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Publish Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE SESSION (WITH REAL ZOOM AUTO-GENERATION) */}
      {isSchedulingSession && (
        <div className="teaching-modal-backdrop" onClick={() => !isCreatingMeeting && setIsSchedulingSession(false)}>
          <div className="teaching-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="teaching-modal-header">
              <h3>Schedule Session</h3>
              <button
                type="button"
                className="quiet-button"
                disabled={isCreatingMeeting}
                onClick={() => setIsSchedulingSession(false)}
              >
                ✕
              </button>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="teaching-form-group">
                <label>Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Deep-Dive & Code Review"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                />
              </div>

              {classes.length > 0 && (
                <div className="teaching-form-group">
                  <label>Assign to Class Cohort (Optional)</label>
                  <select
                    value={sessionClassId}
                    onChange={(e) => setSessionClassId(e.target.value)}
                  >
                    <option value="">1-on-1 Mentorship / Individual Session</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class: {c.title} (#{c.skill})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="teaching-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="teaching-form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                <div className="teaching-form-group">
                  <label>Duration (Minutes)</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hr)</option>
                    <option value="90">90 minutes (1.5 hrs)</option>
                    <option value="120">120 minutes (2 hrs)</option>
                  </select>
                </div>
                <div className="teaching-form-group">
                  <label>Timezone</label>
                  <input
                    type="text"
                    value={sessionTimezone}
                    onChange={(e) => setSessionTimezone(e.target.value)}
                  />
                </div>
              </div>

              <div className="teaching-form-group">
                <label>Optional Teacher Notes / Agenda</label>
                <textarea
                  placeholder="Topics to cover, preparation requirements, or repository links..."
                  value={sessionTeacherInfo}
                  onChange={(e) => setSessionTeacherInfo(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Zoom Integration State Indicator */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: zoomStatus?.connected ? '#eef6ec' : '#fef3c7',
                  border: `1px solid ${zoomStatus?.connected ? '#c8e4c3' : '#fde68a'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '12.5px', color: zoomStatus?.connected ? '#2b5420' : '#92400e' }}>
                  {zoomStatus?.connected ? (
                    <span>
                      ✓ <strong>Zoom Connected:</strong> Real Zoom meeting will be auto-generated and persisted.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>Zoom Not Connected:</strong> Connect Zoom to enable auto-generation of live meetings.
                    </span>
                  )}
                </div>
                {!zoomStatus?.connected && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '11px', padding: '3px 8px', whiteSpace: 'nowrap' }}
                    onClick={handleConnectZoom}
                  >
                    Connect Zoom
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isCreatingMeeting}
                  onClick={() => setIsSchedulingSession(false)}
                >
                  Cancel
                </button>

                {zoomStatus?.connected ? (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: '#2d8cff', borderColor: '#2d8cff' }}
                    disabled={isCreatingMeeting}
                    onClick={(e) => handleScheduleSessionSubmit(e, true)}
                  >
                    {isCreatingMeeting ? 'Creating Zoom Meeting…' : 'CREATE ZOOM MEETING & SCHEDULE'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isCreatingMeeting}
                      onClick={(e) => handleScheduleSessionSubmit(e, false)}
                    >
                      {isCreatingMeeting ? 'Scheduling…' : 'Schedule Without Zoom'}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      style={{ background: '#2d8cff', borderColor: '#2d8cff' }}
                      onClick={handleConnectZoom}
                    >
                      CONNECT ZOOM
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / RESCHEDULE SESSION */}
      {editingSession && (
        <div className="teaching-modal-backdrop" onClick={() => !isUpdatingSession && setEditingSession(null)}>
          <div className="teaching-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="teaching-modal-header">
              <h3>Edit & Reschedule Session</h3>
              <button
                type="button"
                className="quiet-button"
                disabled={isUpdatingSession}
                onClick={() => setEditingSession(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="teaching-form-group">
                <label>Session Title</label>
                <input
                  type="text"
                  value={editSessionTitle}
                  onChange={(e) => setEditSessionTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="teaching-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={editSessionDate}
                    onChange={(e) => setEditSessionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="teaching-form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={editSessionTime}
                    onChange={(e) => setEditSessionTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                <div className="teaching-form-group">
                  <label>Duration (Minutes)</label>
                  <select
                    value={editSessionDuration}
                    onChange={(e) => setEditSessionDuration(e.target.value)}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hr)</option>
                    <option value="90">90 minutes (1.5 hrs)</option>
                    <option value="120">120 minutes (2 hrs)</option>
                  </select>
                </div>
                <div className="teaching-form-group">
                  <label>Timezone</label>
                  <input
                    type="text"
                    value={editSessionTimezone}
                    onChange={(e) => setEditSessionTimezone(e.target.value)}
                  />
                </div>
              </div>

              <div className="teaching-form-group">
                <label>Teacher Notes / Agenda</label>
                <textarea
                  value={editSessionTeacherInfo}
                  onChange={(e) => setEditSessionTeacherInfo(e.target.value)}
                  rows={2}
                />
              </div>

              {editingSession.meeting_url && (
                <div style={{ fontSize: '12.5px', color: '#2b5420', background: '#eef6ec', padding: '10px 14px', borderRadius: '7px', border: '1px solid #c8e4c3' }}>
                  ℹ️ <strong>Synchronized Zoom Meeting:</strong> Rescheduling will automatically update the remote Zoom meeting via Zoom API.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isUpdatingSession}
                  onClick={() => setEditingSession(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isUpdatingSession}
                >
                  {isUpdatingSession ? 'Updating Session…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL SESSION CONFIRMATION */}
      {cancellingSession && (
        <div className="teaching-modal-backdrop" onClick={() => !isCancellingSession && setCancellingSession(null)}>
          <div className="teaching-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="teaching-modal-header">
              <h3 style={{ color: '#dc2626' }}>Cancel Session</h3>
              <button
                type="button"
                className="quiet-button"
                disabled={isCancellingSession}
                onClick={() => setCancellingSession(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#4b5563', margin: '0', lineHeight: 1.5 }}>
              Are you sure you want to cancel <strong>"{cancellingSession.title}"</strong>?
              {cancellingSession.meeting_url && (
                <> The associated Zoom meeting will be cancelled on Zoom, and the session status will be updated to <em>cancelled</em>.</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="secondary-button"
                disabled={isCancellingSession}
                onClick={() => setCancellingSession(null)}
              >
                Keep Session
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                disabled={isCancellingSession}
                onClick={handleConfirmCancelSession}
              >
                {isCancellingSession ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
