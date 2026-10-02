# Alumni Details System - AI-DLC Plan

Phase: Construction: B1 next

Last updated: 2026-10-02

## Project Goal

Complete the Alumni Details System frontend and properly integrate it
with the existing backend, database, Apache, HTTPS, and deployment setup.

## Technology

- Frontend: React + TypeScript + Ant Design
- Backend: Node.js + Express
- Database: PostgreSQL
- Web Server: Apache
- HTTPS: mkcert
- Deployment: Bash scripts
- AI Assistant: Claude Code

## AI-DLC Phases

### 1. Inception
- Understand requirements
- Analyze the existing codebase
- Identify completed and remaining work
- Create a plan
- Get human approval before major changes

### 2. Construction
- Implement the approved plan
- Integrate APIs
- Fix bugs
- Test changes
- Review code and security

### 3. Operations
- Build the frontend
- Check Apache configuration
- Deploy the application
- Verify the running system

## Development Workflow

Requirement
→ Analysis
→ Plan
→ Human Approval
→ Implementation
→ Testing
→ Review
→ Deployment

## Current State

Analysis from 2026-10-02. Table and column names were confirmed against the real database in bolt B8 (`db/schema.md`).

### Database schema (confirmed in B8)

Real tables: `"User"`, `alumni`, `posts`, `comment`. There is **no** `users` and **no** `comments` table.

| Table | Columns (type) | Constraints |
|---|---|---|
| `"User"` | `id` serial, `name` varchar(100), `email` varchar(100) NOT NULL, `password` varchar(255) NOT NULL, `role` varchar(50), `photo_url` text, `login_at`, `logout_at` timestamp, `created_at`, `updated_at` timestamp default now | PK `id`; `email` UNIQUE |
| `alumni` | `id` serial, `user_id` int, `graduation_year` **integer**, `department` varchar(100), `current_company` varchar(100), `job_title` varchar(100), `experience` varchar(100), `bio` text, `linkedin_url` text, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)`; **no UNIQUE on `user_id`**; no `email` column, no `created_at` |
| `posts` | `id` serial, `user_id` int, `caption` text, `media_url` text, `comment_count` int default 0, `created_at`, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)` |
| `comment` | `id` serial, `user_id` int, `posts_id` int, `parent_id` int, `content` text, `created_at`, `updated_at` timestamp default now | PK `id`; FK `user_id` → `"User"(id)`, `posts_id` → `posts(id)`, `parent_id` → `comment(id)` |

Consequences for the plan:

- The alumni column is `graduation_year` (integer). The backend's `graduation_yr` is wrong; the fix is in B11 (moved from L.7), and B12 sends `graduation_year`.
- The comment → post column is `posts_id`.
- Form length limits: `name`, `email`, `department`, `current_company`, `job_title` and `experience` are varchar(100). They go into `constants/validation.ts` in B1.
- **No foreign key has `ON DELETE CASCADE`.** Deleting a post that has comments, a comment that has replies, or a user who has posts, comments or an alumni row fails with a foreign-key error. How B5, B6 and B14 handle this is Q7.
- `alumni.user_id` has no UNIQUE constraint, so "one profile per user" (Q4) is not enforced by the database (see B12).

### Infrastructure status

- HTTPS/SSL: Complete
- Apache configuration: Complete
- Reverse proxy: Complete
- Frontend build script: Complete
- Startup script: Complete
- Deployment script: Complete
- Existing frontend analysis: Complete

### Screens by role (from routes and role middleware)

"Any" in the backend means only a login token is checked, not a role.

| # | Screen | Backend endpoints | Student | Alumni | Admin |
|---|---|---|:-:|:-:|:-:|
| 1 | Login | `POST /api/auth/login` | ✅ | ✅ | ✅ |
| 2 | Sign up / Register | `POST /api/users` (public) | ✅ | ✅ | ✅ |
| 3 | Dashboard shell (layout, role-based menu, logout) | `PUT /api/users/:id/logout` | ✅ | ✅ | ✅ |
| 4 | My Profile (view / edit name, email, photo, password) | `GET /api/users/:id`, `PUT /api/users/:id` | ✅ | ✅ | ✅ |
| 5 | Alumni Directory (list) | `GET /api/alumni` | ✅ | ✅ | ✅ |
| 6 | Alumni Detail | `GET /api/alumni/:id`, `GET /api/alumni/email/:email` | ✅ | ✅ | ✅ |
| 7 | Create Alumni Profile | `POST /api/alumni` | ❌ | ✅ | ✅ |
| 8 | Edit Alumni Profile | `PUT /api/alumni/:id` (route allows any login; UI limits to owner / admin) | ❌* | ✅ own | ✅ |
| 9 | Posts Feed (list) | `GET /api/posts` | ✅ | ✅ | ✅ |
| 10 | Create Post | `POST /api/posts` | ❌ | ✅ | ✅ |
| 11 | Edit Post | `PUT /api/posts/:id` (route allows any login; UI limits to owner) | ❌ | ✅ own | ✅ |
| 12 | Delete Post | `DELETE /api/posts/:id` (controller checks owner or admin) | ❌ | ✅ own | ✅ any |
| 13 | Comments on a post (list, add, reply, edit, delete) | `GET/POST /api/comments`, `PUT/DELETE /api/comments/:id` | ✅ | ✅ | ✅ |
| 14 | User Management (list, search by email, delete) | `GET /api/users`, `GET /api/users/email/:email`, `DELETE /api/users/:id` | ❌ | ❌ | ✅ |

\* The backend route lets students call it; only the UI would stop them.

### Built vs missing (`frontend/src`)

| Screen / piece | Status | Notes |
|---|---|---|
| Login | ✅ Built | Saves the password in `localStorage` in plain text with "Remember me". Uses `window.location.href` instead of the router. |
| Dashboard shell | 🟡 Partial | Layout and menu exist; menu items other than Logout do nothing; menu is not role-based; logout doesn't call `/logout`. |
| Route protection | 🟡 Partial | Only checks that a token exists; ignores expiry (1 hour) and role; no reusable guard. |
| Current-user info (id, role) | ❌ Missing | Login returns only `{ token }`; id and role must be read from the JWT (`sub`, `role`). |
| API client | ❌ Missing | No shared axios instance, no Bearer header, no 401 handling, no Vite dev proxy. |
| Sign up | ❌ Missing | |
| My Profile | ❌ Missing | |
| Alumni Directory / Detail | ❌ Missing | |
| Create / Edit Alumni Profile | ❌ Missing | |
| Posts Feed / Create / Edit / Delete | ❌ Missing | |
| Comments | ❌ Missing | No "comments for one post" endpoint; filter by post on the client. |
| Admin User Management | ❌ Missing | |
| Responsive layout | ❌ Missing | Sidebar is a fixed 220px and doesn't collapse. |
| `services/*Api.ts` for users, alumni, posts, comments | ❌ Missing | Only `authApi.ts` exists. |

### SQL problems (`backend/src/dal/query`)

| File : method | Problem | Breaks UI? | Screen affected |
|---|---|:-:|---|
| `AlumniQuery.createAlumni` | `INSER` typo; inserts into `users` (no such table; must be `alumni`); `graduation_yr?` (real column `graduation_year`), `current_company?`, `job_title?`, `experience?` are invalid column names | 🔴 Always fails | Create Alumni Profile |
| `AlumniQuery.updateAlumni` | Table `users` (no such table); `?` in column names; `graduation_yr` instead of `graduation_year`; SQL uses `$8` but only 7 values passed (`id` missing); omitted fields set to NULL | 🔴 Always fails | Edit Alumni Profile |
| `AlumniQuery.findAlumniById` | Reads `users` (no such table) instead of `alumni` | 🔴 Always fails | Alumni Detail |
| `AlumniQuery.findAlumniByEmail` | Reads `users` (no such table); `alumni` has no `email`, needs a join with `"User"` | 🔴 Always fails | Alumni Detail (by email) |
| `AlumniQuery.getAllAlumni` | Table OK, but no join to `"User"`, so no name / email / photo | 🟡 Data gap | Alumni Directory |
| `CommentQuery.createComment` / `getAllComments` | Table `comment` — correct | ✅ | — |
| `CommentQuery.updateComment` | Table `comments` (no such table; must be `comment`); missing comma in `content=$1 updated_at=NOW()` (syntax error) | 🔴 Always fails | Edit comment |
| `CommentQuery.deleteComment` | Table `comments` (no such table; must be `comment`) | 🔴 Always fails | Delete comment |
| `PostQuery.deletePost`, `CommentQuery.deleteComment`, `UserQuery.deleteUser` | No `ON DELETE CASCADE`: fails when the post has comments, the comment has replies, or the user has posts / comments / an alumni row (Q7) | 🔴 When related rows exist | Delete Post, Delete comment, User Management |
| `UserQuery.updateUser` | Always writes `password` and `email`; an edit without a password sets it to NULL and locks the user out | 🔴 Yes | My Profile |
| `PostQuery.updatePost` | Omitted caption / media become NULL | 🟡 Data loss | Edit Post |
| `PostQuery.updateCommentCount` | Never called; `comment_count` stays 0 | 🟡 Wrong count | Posts Feed |
| Other `UserQuery` / `PostQuery` methods | No problems found (`"User"` and `posts` are the real table names) | ✅ | — |

Related, outside the SQL files: `graduation_yr` in `AlumniDTO.ts` and `AlumniController.ts` is wrong — the column (and the `shared` type) is `graduation_year` (fixed in B11); `POST /api/comments` reads `post_id` from the body but the column is `posts_id`; sign-up accepts `role` from the body; `PUT /api/users/:id/login` needs no login; alumni lookups return 200 with an empty body when not found.

### API endpoints: used vs unused by the frontend

| Method | Path | Access | Used now | Planned in bolt |
|---|---|---|:-:|---|
| GET | `/api/health` | public | ❌ | B15 (smoke check through Apache) |
| POST | `/api/auth/login` | public | ✅ `LoginFrom.tsx` | B2 (move onto `apiClient`) |
| POST | `/api/users` | public | ❌ | B7 |
| GET | `/api/users` | admin | ❌ | B6 |
| GET | `/api/users/:id` | any login | ❌ | B2 (current user's name / photo), B10 |
| GET | `/api/users/email/:email` | admin | ❌ | B6 |
| PUT | `/api/users/:id` | any login | ❌ | B10 |
| DELETE | `/api/users/:id` | admin | ❌ | B6 |
| PUT | `/api/users/:id/login` | public (no token) | ❌ | Not planned (see L.3) |
| PUT | `/api/users/:id/logout` | any login | ❌ | B4 |
| POST | `/api/alumni` | alumni, admin | ❌ | B12 |
| GET | `/api/alumni` | any login | ❌ | B12 |
| GET | `/api/alumni/:id` | any login | ❌ | B12 |
| GET | `/api/alumni/email/:email` | any login | ❌ | Not planned (detail page uses `:id`) |
| PUT | `/api/alumni/:id` | any login | ❌ | B12 |
| POST | `/api/posts` | alumni, admin | ❌ | B5 |
| GET | `/api/posts` | any login | ❌ | B5, B6 |
| PUT | `/api/posts/:id` | any login | ❌ | B5 |
| DELETE | `/api/posts/:id` | owner or admin | ❌ | B5 |
| POST | `/api/comments` | any login | ❌ | B14 |
| GET | `/api/comments` | any login | ❌ | B14 |
| PUT | `/api/comments/:id` | any login | ❌ | B14 |
| DELETE | `/api/comments/:id` | any login | ❌ | B14 |

`PostController.findPostById` exists but has no route.

## UI Design and Code Structure

### a. Theme

- One file, `frontend/src/theme/theme.ts`, exports an Ant Design `ThemeConfig`:
  `token.colorPrimary`, `token.fontFamily`, `token.borderRadius`, plus a small
  `components` override block (e.g. `Layout`, `Menu`) when needed.
- `main.tsx` wraps the app once in `<ConfigProvider theme={theme}>` and `<App>` (antd),
  so `message`, `notification` and `modal` come from `App.useApp()` and pick up the theme.
- antd v6 uses CSS variables, so any custom CSS reads `var(--ant-color-primary)`,
  `var(--ant-border-radius)` etc. instead of literal values.
- No hard-coded colors (no hex/rgb) in components or pages. No inline `style={{...}}`
  objects in pages. Layout is done with antd layout components (`Flex`, `Space`, `Row`/`Col`,
  `Grid.useBreakpoint`) and their props; anything left goes in a co-located `*.module.css`
  that only uses theme CSS variables.
- Role colors (student / alumni / admin) are defined once in the theme folder and used by `RoleTag`.
- **Theme choice: Option A — Academic Navy** (Q1, decided 2026-10-02): `colorPrimary`
  `#1E4FA3`, `fontFamily` Inter, `borderRadius` 8.

### b. Folder structure (`frontend/src`)

Extends the existing `pages/`, `components/`, `services/`, `store/` convention.

```
src/
  main.tsx                 ConfigProvider + antd App + Jotai Provider + router
  App.tsx                  route table only (uses routes/)
  theme/                   theme.ts (ThemeConfig), roleColors.ts
  routes/                  paths.ts (route constants), RequireAuth.tsx, RequireRole.tsx
  pages/                   one route-level container per screen; fetches data via hooks,
                           composes components; no layout styling, no axios
    auth/                  LoginPage, SignUpPage
    dashboard/             DashboardPage
    profile/               ProfilePage
    alumni/                AlumniListPage, AlumniDetailPage
    posts/                 PostsFeedPage
    admin/                 UserManagementPage
    errors/                NotFoundPage, ForbiddenPage
  components/
    layout/                AppLayout, AuthLayout, SideMenu, HeaderUserMenu
    common/                reusable, presentational, no API calls (see c.)
    auth/                  LoginForm, SignUpForm
    alumni/                AlumniForm, AlumniDescriptions
    posts/                 PostCard, PostForm
    comments/              CommentThread, CommentItem, CommentForm
    users/                 ProfileForm
  services/                apiClient.ts (one axios instance), authApi, usersApi,
                           alumniApi, postsApi, commentsApi — the only place HTTP happens
  store/                   authAtom.ts (token), currentUserAtom (decoded JWT: id, role, exp)
  hooks/                   useCurrentUser, useRequest (data / loading / error / reload),
                           useIsMobile
  constants/               roles.ts, validation.ts (shared form rules)
  types/                   frontend-only types; reuse @alumni/shared types where they
                           match the backend
  utils/                   jwt.ts (decode), format.ts (dates, names)
```

- The existing `components/LoginFrom.tsx` moves to `components/auth/LoginForm.tsx`
  (its only importer is `pages/LoginPage.tsx`; update that import in the same change).
- The existing `components/Dashboard.tsx` is split into `components/layout/AppLayout.tsx`
  (shell) and `pages/dashboard/DashboardPage.tsx` (content).

### c. Reusable components (build once, use on every screen)

| Component | Props | Used by |
|---|---|---|
| `AppLayout` | none (route layout, renders `<Outlet />`) | All logged-in screens |
| `SideMenu` | `collapsed: boolean`, `onNavigate?: () => void` — items filtered by role | `AppLayout` (Sider on desktop, Drawer on mobile) |
| `HeaderUserMenu` | none (reads current user) — avatar + Dropdown (Profile, Logout) | `AppLayout` |
| `AuthLayout` | `title: string`, `subtitle?: string`, `children` | Login, Sign Up |
| `PageHeader` | `title: string`, `subtitle?: string`, `breadcrumb?: BreadcrumbProps['items']`, `extra?: ReactNode` | All logged-in screens |
| `DataTable<T>` | `columns: ColumnsType<T>`, `data: T[]`, `rowKey: keyof T`, `loading?: boolean`, `toolbar?: ReactNode`, `onSearch?: (q: string) => void`, `searchPlaceholder?: string` — wraps `Table` with horizontal scroll, pagination defaults, `EmptyState` | Alumni Directory, User Management |
| `FormModal<T>` | `open: boolean`, `title: string`, `initialValues?: Partial<T>`, `onSubmit: (values: T) => Promise<void>`, `onCancel: () => void`, `submitText?: string`, `children` (Form.Items) — owns the form instance, submit loading, reset, error message; full-width on mobile | Profile edit, Create/Edit Alumni, Create/Edit Post, Edit Comment |
| `ConfirmDelete` | `title: string`, `description?: string`, `onConfirm: () => Promise<void>`, `children` (trigger) — Popconfirm with danger button + success/error message | Delete Post, Comment, User |
| `AsyncContent` | `loading: boolean`, `error?: unknown`, `empty?: boolean`, `emptyText?: string`, `onRetry?: () => void`, `children` — picks one of the three views below | Every screen that loads data |
| `LoadingState` | `tip?: string` (Spin / Skeleton) | `AsyncContent` |
| `EmptyState` | `description: string`, `action?: ReactNode` (Empty) | `AsyncContent`, `DataTable` |
| `ErrorState` | `error: unknown`, `onRetry?: () => void` (Result status="error") | `AsyncContent` |
| `RoleTag` | `role: Role` | Header menu, Profile, User Management, Alumni Detail, PostCard, CommentItem |
| `UserAvatar` | `name: string`, `photoUrl?: string`, `size?: AvatarProps['size']`, `showName?: boolean` — initials fallback | Header, Profile, Alumni list/detail, PostCard, CommentItem, User Management |
| `Can` | `roles?: Role[]`, `ownerId?: number`, `allowAdmin?: boolean`, `children`, `fallback?: ReactNode` — show/hide actions by role or ownership | Create/Edit/Delete buttons on every screen |
| `RequireAuth` / `RequireRole` | `children` / `roles: Role[]` — redirect to login or show `ForbiddenPage` | Router (`routes/`) |

Feature components (reused inside one feature): `LoginForm`, `SignUpForm`, `ProfileForm`,
`AlumniForm` (create + edit), `AlumniDescriptions`, `PostCard`, `PostForm` (create + edit),
`CommentThread`, `CommentItem`, `CommentForm` (add + reply + edit).

### d. Reuse rules

1. HTTP only in `services/*Api.ts` through the shared `apiClient`; components and pages never import axios.
2. All API paths are relative `/api/...`. Vite dev proxy forwards `/api` locally; Apache does it in production. `VITE_API_URL` is not used.
3. One component per file; file name = component name (PascalCase); default export, matching the existing code.
4. Every component has a typed `interface XxxProps`; no `any`. API request/response types live in `types/` or come from `@alumni/shared`.
5. `components/common` and `components/layout` are presentational: no API calls, no page-specific logic.
6. Pages own data loading (via `useRequest`) and pass data down; feature components receive data and callbacks via props.
7. Form validation rules come from `constants/validation.ts` (required, email, url, password min length, graduation year range); forms don't redefine them.
8. Role names, route paths and role colors are constants, never string literals in components.
9. Colors, spacing and radius come from the theme (tokens / CSS variables) only.
10. User feedback through `App.useApp()` (`message`, `modal`), not static `message.*` calls.
11. Every screen is checked at 360 / 768 / 1280 px widths before it is ticked.
12. Create and edit share one form component (`AlumniForm`, `PostForm`, `CommentForm`), switched by `initialValues`.

### e. Screens: layout and Ant Design components

| Screen (route) | Roles | Layout | Ant Design components |
|---|---|---|---|
| Login (`/`) | public | `AuthLayout`: centered Card, max width ~420px, full width on mobile | Card, Form, Input, Input.Password, Checkbox, Button, Alert, Typography, link to Sign Up |
| Sign Up (`/signup`) | public | `AuthLayout` | Form, Input, Input.Password (+ confirm), Input (photo URL), Select (role — pending decision), Button, Alert |
| Dashboard (`/dashboard`) | all | `AppLayout` + `PageHeader`; Row of stat Cards (4 → 2 → 1 columns), then recent posts list | Row/Col, Card, Statistic, List, `UserAvatar`, `AsyncContent` |
| My Profile (`/profile`) | all | `PageHeader` + one Card: avatar and name on top, details below; Edit opens `FormModal` | Card, Descriptions (1 column on mobile), `UserAvatar`, `RoleTag`, Button, `FormModal` + Form, Input, Input.Password |
| Alumni Directory (`/alumni`) | all | `PageHeader` (extra: "Add my alumni profile" via `Can`), search + filters toolbar, `DataTable`; less important columns hidden on small screens | `DataTable` (Table), Input.Search, Select (department), InputNumber / Select (year), `UserAvatar`, Button |
| Alumni Detail (`/alumni/:id`) | all | `PageHeader` with breadcrumb + Edit (owner/admin via `Can`); Card with avatar header, details, bio | Card, Descriptions, Typography.Paragraph, `UserAvatar`, `RoleTag`, Button (LinkedIn), `AsyncContent` |
| Create / Edit Alumni (modal) | alumni, admin; edit = owner/admin | `FormModal` with `AlumniForm` | Form, Input, Select / AutoComplete (department), InputNumber (year), Input.TextArea (experience, bio), Input (LinkedIn URL) |
| Posts Feed (`/posts`) | all; create = alumni, admin | `PageHeader` (extra: "New post" via `Can`); single centered column (max ~720px) of `PostCard` | List, Card, Card.Meta, `UserAvatar`, Image, Typography.Paragraph (ellipsis), Dropdown (edit/delete), `ConfirmDelete`, `FormModal` + `PostForm` (Input.TextArea, Input URL) |
| Comments (Drawer from a post) | all; edit/delete = owner | Drawer (right side on desktop, full width on mobile) with `CommentThread`; replies indented one level; `CommentForm` pinned at bottom | Drawer, List, `UserAvatar`, Typography, Input.TextArea, Button, `ConfirmDelete` |
| User Management (`/admin/users`) | admin | `PageHeader` + `DataTable` with email search | `DataTable`, Input.Search, `UserAvatar`, `RoleTag`, `ConfirmDelete`, Typography (login/logout times) |
| Forbidden / Not Found | all | Centered result | Result, Button (back to dashboard) |

## Work Plan

Rules for this plan:
- Frontend first: theme and reusable components come before any screen.
- Only backend fixes that a screen cannot work without are in the main path, right before that screen. Everything else is in "Later: backend hardening".
- No SQL is changed before bolt B8 (real table definitions saved as `db/schema.md`) is done.
- Every screen is built responsive (360 / 768 / 1280 px) from the start, not as a final step.
- All API calls use relative `/api/...` paths (Apache proxies `/api` in production). Do not use `VITE_API_URL`.
- A bolt does not start while one of its Open Questions is unanswered.

### Bolt protocol

One bolt = one session.

1. **Start:** re-read this plan, confirm the bolt's dependencies are ✅ and its Open Questions are answered, set its Status to 🔄 In progress.
2. **Build:** change only the files listed in the bolt's Deliverables. Anything extra is raised with the owner first.
3. **End of bolt — show the diff:** `git status` and `git diff` for everything the bolt changed.
4. **Give a test checklist:** concrete steps the owner can run (commands, URLs, roles to log in as, widths to check, expected result).
5. **Wait for approval.** No next bolt and no commit until the owner approves.
6. **After approval:** set Status to ✅ Done, add an entry to the Decision Log (date, bolt, what was decided or changed), and update "Last updated" at the top.

Status values: ⬜ Not started · 🔄 In progress · ⏸ Blocked (open question) · ✅ Done

### Bolts

| # | Bolt | Deliverables (exact files and components) | Depends on | Status |
|---|---|---|---|---|
| B0 | Repo hygiene and docs cleanup | Root `.gitignore` (`node_modules/`, `.env`, `frontend/.env`, `dist/`); untrack those files with `git rm --cached` (files stay on disk; secret values untouched, owner rotates them); `CLAUDE.md`: add a "UI Rules" section pointing to `AIdlc/plan.md`, remove the non-existent `npm run lint` command; `frontend/package.json`: add `@ant-design/icons`; delete unused `frontend/src/App.css` and `frontend/src/index.css` (imported nowhere); `frontend/index.html`: `<title>Alumni Details System</title>` | — | ✅ |
| B1 | Theme and constants | `src/theme/theme.ts`, `src/theme/roleColors.ts`; font package + import (per Q1); `src/main.tsx` (antd `ConfigProvider` + antd `App` + Jotai `Provider`); `src/constants/roles.ts`, `src/constants/validation.ts` (includes max length 100 for `name`, `email`, `department`, `current_company`, `job_title`, `experience` — varchar(100) in `db/schema.md`); `src/routes/paths.ts`; record the theme choice in "UI Design and Code Structure" | B0, Q1 | ⬜ |
| B2 | API and auth data layer | `frontend/vite.config.ts` (`/api` dev proxy only); `src/services/apiClient.ts`; `src/services/authApi.ts` (on `apiClient`); `src/services/usersApi.ts` (`getUserById`, `logout`); `src/utils/jwt.ts`; `src/store/authAtom.ts` (+ `currentUserAtom`, expiry); `src/hooks/useCurrentUser.ts`, `src/hooks/useRequest.ts`, `src/hooks/useIsMobile.ts`; `src/types/` (API types, reusing `@alumni/shared`) | B1 | ⬜ |
| B3 | Reusable common components | `src/components/common/`: `PageHeader.tsx`, `AsyncContent.tsx`, `LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `DataTable.tsx`, `FormModal.tsx`, `ConfirmDelete.tsx`, `RoleTag.tsx`, `UserAvatar.tsx`, `Can.tsx` | B2 | ⬜ |
| B4 | Layouts, guards, router, Login | `src/components/layout/`: `AuthLayout.tsx`, `AppLayout.tsx`, `SideMenu.tsx`, `HeaderUserMenu.tsx` (logout calls `PUT /api/users/:id/logout`); `src/routes/RequireAuth.tsx`, `src/routes/RequireRole.tsx`; `src/pages/errors/ForbiddenPage.tsx`, `NotFoundPage.tsx`; `src/App.tsx` (route table, nested protected routes); move `components/LoginFrom.tsx` → `components/auth/LoginForm.tsx` (remember email only, no password) and `pages/LoginPage.tsx` → `pages/auth/LoginPage.tsx`; `src/pages/dashboard/DashboardPage.tsx` (placeholder); delete `components/Dashboard.tsx` and `pages/Dashboard.tsx` | B3 | ⬜ |
| B5 | Posts | `src/services/postsApi.ts`; `src/pages/posts/PostsFeedPage.tsx`; `src/components/posts/PostCard.tsx`, `PostForm.tsx`; create / edit via `FormModal` (edit always sends both `caption` and `media_url`, because `updatePost` overwrites omitted fields with NULL — see L.10), delete via `ConfirmDelete`; [BE] `backend/src/dal/query/PostQuery.ts` → `getAllPosts` joins `"User"` to return the author's name and photo (no password) (Q6); deleting a post that has comments fails (no `ON DELETE CASCADE`) — handle per Q7 | B4, B8, Q3, Q6, Q7 | ⬜ |
| B6 | Dashboard home and User Management | `src/pages/dashboard/DashboardPage.tsx` (stat cards, recent posts); `src/services/usersApi.ts` (`getAllUsers`, `getUserByEmail`, `deleteUser`); `src/pages/admin/UserManagementPage.tsx` (`DataTable`, search, `ConfirmDelete`; password never shown); deleting a user who has posts, comments or an alumni row fails (no `ON DELETE CASCADE`) — handle per Q7 | B5, Q7 | ⬜ |
| B7 | Sign Up | `src/components/auth/SignUpForm.tsx`; `src/pages/auth/SignUpPage.tsx`; `usersApi.createUser`; `/signup` route; link from Login | B4, Q2, Q5 | ⬜ |
| B8 | [BE] Database verification | Give the owner the `psql` commands (`\dt`, `\d "User"`, `\d users`, `\d alumni`, `\d posts`, `\d comment`, `\d comments`); save the owner's output as `db/schema.md`; correct table / column names in "Current State" | — | ✅ |
| B9 | [BE] User update fix | `backend/src/dal/query/UserQuery.ts` → `updateUser` no longer overwrites omitted fields (`password`, `email`, …) with NULL | B8 | ⬜ |
| B10 | My Profile | `src/pages/profile/ProfilePage.tsx`; `src/components/users/ProfileForm.tsx` (in `FormModal`); `usersApi.updateUser` | B4, B9, Q5 | ⬜ |
| B11 | [BE] Alumni SQL fixes | `backend/src/dal/query/AlumniQuery.ts`: `createAlumni` (`INSER`, table, `?` columns), `updateAlumni` (table, `?` columns, `$8` id, no NULL overwrite), `findAlumniById`, `findAlumniByEmail` (table, join `"User"`), `getAllAlumni` (join `"User"` for name / email / photo, no password); all queries use the real column `graduation_year`; `graduation_yr` → `graduation_year` also in `backend/src/dal/dto/AlumniDTO.ts` and `backend/src/api/controllers/AlumniController.ts` (moved from L.7) | B8 | ⬜ |
| B12 | Alumni screens | `src/services/alumniApi.ts` (sends `graduation_year`); "one profile per user" (Q4) is **not** enforced by the database (`alumni.user_id` has no UNIQUE constraint), so the UI hides "Add my alumni profile" when the current user already has one; `src/pages/alumni/AlumniListPage.tsx`, `AlumniDetailPage.tsx`; `src/components/alumni/AlumniForm.tsx`, `AlumniDescriptions.tsx`; alumni stat card on `DashboardPage.tsx` | B6, B11, Q4 | ⬜ |
| B13 | [BE] Comments SQL fixes | `backend/src/dal/query/CommentQuery.ts`: table `comment` (not `comments`) in all methods; missing comma in `updateComment` | B8 | ⬜ |
| B14 | Comments | `src/services/commentsApi.ts` (body `post_id`, response `posts_id`, client-side filter by post); `src/components/comments/CommentThread.tsx`, `CommentItem.tsx`, `CommentForm.tsx`; Drawer opened from `PostCard.tsx`; deleting a comment that has replies fails (no `ON DELETE CASCADE`) — handle per Q7 | B5, B13, Q7 | ⬜ |
| B15 | Verification and review | `npm run build`; every Acceptance Criteria check (greps, 360 / 768 / 1280 px, console); every screen per role (student, alumni, admin); `/api/health` and app `/api` calls through Apache over HTTPS; **refresh a deep link such as `/alumni` (and `/alumni/:id`) through Apache — page must load, not 404**; final code review; final security review | B0–B14 | ⬜ |

### Later: backend hardening

Not needed for any screen to work; done after the main path. Nothing here is dropped.

- [ ] L.1 Remove `password` from every user endpoint response (create, get all, get by id, get by email, update)
- [ ] L.2 `PUT /api/users/:id`: allow only the owner (`req.user.sub`) or an admin
- [ ] L.3 Review `PUT /api/users/:id/login` (currently unauthenticated)
- [ ] L.4 Implement the sign-up `role` decision (Q2) on the backend
- [ ] L.5 `PUT /api/alumni/:id`: allow only the owner or an admin
- [ ] L.6 Return 404 when an alumni record is not found
- [ ] L.7 ~~Align `graduation_yr` (backend) with `graduation_year` (`shared` types)~~ — moved into B11 (B8 confirmed the column is `graduation_year`)
- [ ] L.8 `POST /api/posts`: take `user_id` from `req.user.sub`, not the body
- [ ] L.9 `PUT /api/posts/:id`: allow only the owner or an admin
- [ ] L.10 Fix `PostQuery.updatePost` so omitted fields are not overwritten with NULL
- [ ] L.11 Keep `comment_count` correct (call `updateCommentCount` on comment create/delete, or compute it)
- [ ] L.12 `POST /api/comments`: take `user_id` from `req.user.sub`, not the body
- [ ] L.13 `PUT` / `DELETE /api/comments/:id`: allow only the owner (and admin for delete)
- [ ] L.14 Align `post_id` (request body) with `posts_id` (column / shared type)
- [ ] L.15 Add a "comments by post" endpoint (then drop client-side filtering)

## Open Questions

The owner writes the answer under each question. A bolt that depends on an unanswered question stays ⏸ Blocked.

### Q1 — Theme (bolt B1)
Option A "Academic Navy": primary `#1E4FA3`, font Inter, radius 8px.
Option B "Modern Teal": primary `#0F766E`, font Plus Jakarta Sans, radius 10px.
Recommendation: A (Inter reads well in the dense alumni and user tables).
- **Answer (2026-10-02):** A — Academic Navy: primary `#1E4FA3`, font Inter, radius 8px.

### Q2 — Sign-up role (bolt B7, later L.4)
Sign-up currently takes `role` from the request body, so anyone can register as admin. Options:
(a) the user picks student or alumni, admin is never selectable;
(b) everyone signs up as student and an admin promotes them;
(c) something else.
- **Answer (2026-10-02):** (a) for now — the user picks student or alumni; admin is never selectable. This may change to (b) if the owner's supervisor decides so.

### Q3 — Admin and other users' posts (bolt B5, later L.9)
Admin can already delete any post. Should admin also be able to edit any post, or only their own?
- **Answer (2026-10-02):** Admin can delete any post but edit only their own.

### Q4 — Alumni profile creation (bolt B12)
Does an alumni user create only their own profile (`user_id` = themselves), or can an admin create a profile for any user (needs a user picker)? Is it one alumni profile per user?
- **Answer (2026-10-02):** A user creates only their own alumni profile, one per user; no user picker.

### Q5 — Profile photos (bolts B7, B10)
The backend stores only `photo_url` and has no upload endpoint. Is a URL text field acceptable for now (with an initials avatar as fallback)?
- **Answer (2026-10-02):** Yes — a URL field with an initials avatar fallback.

### Q6 — Post author name and photo (bolt B5) [BE]
Should `GET /api/posts` join the user table to return the author's name and photo, so `PostCard` can show them?
- **Answer (2026-10-02):** Yes. Added to B5 as a [BE] deliverable.

### Q7 — Deleting rows that other rows reference (bolts B5, B6, B14) [BE]
B8 showed that no foreign key has `ON DELETE CASCADE`. So deleting a post that has comments, a comment that has replies, or a user who has posts, comments or an alumni row fails with a foreign-key error. Options:
(a) block it in the UI: hide or disable Delete when related rows exist, and show a clear message if the backend still returns the error;
(b) the backend deletes the related rows first (in one transaction) in `deletePost`, `deleteComment`, `deleteUser`;
(c) change the foreign keys to `ON DELETE CASCADE` (or `SET NULL` for `comment.parent_id`) with a database migration;
(d) something else.
- **Answer:**

## Scripts

- `scripts/build.sh` → builds the frontend
- `scripts/start.sh` → starts backend and Apache
- `scripts/deploy.sh` → builds, checks Apache, and starts the application

## Rules

- Do not modify files without approval for major tasks.
- Follow the existing project architecture.
- Use Ant Design for UI.
- Reuse existing services and components where possible.
- Test every major change.
- Update this plan after completing a major task.

## Acceptance Criteria

Each item is checked in bolt B15 (and for the screens touched, at the end of every bolt).

1. **Responsive:** every screen works at 360, 768 and 1280 px wide with no horizontal scroll. Check in DevTools device mode on each screen: `document.documentElement.scrollWidth <= window.innerWidth` returns `true`.
2. **No hard-coded colors outside `src/theme`:** this command prints nothing:
   ```bash
   grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color:\s*['\"]?(white|black|red|green|blue|gray|grey)\b" frontend/src --include=*.ts --include=*.tsx --include=*.css | grep -v "^frontend/src/theme/"
   ```
3. **Ant Design only:** no other UI or styling library in `frontend/package.json`; this prints nothing:
   ```bash
   grep -nE "@mui|bootstrap|tailwind|chakra|styled-components|@emotion|semantic-ui" frontend/package.json
   ```
4. **Components take typed props and make no API calls:** every component in `src/components` declares a typed `Props` interface, and these print nothing:
   ```bash
   grep -rnE "from ['\"](axios|.*services/)" frontend/src/components
   grep -rnE ":\s*any\b|as any\b" frontend/src
   ```
5. **Build passes:** `npm run build` (repo root) exits with code 0.
6. **No browser console errors:** DevTools Console shows no errors on any screen, logged in as student, alumni and admin.

## Decision Log

### 2026-10-02

- Bash scripts are used for build, startup, and deployment automation.
- Apache serves the production frontend.
- Apache proxies `/api` requests to the Node.js backend.
- Claude Code is being used as the AI development assistant.
- AWS AI-DLC workflow will be followed for remaining development.
- Owner approved the AI-DLC UI plan (Current State, UI Design and Code Structure, Work Plan bolts B0–B15, Later: backend hardening, Open Questions, Acceptance Criteria).
- Frontend first: theme and reusable components are built before any screen.
- API calls use relative `/api` paths; a Vite dev proxy forwards `/api` in development and Apache in production. `VITE_API_URL` is not used.
- Only backend fixes that a screen cannot work without are in the main path; all other backend items are in "Later: backend hardening".
- Q1: Theme A — Academic Navy (`#1E4FA3`), Inter, radius 8px.
- Q2: Sign-up role (a) for now — user picks student or alumni, admin never selectable; may change to (b) if the supervisor decides so.
- Q3: Admin can delete any post but edit only their own.
- Q4: A user creates only their own alumni profile, one per user; no user picker.
- Q5: Photos are a URL field with an initials avatar fallback.
- Q6: `GET /api/posts` will join the user table to return the author's name and photo ([BE], in B5).
- Phase moved to Construction; B0 is next.
- B0 done (owner approved): root `.gitignore` added (`node_modules/`, `.env`, `frontend/.env`, `dist/`); `node_modules` (root, `backend/src/api`, `backend/src/dal`), `.env` and `frontend/.env` untracked with `git rm --cached` (still on disk; owner rotates the secrets); unused `frontend/src/App.css` and `frontend/src/index.css` deleted; `@ant-design/icons` added to `frontend/package.json`; page title set to "Alumni Details System"; `CLAUDE.md` gained a "UI Rules" section, lost the non-existent lint command, and its "Root-level oddity" section was replaced by "Ignored files". `npm run build` passes.- B8 done (owner approved): owner ran the `psql` commands; output saved unchanged as `db/schema.md`. Real tables are `"User"`, `alumni`, `posts`, `comment` (no `users`, no `comments`). "Current State" corrected (new "Database schema" section, SQL problems table updated). Consequences recorded: `graduation_yr` → `graduation_year` fix moved from L.7 into B11 (also `AlumniDTO.ts`, `AlumniController.ts`) and B12 sends `graduation_year`; comment column is `posts_id`; varchar(100) limits for `name`, `email`, `department`, `current_company`, `job_title`, `experience` added to B1 validation constants; no foreign key has `ON DELETE CASCADE`, so Q7 added and B5, B6, B14 depend on it (unanswered); `alumni.user_id` has no UNIQUE constraint, noted in B12 (Q4 enforced in the UI only). No SQL or code changed.
