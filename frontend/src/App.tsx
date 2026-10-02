import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard";
import { PATHS } from "./routes/paths";

// Development only: import.meta.env.DEV is false in production builds, so this page is left out of the bundle.
const ComponentPreviewPage = import.meta.env.DEV
  ? lazy(() => import("./pages/dev/ComponentPreviewPage"))
  : null;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
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