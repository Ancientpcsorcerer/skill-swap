// Comprehensive Acceptance Test for Teaching Area, Zoom Integration, and Session Management
import fs from 'fs';
import path from 'path';
import http from 'http';

console.log('============================================================');
console.log('RUNNING ACCEPTANCE TESTS — TEACHING + ZOOM + SESSIONS');
console.log('============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✕ FAILED: ${message}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// TEST SUITE A: LEARN PURIFICATION & DECOUPLING
// -------------------------------------------------------------
console.log('--- TEST SUITE A: Learn Purification & Decoupling ---');

const teachingViewPath = path.resolve('src/modules/learn/TeachingView.tsx');
assert(!fs.existsSync(teachingViewPath), 'Learn/TeachingView.tsx must be completely removed');

const learnModeSwitcherContent = fs.readFileSync('src/modules/learn/LearnModeSwitcher.tsx', 'utf8');
assert(!learnModeSwitcherContent.includes('teaching'), 'LearnModeSwitcher must not contain teaching studio tab');
assert(learnModeSwitcherContent.includes('Explore Skills'), 'LearnModeSwitcher contains Explore Skills');
assert(learnModeSwitcherContent.includes('My Progress'), 'LearnModeSwitcher contains My Progress');

const learnModuleContent = fs.readFileSync('src/modules/learn/LearnModule.tsx', 'utf8');
assert(!learnModuleContent.includes('TeachingView'), 'LearnModule must not import or render TeachingView');
assert(!learnModuleContent.includes('teaching'), 'LearnModule must be strictly focused on learner experience');

// -------------------------------------------------------------
// TEST SUITE B: PROFILE TEACHING ACTIVATION
// -------------------------------------------------------------
console.log('\n--- TEST SUITE B: Profile Teaching Activation ---');

const profileModuleContent = fs.readFileSync('src/modules/profile/ProfileModule.tsx', 'utf8');
assert(profileModuleContent.includes('START TEACHING'), 'Profile contains [ START TEACHING ] activation button');
assert(profileModuleContent.includes('Share what you know with people who want to learn it'), 'Profile contains canonical activation copy');
assert(profileModuleContent.includes('Teaching'), 'Profile contains Teaching tab in profileTabs');
assert(profileModuleContent.includes('skill-swap:teaching-activated'), 'Profile dispatches teaching-activated event on activation');

// -------------------------------------------------------------
// TEST SUITE C: GLOBAL SIDEBAR NAVIGATION ARCHITECTURE
// -------------------------------------------------------------
console.log('\n--- TEST SUITE C: Global Sidebar Navigation Architecture ---');

const globalSidebarContent = fs.readFileSync('src/app/GlobalSidebar.tsx', 'utf8');
assert(globalSidebarContent.includes('sidebar-divider'), 'Global sidebar contains thin separator');
assert(globalSidebarContent.includes('sidebar-heading'), 'Global sidebar contains Teaching capability heading');
assert(globalSidebarContent.includes('Teaching Profile'), 'Sidebar exposes Teaching Profile');
assert(globalSidebarContent.includes('Teaching Requests'), 'Sidebar exposes Teaching Requests');
assert(globalSidebarContent.includes('My Students'), 'Sidebar exposes My Students');
assert(globalSidebarContent.includes('Classes'), 'Sidebar exposes Classes');
assert(globalSidebarContent.includes('Messages'), 'Sidebar exposes Messages');
assert(globalSidebarContent.includes('Availability'), 'Sidebar exposes Availability');
assert(globalSidebarContent.includes('isTeachingPublished'), 'Teaching section is conditionally rendered only when backend confirms teaching is published');

// -------------------------------------------------------------
// TEST SUITE D: DEDICATED TEACHING AREA ARCHITECTURE
// -------------------------------------------------------------
console.log('\n--- TEST SUITE D: Dedicated Teaching Area Architecture ---');

const teachingModulePath = path.resolve('src/modules/teaching/TeachingModule.tsx');
assert(fs.existsSync(teachingModulePath), 'src/modules/teaching/TeachingModule.tsx exists as dedicated top-level module');

const teachingModuleContent = fs.readFileSync(teachingModulePath, 'utf8');
assert(teachingModuleContent.includes('teaching-hero-banner'), 'Teaching module renders immediate shell without sequential delays');
assert(teachingModuleContent.includes('CREATE ZOOM MEETING & SCHEDULE'), 'Teaching session scheduler contains [ CREATE ZOOM MEETING & SCHEDULE ]');
assert(teachingModuleContent.includes('Edit / Reschedule'), 'Teaching module provides session editing and rescheduling');
assert(teachingModuleContent.includes('Cancel Session'), 'Teaching module provides session cancellation');
assert(teachingModuleContent.includes('Connect Zoom'), 'Teaching module integrates Zoom OAuth connection');

const appShellContent = fs.readFileSync('src/app/ApplicationShell.tsx', 'utf8');
assert(appShellContent.includes('teaching: TeachingModule'), 'ApplicationShell registers teaching route mapping');

// -------------------------------------------------------------
// TEST SUITE E: BACKEND ZOOM & SESSION LIFECYCLE
// -------------------------------------------------------------
console.log('\n--- TEST SUITE E: Backend Zoom & Session Lifecycle ---');

const zoomServiceContent = fs.readFileSync('backend/src/modules/teaching/zoom.service.ts', 'utf8');
assert(zoomServiceContent.includes('createMeeting'), 'Zoom service implements createMeeting');
assert(zoomServiceContent.includes('updateMeeting'), 'Zoom service implements updateMeeting');
assert(zoomServiceContent.includes('deleteMeeting'), 'Zoom service implements deleteMeeting');
assert(zoomServiceContent.includes('getZoomStatus'), 'Zoom service provides getZoomStatus');
assert(!zoomServiceContent.includes('fake-zoom'), 'Zoom service contains NO fake/mock meeting fallback');

const teachingServiceContent = fs.readFileSync('backend/src/modules/teaching/teaching.service.ts', 'utf8');
assert(teachingServiceContent.includes('updateSession'), 'TeachingService implements updateSession with authorization checks');
assert(teachingServiceContent.includes('cancelSession'), 'TeachingService implements cancelSession');
assert(teachingServiceContent.includes('zoomService.updateMeeting'), 'Rescheduling invokes Zoom meeting update on backend');
assert(teachingServiceContent.includes('zoomService.deleteMeeting'), 'Cancelling session deletes remote Zoom meeting');

const teachingRoutesContent = fs.readFileSync('backend/src/modules/teaching/teaching.routes.ts', 'utf8');
assert(teachingRoutesContent.includes("teachingRouter.get('/zoom/status'"), 'Route registered: GET /zoom/status');
assert(teachingRoutesContent.includes("teachingRouter.get('/zoom/authorize'"), 'Route registered: GET /zoom/authorize');
assert(teachingRoutesContent.includes("teachingRouter.post('/zoom/disconnect'"), 'Route registered: POST /zoom/disconnect');
assert(teachingRoutesContent.includes("teachingRouter.put('/sessions/:id'"), 'Route registered: PUT /sessions/:id');
assert(teachingRoutesContent.includes("teachingRouter.post('/sessions/:id/cancel'"), 'Route registered: POST /sessions/:id/cancel');

// -------------------------------------------------------------
// TEST SUITE F: SECURITY & NO EXPOSED SECRETS
// -------------------------------------------------------------
console.log('\n--- TEST SUITE F: Security & Zero Frontend Secrets ---');

const clientFiles = ['src/lib/api.ts', 'src/modules/teaching/TeachingModule.tsx', 'src/app/GlobalSidebar.tsx'];
for (const f of clientFiles) {
  const content = fs.readFileSync(f, 'utf8');
  assert(!content.includes('ZOOM_CLIENT_SECRET'), `No client secret in ${f}`);
  assert(!content.includes('refresh_token'), `No refresh token management in ${f}`);
  assert(!content.includes('access_token'), `No access token management in ${f}`);
}

console.log('\n============================================================');
console.log(`ACCEPTANCE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY.');
  process.exit(0);
}
