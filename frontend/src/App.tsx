import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { ROLES } from "./constants/roles";
import UserManagementPage from "./pages/admin/UserManagementPage";
import AlumniDetailPage from "./pages/alumni/AlumniDetailPage";
import AlumniListPage from "./pages/alumni/AlumniListPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import PostsFeedPage from "./pages/posts/PostsFeedPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { PATHS } from "./routes/paths";
import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";

// Development only: import.meta.env.DEV is false in production builds, so this page is left out of the bundle.
const ComponentPreviewPage = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/ComponentPreviewPage"))
  : null;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.SIGNUP} element={<SignUpPage />} />

        {/* Logged-in screens: RequireAuth sends everyone else to the login page. */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={PATHS.POSTS} element={<PostsFeedPage />} />
          <Route path={PATHS.ALUMNI} element={<AlumniListPage />} />
          <Route path={PATHS.ALUMNI_DETAIL} element={<AlumniDetailPage />} />
          <Route path={PATHS.PROFILE} element={<ProfilePage />} />
          <Route
            path={PATHS.ADMIN_USERS}
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <UserManagementPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {ComponentPreviewPage && (
          <Route
            path={PATHS.DEV_COMPONENTS}
            element={
              <Suspense fallback={null}>
                <ComponentPreviewPage />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
