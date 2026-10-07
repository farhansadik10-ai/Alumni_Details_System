import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell/AppShell";
import { ToastViewport } from "./components/ui/Toast/ToastViewport";
import { ANY_OTHER_PATH, PATHS } from "./routes/paths";
import { PublicOnly } from "./routes/PublicOnly";
import { RequireAdmin } from "./routes/RequireAdmin";
import { RequireAuth } from "./routes/RequireAuth";

// Every page is its own file in the build and is fetched when first shown (AC6).
// NoAccessPage is loaded the same way by RequireAdmin.
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage/SignUpPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage/DashboardPage"));
const DirectoryPage = lazy(() => import("./pages/DirectoryPage/DirectoryPage"));
const AlumniProfilePage = lazy(() => import("./pages/AlumniProfilePage/AlumniProfilePage"));
const FeedPage = lazy(() => import("./pages/FeedPage/FeedPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage/MyProfilePage"));
const UsersPage = lazy(() => import("./pages/UsersPage/UsersPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));

// Development only. In a production build the condition is false at build
// time, so the import is dropped and the page file is not in the bundle (AC31).
const ComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/ComponentsPage/ComponentsPage"))
  : null;

// The route table. The three guards do all the sending-on (architecture.md,
// "Routes"): no page navigates after a log in or a log out.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path={PATHS.login} element={<LoginPage />} />
          <Route path={PATHS.signup} element={<SignUpPage />} />
        </Route>

        {/* Outside the guards and the shell: it needs no session. */}
        {ComponentsPage !== null ? (
          <Route
            path={PATHS.devComponents}
            element={
              <Suspense fallback={<p className="visuallyHidden">Loading</p>}>
                <ComponentsPage />
              </Suspense>
            }
          />
        ) : null}

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path={PATHS.home} element={<Navigate to={PATHS.dashboard} replace />} />
            <Route path={PATHS.dashboard} element={<DashboardPage />} />
            <Route path={PATHS.directory} element={<DirectoryPage />} />
            <Route path={PATHS.alumniProfile} element={<AlumniProfilePage />} />
            <Route path={PATHS.feed} element={<FeedPage />} />
            <Route path={PATHS.myProfile} element={<MyProfilePage />} />
            <Route element={<RequireAdmin />}>
              <Route path={PATHS.users} element={<UsersPage />} />
            </Route>
            <Route path={ANY_OTHER_PATH} element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>

      {/* After the pages in the document, so the skip link stays the first
          stop for the keyboard. It is fixed to the corner of the screen. */}
      <ToastViewport />
    </BrowserRouter>
  );
}
