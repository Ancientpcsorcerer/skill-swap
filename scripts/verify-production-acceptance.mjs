// scripts/verify-production-acceptance.mjs
// Rigorous acceptance test against deployed production:
// Backend: https://skill-swap-api-0jym.onrender.com
// Frontend: https://skill-swap-xi-lake.vercel.app

const API_BASE = 'https://skill-swap-api-0jym.onrender.com/api/v1';
const FRONTEND_URL = 'https://skill-swap-xi-lake.vercel.app';

async function main() {
  console.log('🚀 Starting Deployed Production Acceptance Verification');
  console.log(`Backend Target:  ${API_BASE}`);
  console.log(`Frontend Target: ${FRONTEND_URL}`);

  let passedSteps = 0;
  let totalSteps = 0;

  function assert(condition, message) {
    totalSteps++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedSteps++;
    console.log(`  ✓ Step ${totalSteps}: ${message}`);
  }

  // 1. Health check
  console.log('\n--- 1. Backend Health & Database Connectivity ---');
  const healthRes = await fetch('https://skill-swap-api-0jym.onrender.com/health');
  assert(healthRes.ok, `Health endpoint responded with status ${healthRes.status}`);
  const healthData = await healthRes.json();
  assert(healthData.status === 'ok', 'Health status is ok');
  assert(healthData.database === 'connected', 'Database reports connected state');

  // 2. Register / Login User A and User B
  console.log('\n--- 2. Production User Authentication & Token Delivery ---');
  const runTimestamp = Date.now();
  const userAEmail = `test.user.a.${runTimestamp}@skillswap.example`;
  const userBEmail = `test.user.b.${runTimestamp}@skillswap.example`;
  const userCEmail = `test.user.c.${runTimestamp}@skillswap.example`;
  const testPassword = 'Password123!Secure';

  async function registerUser(email, name, username) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: testPassword, name, username }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(`Register failed for ${email}: ${JSON.stringify(json)}`);
    }
    return { token: json.data.accessToken || json.data.token, user: json.data.user };
  }

  const userA = await registerUser(userAEmail, 'Alice Verified', `alice_${runTimestamp}`);
  assert(!!userA.token && !!userA.user.id, `User A registered (ID: ${userA.user.id}) with valid Bearer token`);

  const userB = await registerUser(userBEmail, 'Bob Verified', `bob_${runTimestamp}`);
  assert(!!userB.token && !!userB.user.id, `User B registered (ID: ${userB.user.id}) with valid Bearer token`);

  const userC = await registerUser(userCEmail, 'Charlie Unauthorized', `charlie_${runTimestamp}`);
  assert(!!userC.token && !!userC.user.id, `User C registered (ID: ${userC.user.id}) with valid Bearer token`);

  // 3. E2EE Prekey Publishing
  console.log('\n--- 3. E2EE Cryptographic Directory Registration ---');
  const fakeIdentityKeyA = Buffer.from('alice-identity-public-key-32bytes').toString('base64');
  const fakeSignedPrekeyA = Buffer.from('alice-signed-prekey-32bytes').toString('base64');
  const fakeSigA = Buffer.from('alice-signature-64bytes-long-string-for-testing').toString('base64');

  const regKeyRes = await fetch(`${API_BASE}/crypto/prekeys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    },
    body: JSON.stringify({
      identityPublicKey: fakeIdentityKeyA,
      signedPrekey: fakeSignedPrekeyA,
      signedPrekeySignature: fakeSigA,
      oneTimePrekeys: [
        { keyId: 'opk_1', publicKey: Buffer.from('alice-opk-1').toString('base64') },
        { keyId: 'opk_2', publicKey: Buffer.from('alice-opk-2').toString('base64') },
      ],
    }),
  });
  assert(regKeyRes.ok, `User A published E2EE prekey bundle to PostgreSQL (status: ${regKeyRes.status})`);

  // Bob fetches Alice's prekey bundle
  const bundleRes = await fetch(`${API_BASE}/crypto/prekey-bundle/${userA.user.id}`, {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(bundleRes.ok, `User B retrieved User A prekey bundle for key agreement`);
  const bundleData = await bundleRes.json();
  assert(bundleData.data?.bundle?.identityPublicKey === fakeIdentityKeyA, 'Retrieved identity key matches');

  // 4. Conversation Uniqueness & Canonical Pair Creation
  console.log('\n--- 4. One-to-One Conversation Uniqueness & Participant Ordering ---');
  // Alice starts conversation with Bob
  const conv1Res = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    },
    body: JSON.stringify({ partnerId: userB.user.id }),
  });
  assert(conv1Res.ok, `Alice initiated conversation with Bob (status ${conv1Res.status})`);
  const conv1Data = await conv1Res.json();
  const conversationId = conv1Data.data?.conversation?.id;
  assert(!!conversationId, `Created conversation ID: ${conversationId}`);

  // Bob starts conversation with Alice -> MUST return identical conversation ID without duplicate row
  const conv2Res = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userB.token}`,
    },
    body: JSON.stringify({ partnerId: userA.user.id }),
  });
  assert(conv2Res.ok, `Bob queried conversation with Alice (status ${conv2Res.status})`);
  const conv2Data = await conv2Res.json();
  assert(
    conv2Data.data?.conversation?.id === conversationId,
    `Canonical ordering constraint verified: returned identical conversation ID (${conversationId})`
  );

  // 5. Send Encrypted Message (Alice -> Bob)
  console.log('\n--- 5. Encrypted Message Send & PostgreSQL Persistence ---');
  const mockCiphertext = Buffer.from('hello-production-test-123-payload').toString('base64');
  const mockIv = Buffer.from('12-byte-iv-data').toString('base64');
  const mockAuthTag = Buffer.from('16-byte-auth-tag').toString('base64');
  const mockRatchetHeader = {
    dh_sender_pub: 'sample-ratchet-key-hex',
    msg_num: 1,
    prev_chain_length: 0,
  };

  const sendRes = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    },
    body: JSON.stringify({
      ciphertext: mockCiphertext,
      iv: mockIv,
      authTag: mockAuthTag,
      ratchetHeader: mockRatchetHeader,
    }),
  });
  assert(sendRes.status === 201, `Alice sent message: HTTP 201 Created returned`);
  const sendData = await sendRes.json();
  const sentMessageId = sendData.data?.message?.id;
  assert(!!sentMessageId, `Server assigned message UUID: ${sentMessageId}`);

  // 6. Retrieve Conversation History from PostgreSQL
  console.log('\n--- 6. Conversation History Loading & Authenticated Retrieval ---');
  const historyRes = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(historyRes.ok, `Bob retrieved message history for conversation (status: ${historyRes.status})`);
  const historyData = await historyRes.json();
  const messages = historyData.data?.messages || [];
  assert(messages.length >= 1, `Messages retrieved: found ${messages.length} message(s) in PostgreSQL`);
  const persistedMsg = messages.find((m) => m.id === sentMessageId);
  assert(!!persistedMsg, `Sent message UUID ${sentMessageId} found in authoritative history`);
  assert(persistedMsg.ciphertext === mockCiphertext, 'Ciphertext stored and retrieved verbatim');
  assert(persistedMsg.iv === mockIv, 'IV stored and retrieved verbatim');
  assert(persistedMsg.auth_tag === mockAuthTag, 'Auth tag stored and retrieved verbatim');

  // 7. Security Boundary: Unauthorized User C Access
  console.log('\n--- 7. Security Access Control & Participant Authorization ---');
  const unauthorizedGet = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${userC.token}` },
  });
  assert(
    unauthorizedGet.status === 403,
    `Unauthorized User C reading conversation history strictly rejected with 403 Forbidden (got ${unauthorizedGet.status})`
  );

  const unauthorizedSend = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userC.token}`,
    },
    body: JSON.stringify({
      ciphertext: mockCiphertext,
      iv: mockIv,
      authTag: mockAuthTag,
    }),
  });
  assert(
    unauthorizedSend.status === 403,
    `Unauthorized User C injecting message strictly rejected with 403 Forbidden (got ${unauthorizedSend.status})`
  );

  // 8. Private Media Gateway Security
  console.log('\n--- 8. Private Media Gateway & Authorization ---');
  // 1x1 transparent PNG base64
  const samplePrivateFile = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=';
  const uploadRes = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    },
    body: JSON.stringify({
      filename: 'confidential_brief.png',
      mimeType: 'image/png',
      base64Data: samplePrivateFile,
      isPrivate: true,
    }),
  });
  assert(uploadRes.status === 201 || uploadRes.ok, `Alice uploaded private media asset (status: ${uploadRes.status})`);
  const uploadData = await uploadRes.json();
  const mediaId = uploadData.data?.media?.id;
  assert(!!mediaId, `Private media UUID assigned: ${mediaId}`);

  // Alice (owner) accessing private media
  const ownerAccess = await fetch(`${API_BASE}/media/access/${mediaId}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(ownerAccess.ok, `Media owner (Alice) successfully accessed private media (status: ${ownerAccess.status})`);

  // Charlie (unauthorized third-party) accessing private media
  const unauthAccess = await fetch(`${API_BASE}/media/access/${mediaId}`, {
    headers: { Authorization: `Bearer ${userC.token}` },
  });
  assert(
    unauthAccess.status === 403,
    `Unauthorized User C accessing private media strictly rejected with 403 Forbidden (got ${unauthAccess.status})`
  );

  // 9. Posts Creation and Listing with PostgreSQL
  console.log('\n--- 9. Posts Feed Persistence & Retrieval ---');
  const postRes = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    },
    body: JSON.stringify({
      title: 'Decentralized Creative Workflows in 2026',
      content: 'Exploring the boundary of collaborative creative tools with full end-to-end cryptographic verification.',
      tags: ['CreativeTech', 'E2EE', 'Design'],
      image_urls: ['https://example.com/art1.png', 'https://example.com/art2.png'],
      video_urls: ['https://example.com/video1.mp4'],
    }),
  });
  assert(postRes.status === 201, `Post created successfully on PostgreSQL (status: ${postRes.status})`);
  const postData = await postRes.json();
  assert(postData.data?.post?.title === 'Decentralized Creative Workflows in 2026', 'Post title stored correctly');

  const listPostsRes = await fetch(`${API_BASE}/posts`);
  assert(listPostsRes.ok, `Retrieved posts feed from backend (status: ${listPostsRes.status})`);
  const listPostsData = await listPostsRes.json();
  const foundPost = (listPostsData.data?.posts || []).find((p) => p.id === postData.data?.post?.id);
  assert(!!foundPost, `Created post verified present in public feed list`);

  // 10. Frontend Production Reachability & Bundle Integrity
  console.log('\n--- 10. Frontend Production Reachability & Integrity ---');
  const feRes = await fetch(FRONTEND_URL);
  assert(feRes.ok, `Frontend production URL responds with status ${feRes.status}`);
  const html = await feRes.text();
  assert(html.includes('<div id="root"></div>'), 'Frontend root element present');

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedSteps}/${totalSteps} DEPLOYED PRODUCTION ACCEPTANCE TESTS PASSED!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
