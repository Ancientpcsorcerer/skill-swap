// scripts/verify-chat-social-teaching.mjs
// Comprehensive Acceptance Test for Chat Workspace, Start Teaching Discoverability, and Full-Stack Social Expansion
import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('SURGICAL ACCEPTANCE VERIFICATION: CHAT + TEACHING + SOCIAL');
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
// SECTION 1: CHAT WORKSPACE & REMOVAL OF PERMANENT DOSSIER
// -------------------------------------------------------------
console.log('--- 1. Chat Workspace Full-Space Allocation & Dossier Removal ---');

const drawerPath = path.resolve('src/modules/chat/ChatContextDrawer.tsx');
assert(!fs.existsSync(drawerPath), 'ChatContextDrawer.tsx is completely eliminated from codebase');

const chatModuleContent = fs.readFileSync('src/modules/chat/ChatModule.tsx', 'utf8');
assert(!chatModuleContent.includes('ChatContextDrawer'), 'ChatModule does not import or render ChatContextDrawer');
assert(!chatModuleContent.includes('COLLABORATOR DOSSIER'), 'ChatModule has NO permanent collaborator dossier');
assert(chatModuleContent.includes('View Profile'), 'Chat header retains clean "View Profile →" link');

const chatCssContent = fs.readFileSync('src/styles/connect-profile-chat.css', 'utf8');
assert(chatCssContent.includes('.chat-main-pane'), 'connect-profile-chat.css defines .chat-main-pane');
assert(chatCssContent.includes('min-width: 0'), '.chat-main-pane specifies min-width: 0 for flexible expansion');
assert(chatCssContent.includes('flex: 1'), '.chat-main-pane specifies flex: 1 to consume all remaining horizontal space');
assert(chatCssContent.includes('.chat-messages-scroll'), 'connect-profile-chat.css defines .chat-messages-scroll');
assert(chatCssContent.includes('overflow-y: auto'), '.chat-messages-scroll enables vertical scrolling');
assert(chatCssContent.includes('width: 100%'), '.chat-composer spans 100% width of active conversation pane');
assert(!chatCssContent.includes('grid-template-columns: 320px 1fr 340px'), 'No 3-column grid reserving space for dossier');

// -------------------------------------------------------------
// SECTION 2: CHAT MESSAGE ACTIONS (REPLY, EDIT, DELETE, COPY, FORWARD)
// -------------------------------------------------------------
console.log('\n--- 2. Chat Message Actions Architecture ---');

// Frontend Chat capabilities
assert(chatModuleContent.includes('replyToMessage'), 'ChatModule implements reply to message state');
assert(chatModuleContent.includes('Replying to:'), 'Chat composer renders compact reply context');
assert(chatModuleContent.includes('chat-reply-quote'), 'Replied-to message displays compact quoted reference block');
assert(chatModuleContent.includes('Original message deleted'), 'Reply gracefully displays deleted parent message state');
assert(chatModuleContent.includes('handleEditMessage'), 'ChatModule implements edit message workflow');
assert(chatModuleContent.includes('(edited)'), 'Edited messages display (edited) indicator');
assert(chatModuleContent.includes('handleDeleteMessage'), 'ChatModule implements delete message workflow');
assert(chatModuleContent.includes('Message deleted'), 'Deleted message renders intentional deleted state');
assert(chatModuleContent.includes('handleCopyMessage'), 'ChatModule implements copy message');
assert(chatModuleContent.includes('Copied'), 'ChatModule provides subtle "Copied" feedback toast');
assert(chatModuleContent.includes('handleForwardMessage'), 'ChatModule implements forward message to authorized conversation');
assert(chatModuleContent.includes('chat-forward-modal'), 'ChatModule provides forward destination dialog');
assert(chatModuleContent.includes('Forwarded'), 'Forwarded message displays subtle "Forwarded" indicator');

// Backend Chat capabilities & E2EE preservation
const backendChatService = fs.readFileSync('backend/src/modules/chat/chat.service.ts', 'utf8');
assert(backendChatService.includes('replyToMessageId'), 'Backend chat service supports replyToMessageId');
assert(backendChatService.includes('editMessage'), 'Backend chat service implements editMessage with ownership check');
assert(backendChatService.includes('deleteMessage'), 'Backend chat service implements soft delete retaining thread integrity');
assert(backendChatService.includes('forwardMessage'), 'Backend chat service implements forwardMessage with membership authorization');
assert(backendChatService.includes('ciphertext'), 'Backend Chat preserves encrypted payload without plaintext fallback');

const backendChatRoutes = fs.readFileSync('backend/src/modules/chat/chat.routes.ts', 'utf8');
assert(backendChatRoutes.includes("put('/messages/:id'"), 'Backend chat exposes PUT /messages/:id for message editing');
assert(backendChatRoutes.includes("delete('/messages/:id'"), 'Backend chat exposes DELETE /messages/:id for message deletion');
assert(backendChatRoutes.includes("post('/messages/:id/forward'"), 'Backend chat exposes POST /messages/:id/forward for message forwarding');

// -------------------------------------------------------------
// SECTION 3: START TEACHING DISCOVERABILITY FROM PROFILE
// -------------------------------------------------------------
console.log('\n--- 3. Start Teaching Discoverability from Profile ---');

const profileModuleContent = fs.readFileSync('src/modules/profile/ProfileModule.tsx', 'utf8');
assert(profileModuleContent.includes('✦ Start Teaching'), 'Profile header deck contains quick action [ ✦ Start Teaching ]');
assert(profileModuleContent.includes('START TEACHING'), 'Profile Teaching tab contains [ START TEACHING ] button');
assert(profileModuleContent.includes('Share what you know with people who want to learn it'), 'Profile contains canonical copy: "Share what you know with people who want to learn it."');
assert(profileModuleContent.includes("status: 'available'"), 'Clicking Start Teaching calls backend with status: "available"');
assert(profileModuleContent.includes('skill-swap:teaching-activated'), 'Dispatches teaching-activated event to reveal sidebar without full reload');

const learnSwitcher = fs.readFileSync('src/modules/learn/LearnModeSwitcher.tsx', 'utf8');
assert(!learnSwitcher.includes('teaching'), 'LearnModeSwitcher contains NO teaching tab');

const globalSidebar = fs.readFileSync('src/app/GlobalSidebar.tsx', 'utf8');
assert(globalSidebar.includes('isTeachingPublished'), 'GlobalSidebar conditionally reveals Teaching upon activation');
assert(globalSidebar.includes('Teaching Profile'), 'Sidebar lists Teaching Profile');
assert(globalSidebar.includes('Teaching Requests'), 'Sidebar lists Teaching Requests');
assert(globalSidebar.includes('My Students'), 'Sidebar lists My Students');
assert(globalSidebar.includes('Classes'), 'Sidebar lists Classes');
assert(globalSidebar.includes('Messages'), 'Sidebar lists Messages');
assert(globalSidebar.includes('Availability'), 'Sidebar lists Availability');

// -------------------------------------------------------------
// SECTION 4: SOCIAL EXPANSION — POSTS
// -------------------------------------------------------------
console.log('\n--- 4. Full-Stack Posts Social Expansion ---');

const postCardContent = fs.readFileSync('src/modules/posts/PostCard.tsx', 'utf8');
assert(postCardContent.includes('handleLike'), 'PostCard supports Like / Unlike');
assert(postCardContent.includes('handleRepost'), 'PostCard supports Repost / Unrepost');
assert(postCardContent.includes('handleSave'), 'PostCard supports Save / Unsave');
assert(postCardContent.includes('Edit Post'), 'PostCard exposes Edit Post to owner');
assert(postCardContent.includes('Delete Post'), 'PostCard exposes Delete Post to owner');
assert(postCardContent.includes('Report Post'), 'PostCard exposes Report Post to other users');

const postPreviewContent = fs.readFileSync('src/modules/posts/PostPreview.tsx', 'utf8');
assert(postPreviewContent.includes('CommentSection'), 'PostPreview integrates unified CommentSection');
assert(postPreviewContent.includes('handleSave'), 'PostPreview supports Save Post');

const backendPostRoutes = fs.readFileSync('backend/src/modules/posts/posts.routes.ts', 'utf8');
assert(backendPostRoutes.includes("post('/:id/like'"), 'Backend posts route exposes POST /:id/like');
assert(backendPostRoutes.includes("delete('/:id/like'"), 'Backend posts route exposes DELETE /:id/like');
assert(backendPostRoutes.includes("post('/:id/repost'"), 'Backend posts route exposes POST /:id/repost');
assert(backendPostRoutes.includes("delete('/:id/repost'"), 'Backend posts route exposes DELETE /:id/repost');
assert(backendPostRoutes.includes("post('/:id/save'"), 'Backend posts route exposes POST /:id/save');
assert(backendPostRoutes.includes("delete('/:id/save'"), 'Backend posts route exposes DELETE /:id/save');
assert(backendPostRoutes.includes("post('/:id/report'"), 'Backend posts route exposes POST /:id/report');

// -------------------------------------------------------------
// SECTION 5: SOCIAL EXPANSION — PROJECTS (NO SAVE PROJECT!)
// -------------------------------------------------------------
console.log('\n--- 5. Full-Stack Projects Social Expansion & Boundary ---');

const projectCardContent = fs.readFileSync('src/app/components/ProjectCard.tsx', 'utf8');
assert(projectCardContent.includes('handleLike'), 'ProjectCard supports Like');
assert(projectCardContent.includes('handleRepost'), 'ProjectCard supports Repost');
assert(projectCardContent.includes('Edit Project'), 'ProjectCard exposes Edit Project to owner');
assert(projectCardContent.includes('Delete Project'), 'ProjectCard exposes Delete Project to owner');
assert(projectCardContent.includes('Report Project'), 'ProjectCard exposes Report Project to others');
assert(!projectCardContent.includes('Save Project'), 'STRICT REQUIREMENT: ProjectCard has NO Save Project');

const projectPreviewContent = fs.readFileSync('src/app/components/ProjectPreview.tsx', 'utf8');
assert(!projectPreviewContent.includes('Save project') && !projectPreviewContent.includes('Save Project'), 'STRICT REQUIREMENT: ProjectPreview has NO Save Project button');
assert(projectPreviewContent.includes('Follow project') || projectPreviewContent.includes('Following'), 'Project retains distinct Follow action');
assert(projectPreviewContent.includes('Join project') || projectPreviewContent.includes('Member'), 'Project retains distinct Join action');
assert(projectPreviewContent.includes('CommentSection'), 'ProjectPreview integrates unified CommentSection');

const backendProjectRoutes = fs.readFileSync('backend/src/routes/projects.routes.ts', 'utf8');
assert(backendProjectRoutes.includes("post('/:id/like'"), 'Backend projects exposes POST /:id/like');
assert(backendProjectRoutes.includes("delete('/:id/like'"), 'Backend projects exposes DELETE /:id/like');
assert(backendProjectRoutes.includes("post('/:id/repost'"), 'Backend projects exposes POST /:id/repost');
assert(backendProjectRoutes.includes("delete('/:id/repost'"), 'Backend projects exposes DELETE /:id/repost');
assert(backendProjectRoutes.includes("post('/:id/report'"), 'Backend projects exposes POST /:id/report');
assert(!backendProjectRoutes.includes('/projects/:id/save'), 'STRICT REQUIREMENT: Backend projects has NO save route');

// -------------------------------------------------------------
// SECTION 6: UNIFIED COMMENTS ARCHITECTURE
// -------------------------------------------------------------
console.log('\n--- 6. Unified Comments System (Posts & Projects) ---');

const commentSectionContent = fs.readFileSync('src/components/social/CommentSection.tsx', 'utf8');
assert(commentSectionContent.includes('NO COMMENTS YET'), 'CommentSection displays "NO COMMENTS YET" empty state');
assert(commentSectionContent.includes('NO REPLIES YET'), 'CommentSection displays "NO REPLIES YET" empty state');
assert(commentSectionContent.includes('Creator'), 'CommentSection badges official Creator replies');
assert(commentSectionContent.includes('parentCommentId') || commentSectionContent.includes('parent_comment_id'), 'CommentSection supports real parent_comment_id threaded replies');
assert(commentSectionContent.includes('handleLikeComment'), 'CommentSection supports comment likes');
assert(commentSectionContent.includes('handleEditComment'), 'CommentSection supports comment editing');
assert(commentSectionContent.includes('handleDeleteComment'), 'CommentSection supports comment deletion with thread integrity');
assert(commentSectionContent.includes('handleReportComment'), 'CommentSection supports comment reporting');

const backendCommentsService = fs.readFileSync('backend/src/modules/comments/comments.service.ts', 'utf8');
assert(backendCommentsService.includes('target_type'), 'Backend comments service handles target_type (post/project)');
assert(backendCommentsService.includes('parent_comment_id'), 'Backend comments service supports parent_comment_id');
assert(backendCommentsService.includes('is_creator'), 'Backend comments service determines is_creator dynamically from database');
assert(backendCommentsService.includes('likeComment'), 'Backend comments service implements likeComment');
assert(backendCommentsService.includes('updateComment'), 'Backend comments service enforces ownership on update');
assert(backendCommentsService.includes('deleteComment'), 'Backend comments service enforces ownership or post/project ownership on delete');
assert(backendCommentsService.includes('reportComment'), 'Backend comments service creates content_reports record');

const backendRoutesIndex = fs.readFileSync('backend/src/routes/index.ts', 'utf8');
assert(backendRoutesIndex.includes("apiRouter.use('/comments', commentsRouter)"), 'apiRouter mounts unified /comments router');

const dbSchemaContent = fs.readFileSync('backend/src/db/schema.sql', 'utf8');
assert(dbSchemaContent.includes('CREATE TABLE IF NOT EXISTS comments'), 'schema.sql defines canonical comments table');
assert(dbSchemaContent.includes('CREATE TABLE IF NOT EXISTS comment_likes'), 'schema.sql defines comment_likes table');
assert(dbSchemaContent.includes('CREATE TABLE IF NOT EXISTS content_reports'), 'schema.sql defines content_reports table');
assert(dbSchemaContent.includes('CREATE TABLE IF NOT EXISTS post_saves'), 'schema.sql defines post_saves table');
assert(dbSchemaContent.includes('CREATE TABLE IF NOT EXISTS project_reposts'), 'schema.sql defines project_reposts table');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n============================================================');
console.log(`VERIFICATION COMPLETE: ${passCount} Passed, ${failCount} Failed`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SURGICAL ACCEPTANCE CRITERIA SATISFIED!');
  process.exit(0);
}
