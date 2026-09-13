# Application UI Foundation - engineering report

The complete application UI is implemented in one shared shell: Profile, Connect, Create, Learn and Discover, with local sign-up/login, sidebar navigation and the four-Core Quick Access menu. The temporary demo gate is removed.

1. **Files created** (13 application source files):

- `src/app/components/Artwork.tsx`
- `src/app/components/Dropdown.tsx`
- `src/app/components/Icon.tsx`
- `src/app/components/PageHero.tsx`
- `src/app/components/ProjectCard.tsx`
- `src/app/components/ProjectPreview.tsx`
- `src/app/components/UI.tsx`
- `src/app/data/catalog.ts`
- `src/app/data/models.ts`
- `src/app/data/WorkspaceProvider.tsx`
- `src/app/session/auth.ts`
- `src/modules/auth/AuthModule.tsx`
- `src/modules/create/ProjectComposer.tsx`

Also added `scripts/check-ui-foundation-preservation.mjs`, this report, `docs/ui-foundation/preservation-before.json`, `preservation-verification.json`, `validation.json`, and the screenshots linked below.

2. **Files modified** (22 existing source files):

- `src/app/application.css`
- `src/app/ApplicationRoot.tsx`
- `src/app/ApplicationShell.tsx`
- `src/app/CinematicEntry.tsx`
- `src/app/GlobalSidebar.tsx`
- `src/app/GlobalTopBar.tsx`
- `src/app/navigation.ts`
- `src/app/components/Avatar.tsx`
- `src/app/session/SessionProvider.tsx`
- `src/components/auth/SignupModal.tsx`
- `src/data/content.ts`
- `src/modules/connect/ConnectModule.tsx`
- `src/modules/connect/ConnectProvider.tsx`
- `src/modules/connect/data.ts`
- `src/modules/connect/repository.ts`
- `src/modules/connect/types.ts`
- `src/modules/connect/components/ConnectionAction.tsx`
- `src/modules/connect/components/PersonRow.tsx`
- `src/modules/create/CreateModule.tsx`
- `src/modules/discover/DiscoverModule.tsx`
- `src/modules/learn/LearnModule.tsx`
- `src/modules/profile/ProfileModule.tsx`

Also updated `tests/application.spec.ts` and `README.md`. Existing cinematic regression test files were not edited. Build and browser-report outputs were regenerated. No dependencies were added or changed.

3. **Files deleted:** `src/app/components/ModulePlaceholder.tsx`. Its four module boundaries now contain complete UI. The demo gate was removed from ApplicationRoot, rather than retained as a separate screen.

4. **Routing:** reused the existing hash router and history API. Public `/` remains the cinematic entry. `/#/signup`, `/#/login`, and `/#/app/{profile,connect,create,learn,discover}` are directly addressable. A guest entering a Core sees sign-up, then returns to the requested Core. Account restoration supports refresh. Sidebar and Quick Access navigation retain the same mounted shell.

5. **Authentication/sign-up:** `SessionProvider` delegates to a replaceable `AuthProvider` interface. The local implementation validates inputs, prevents duplicate email accounts, verifies login credentials, restores the active account, and persists identity edits. Local password verifiers use salted PBKDF2; passwords are not saved as plaintext. The UI says the profile is saved on this device and does not claim server registration. The existing public Get Started dialog now offers Create account. Its scroll/focus behavior is retained.

6. **Shared components:** reused SearchField, Avatar, the modal hook, ConnectProvider, connection actions and profile previews. Added Artwork, Icon, Dropdown, PageHero, ProjectCard, ProjectPreview, SectionHeader, Tags, Tabs, Panel and FilterControl. Shared buttons/forms use application-scoped CSS. Menus support keyboard navigation, Escape and outside dismissal; dialogs support keyboard focus and Escape.

7. **Core/module UI:** Connect provides a searchable/filterable/sortable people grid, suggestions, incoming/outgoing requests and shared connection status. Create provides nine project domains, templates, quick/full creation, description/vision/roles, draft and completed states, collaborator search, and inspiration previews. Learn provides topic-first search, eleven domain categories, ten sample paths, mentors, saved/in-progress/completed choices and goals. Discover provides projects, people, ideas, skills, communities and events, previews, local saves, trending-topic searches and community selections. Profile provides editable identity, skills/interests, learning preferences, created/collaboration project sections, activity and Core shortcuts.

8. **Data/state:** typed User, Person, Skill, Interest, Project, LearningPath, ConnectionRequest, Community and Activity models. Central catalogs hold sample projects, paths, communities and exploration items; Connect's existing dataset now includes photography, mathematics, cooking and music. WorkspaceProvider stores account-specific projects, learning records, goals, saved items and community selections. ConnectRepository stores account-specific request state behind its asynchronous interface. Newly registered users begin with their own empty project/profile/learning state; sample project inspiration is labeled separately. Project files retain name/size metadata only.

9. **Cinematic preservation:** the before/after audit inspected 2,143 existing files: 2,120 unchanged, 22 allowed application-source edits, one obsolete placeholder deletion. All 2,066 inspected assets and all references are unchanged. Cinematic controllers, ranges, caches, renderers, styles, asset registration, dimensions, timing and source mappings remain unchanged. Connect still uses Connect_start in both directions; invalid Create sequences remain excluded. The separate Core audit verified 2,056 protected files and all 1,140 packaged frames against their original bytes. The only existing entry changes are removal of its obsolete demo caption and the public sign-up dialog's new form navigation/copy. No new cinematic integration was introduced.

10. **Demo removal:** no LOCAL DEMO, A place to build together, Enter demo workspace or Back to the experience screen remains in application source or routes. No placeholder destination remains.

11. **Quick Access:** all four uppercase Core destinations were verified from every application section, including focus movement, Escape and outside dismissal. The user menu opens My Profile and Log out. Global search opens and focuses Connect search.

12. **Destinations and visual QA:** all five application routes pass direct entry, refresh, sidebar and history checks. Profile's four Core shortcuts pass. Each supplied Core reference was opened at its original 1,672 x 941 resolution; the 1,536 x 1,024 REFERENCE montage was inspected for sign-up and Profile. The implementation uses a 224px sidebar, 68px topbar, 44px left content inset, 324px Learn/Discover side panels and a 348px Create side panel. Hero art geometry, card density, controls and typography were compared to the actual reference files and adjusted. All six screens were captured at 1,672 x 941, with all five authenticated screens additionally checked at 1,366 x 768. No horizontal page/content overflow was found. New-account empty states and real user-entered identity intentionally replace the reference's example personal data.

Static architectural artwork and portraits are displayed through SVG viewports into the unchanged supplied reference images. Only decorative regions are exposed; all UI structure, text controls, forms, cards and state are live React/HTML. No Core animation frames are used by these modules.

| Screen | Desktop capture | Laptop capture | Reference |
| --- | --- | --- | --- |
| Connect | [1672 x 941](ui-foundation/screenshots/connect-1672.png) | [1366 x 768](ui-foundation/screenshots/connect-1366.png) | [Connect](../Ideas/Connect.png) |
| Create | [1672 x 941](ui-foundation/screenshots/create-1672.png) | [1366 x 768](ui-foundation/screenshots/create-1366.png) | [Create](../Ideas/Create.png) |
| Learn | [1672 x 941](ui-foundation/screenshots/learn-1672.png) | [1366 x 768](ui-foundation/screenshots/learn-1366.png) | [Learn](../Ideas/Learn.png) |
| Discover | [1672 x 941](ui-foundation/screenshots/discover-1672.png) | [1366 x 768](ui-foundation/screenshots/discover-1366.png) | [Discover](../Ideas/Discover.png) |
| Profile | [1672 x 941](ui-foundation/screenshots/profile-1672.png) | [1366 x 768](ui-foundation/screenshots/profile-1366.png) | [REFERENCE](../Ideas/REFERENCE.png) |
| Sign-up | [1672 x 941](ui-foundation/screenshots/signup-1672.png) | Desktop scope | [REFERENCE](../Ideas/REFERENCE.png) |

13. **Build/tests:** `npm.cmd run build -- --logLevel warn` passed, including TypeScript. Full `npm.cmd test -- --project=desktop`: **47 passed, 1 existing mobile-only test skipped, 0 failures** (3.3 minutes). Eleven application tests cover sign-up/login/account isolation, every route/menu, Connect requests, project creation/drafts/file metadata, learning states/goals, Discover saves/communities, Profile edits and cinematic-to-form entry. Automated WCAG A/AA scans found no violations across all six screens and the Profile edit dialog. Browser checks recorded no runtime errors or missing assets; direct application navigation made no Core-frame requests. Both preservation audits and `npm.cmd run check:references` passed. Earlier form-locator and contrast failures were corrected; the complete final suite passed without retries.

14. **Remaining limitations:** accounts and all changes stay in the current browser/origin; there is no server authentication or shared database. Directory, project, learning, community and event catalogs are deterministic examples. Connections, saved learning and community choices are local; no requests are delivered to other people. File bytes are neither uploaded nor persisted. Learning resources and project previews are UI foundations, not a course-delivery or full project-detail backend. Profile collaborations have an empty state until actual collaborator membership exists. Mobile/tablet optimization, messaging, calls, AI recommendations and further cinematic integration remain outside this milestone. The pre-existing invalid Create cinematic assets remain untouched.
