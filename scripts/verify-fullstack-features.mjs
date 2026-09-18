// scripts/verify-fullstack-features.mjs
// Rigorous acceptance verification for First-Class Reposts, Full-Stack Teaching, and Class Group Chat E2EE
// Target: https://skill-swap-api-0jym.onrender.com/api/v1

const API_BASE = 'https://skill-swap-api-0jym.onrender.com/api/v1';

async function main() {
  console.log('🚀 Starting Full-Stack Features Production Verification');
  console.log(`Backend Target: ${API_BASE}`);

  let stepNumber = 0;
  function assert(condition, message) {
    stepNumber++;
    if (!condition) {
      console.error(`❌ FAILED Step ${stepNumber}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ Step ${stepNumber}: ${message}`);
  }

  const runId = Date.now();
  const testPassword = 'Password123!Secure';

  async function register(email, name, username) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: testPassword, name, username }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Register failed: ${JSON.stringify(json)}`);
    return { token: json.data.accessToken || json.data.token, user: json.data.user };
  }

  console.log('\n--- 1. User Setup for Full-Stack Verification ---');
  const teacher = await register(`teacher_${runId}@skillswap.test`, 'Master Yoda', `yoda_${runId}`);
  const student = await register(`student_${runId}@skillswap.test`, 'Luke Skywalker', `luke_${runId}`);
  const bystander = await register(`bystander_${runId}@skillswap.test`, 'Han Solo', `han_${runId}`);
  assert(!!teacher.token && !!student.token && !!bystander.token, 'Teacher, Student, and Bystander users created');

  console.log('\n--- 2. First-Class Backend Reposts & Provenance ---');
  // Create a post as teacher
  const postRes = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacher.token}`,
    },
    body: JSON.stringify({
      title: `Mastering the Force ${runId}`,
      content: 'Do or do not, there is no try. Cryptographic integrity is essential.',
      tags: ['Mentorship', 'Security'],
      art: 'idea',
    }),
  });
  const postData = await postRes.json();
  assert(postRes.ok, `Teacher created post: ID ${postData.data.post.id}`);
  const postId = postData.data.post.id;

  // Student reposts the post
  const repostRes = await fetch(`${API_BASE}/posts/${postId}/repost`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const repostData = await repostRes.json();
  assert(repostRes.ok, `Student reposted post: HTTP ${repostRes.status}`);
  assert(repostData.data.repostCount === 1, `Backend returned canonical repostCount: 1 (got ${repostData.data.repostCount})`);

  // Query feed as student to verify provenance and has_reposted flag
  const feedRes = await fetch(`${API_BASE}/posts`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const feedData = await feedRes.json();
  assert(feedRes.ok, 'Fetched posts feed with authentication');
  const feedPosts = feedData.data.posts;
  const repostedPostInFeed = feedPosts.find((p) => p.id === postId && p.reposted_by?.id === student.user.id);
  assert(!!repostedPostInFeed, `Feed contains repost entry with student provenance (reposted_by: ${repostedPostInFeed?.reposted_by?.name})`);
  assert(repostedPostInFeed.has_reposted === true, 'Student has_reposted boolean is true');
  assert(repostedPostInFeed.repost_count === 1, 'Post canonical repost_count is 1');

  // Student unreposts the post
  const unrepostRes = await fetch(`${API_BASE}/posts/${postId}/repost`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const unrepostData = await unrepostRes.json();
  assert(unrepostRes.ok, `Student unreposted post: HTTP ${unrepostRes.status}`);
  assert(unrepostData.data.repostCount === 0, `Backend returned canonical repostCount: 0 (got ${unrepostData.data.repostCount})`);

  console.log('\n--- 3. Teaching Profile, Skills & Directory ---');
  // Teacher updates teaching profile
  const profileUpdateRes = await fetch(`${API_BASE}/teaching/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacher.token}`,
    },
    body: JSON.stringify({
      headline: 'Jedi Grand Master & Cryptography Mentor',
      bio: 'Teaching the ways of the Force and distributed consensus algorithms.',
      hourly_rate: '$150/hr or Skill Swap',
      status: 'available',
      availability_slots: [
        { day: 'Monday', time: '10:00 AM - 2:00 PM UTC' },
        { day: 'Thursday', time: '4:00 PM - 8:00 PM UTC' },
      ],
      skills: ['The Force', 'Cryptography', 'Distributed Systems'],
    }),
  });
  const profileUpdateData = await profileUpdateRes.json();
  assert(profileUpdateRes.ok, `Teacher profile updated: HTTP ${profileUpdateRes.status}`);
  assert(profileUpdateData.data.profile.headline === 'Jedi Grand Master & Cryptography Mentor', 'Headline persisted correctly');

  // Fetch teaching profile
  const getProfileRes = await fetch(`${API_BASE}/teaching/profile`, {
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  const getProfileData = await getProfileRes.json();
  assert(getProfileRes.ok, 'Teacher profile fetched successfully');
  assert(getProfileData.data.profile.skills.length === 3, 'Teaching skills returned 3 items');

  // Query teachers directory
  const dirRes = await fetch(`${API_BASE}/teaching/teachers?skill=Cryptography`);
  const dirData = await dirRes.json();
  assert(dirRes.ok, 'Teacher directory query responded 200 OK');
  const foundTeacher = dirData.data.teachers.find((t) => t.user_id === teacher.user.id);
  assert(!!foundTeacher, `Teacher found in public directory filtered by Cryptography skill`);

  console.log('\n--- 4. Teaching Requests, Acceptance & Auto-Connection ---');
  // Student sends teaching request
  const reqRes = await fetch(`${API_BASE}/teaching/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      teacherId: teacher.user.id,
      skill: 'The Force',
      message: 'Help me master the ways of the Force, Master Yoda.',
    }),
  });
  const reqData = await reqRes.json();
  assert(reqRes.ok, `Student sent teaching request: ID ${reqData.data.request.id}`);
  const requestId = reqData.data.request.id;

  // Teacher views incoming requests
  const teacherReqsRes = await fetch(`${API_BASE}/teaching/requests`, {
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  const teacherReqs = await teacherReqsRes.json();
  assert(teacherReqsRes.ok, 'Teacher fetched incoming requests');
  const incoming = teacherReqs.data.incoming.find((r) => r.id === requestId);
  assert(!!incoming && incoming.status === 'pending', 'Incoming request present with status pending');

  // Teacher accepts request (triggers mutual connection + direct chat conversation)
  const acceptRes = await fetch(`${API_BASE}/teaching/requests/${requestId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  assert(acceptRes.ok, `Teacher accepted teaching request: HTTP ${acceptRes.status}`);

  // Check teacher students list
  const studentsRes = await fetch(`${API_BASE}/teaching/students`, {
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  const studentsData = await studentsRes.json();
  assert(studentsRes.ok, 'Teacher fetched students roster');
  const enrolledStudent = studentsData.data.students.find((s) => s.id === student.user.id);
  assert(!!enrolledStudent, `Student ${student.user.name} present in teacher student roster`);

  console.log('\n--- 5. Classes & Enrollment ---');
  // Teacher creates a class
  const createClassRes = await fetch(`${API_BASE}/teaching/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacher.token}`,
    },
    body: JSON.stringify({
      title: 'Advanced Lightsaber & Protocol Engineering',
      description: 'A deep dive into plasma energy confinement and decentralized p2p state channels.',
      skill: 'Cryptography',
      schedule: 'Saturdays at 14:00 UTC',
      meeting_url: 'https://meet.jit.si/SkillSwap-Advanced-Force',
      max_students: 15,
    }),
  });
  const createClassData = await createClassRes.json();
  assert(createClassRes.ok, `Teacher created class: ID ${createClassData.data.class.id}`);
  const classId = createClassData.data.class.id;

  // Student joins the class
  const joinRes = await fetch(`${API_BASE}/teaching/classes/${classId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student.token}` },
  });
  assert(joinRes.ok, `Student joined class: HTTP ${joinRes.status}`);

  // List classes as student
  const listClassesRes = await fetch(`${API_BASE}/teaching/classes`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const listClassesData = await listClassesRes.json();
  assert(listClassesRes.ok, 'Student fetched classes list');
  const joinedClass = listClassesData.data.classes.find((c) => c.id === classId);
  assert(!!joinedClass && joinedClass.is_enrolled === true, 'Class listed with is_enrolled: true');

  console.log('\n--- 6. Class Sessions & Zoom/Meeting Links ---');
  // Teacher schedules a live session
  const sessionTime = new Date(Date.now() + 86400000).toISOString();
  const createSessionRes = await fetch(`${API_BASE}/teaching/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacher.token}`,
    },
    body: JSON.stringify({
      class_id: classId,
      title: 'Session 1: Plasma Physics & Zero-Knowledge Proofs',
      scheduled_at: sessionTime,
      duration_minutes: 60,
      meeting_url: 'https://meet.jit.si/SkillSwap-Session-1',
    }),
  });
  const sessionData = await createSessionRes.json();
  assert(createSessionRes.ok, `Live session created: ID ${sessionData.data.session.id}`);

  // Student queries sessions
  const sessionsRes = await fetch(`${API_BASE}/teaching/sessions`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const sessionsData = await sessionsRes.json();
  assert(sessionsRes.ok, 'Student queried class sessions');
  const foundSession = sessionsData.data.sessions.find((s) => s.class_id === classId);
  assert(!!foundSession, `Found scheduled session with meetingUrl: ${foundSession?.meeting_url}`);

  console.log('\n--- 7. Class Group Chat E2EE Security ---');
  // Student opens class group conversation
  const classChatRes = await fetch(`${API_BASE}/chat/conversations/class/${classId}`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const classChatData = await classChatRes.json();
  assert(classChatRes.ok, `Student accessed class group chat: Conversation ID ${classChatData.data.conversation.id}`);
  const groupConvId = classChatData.data.conversation.id;

  // Student sends encrypted group message
  const fakeGroupCipher = Buffer.from('encrypted-group-payload-data').toString('base64');
  const fakeIv = Buffer.from('random-12-byte-iv-nonce').toString('base64');
  const fakeTag = Buffer.from('16-byte-auth-tag-gcm').toString('base64');

  const sendMsgRes = await fetch(`${API_BASE}/chat/conversations/${groupConvId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      ciphertext: fakeGroupCipher,
      iv: fakeIv,
      authTag: fakeTag,
    }),
  });
  assert(sendMsgRes.ok, `Student posted E2EE message to class group chat (HTTP ${sendMsgRes.status})`);

  // Teacher reads group messages
  const readMsgsRes = await fetch(`${API_BASE}/chat/conversations/${groupConvId}/messages`, {
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  const readMsgsData = await readMsgsRes.json();
  assert(readMsgsRes.ok, 'Teacher read group chat messages');
  const receivedMsg = readMsgsData.data.messages.find((m) => m.ciphertext === fakeGroupCipher);
  assert(!!receivedMsg, 'E2EE ciphertext retrieved verbatim from PostgreSQL');

  // Security Access Control: Bystander (not enrolled in class) reading group chat receives 403 Forbidden
  const bystanderRes = await fetch(`${API_BASE}/chat/conversations/${groupConvId}/messages`, {
    headers: { Authorization: `Bearer ${bystander.token}` },
  });
  assert(bystanderRes.status === 403, `Non-enrolled bystander strictly denied with 403 Forbidden (got ${bystanderRes.status})`);

  console.log('\n======================================================');
  console.log(`🎉 ALL ${stepNumber}/${stepNumber} FULL-STACK PRODUCTION TESTS PASSED!`);
  console.log('======================================================');
}

main().catch((err) => {
  console.error('\n❌ Acceptance Test Failed:', err);
  process.exit(1);
});
