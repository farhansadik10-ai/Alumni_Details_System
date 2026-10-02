import { useState } from "react";
import { Alert, Flex } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import { Navigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import type { LoginFormValues } from "../../components/auth/LoginForm";
import AuthLayout from "../../components/layout/AuthLayout";
import { PATHS } from "../../routes/paths";
import type { LoginLocationState } from "../../routes/RequireAuth";
import { getErrorMessage } from "../../services/apiClient";
import { login } from "../../services/authApi";
import { TOKEN_STORAGE_KEY, currentUserAtom, tokenAtom } from "../../store/authAtom";
import { isExpired } from "../../utils/jwt";

export default function LoginPage() {
  const user = useAtomValue(currentUserAtom);
  const setToken = useSetAtom(tokenAtom);
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const [error, setError] = useState<string>();

  // Already logged in (or just logged in): go back to where RequireAuth sent us from, or the dashboard.
  if (user && !isExpired(user)) {
    return <Navigate to={state?.from || PATHS.DASHBOARD} replace />;
  }

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    setError(undefined);
    try {
      const { token } = await login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      // The new token re-renders this page, which then redirects (above).
      setToken(token);
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
      throw err;
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to the Alumni Details System">
      <Flex vertical gap="middle">
        {state?.expired && !error && (
          <Alert type="warning" showIcon title="Your session has expired. Please log in again." />
        )}
        <LoginForm onSubmit={handleSubmit} error={error} />
      </Flex>
    </AuthLayout>
  );
}
