import { useState } from "react";
import type { MouseEvent } from "react";
import { Flex, Typography } from "antd";
import { useAtomValue } from "jotai";
import { Navigate, useNavigate } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";
import type { SignUpFormValues } from "../../components/auth/SignUpForm";
import AuthLayout from "../../components/layout/AuthLayout";
import { PATHS } from "../../routes/paths";
import { getErrorMessage } from "../../services/apiClient";
import { createUser } from "../../services/usersApi";
import { currentUserAtom } from "../../store/authAtom";
import { isExpired } from "../../utils/jwt";
import type { LoginPageState } from "./LoginPage";

export default function SignUpPage() {
  const user = useAtomValue(currentUserAtom);
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  // Already logged in: nothing to sign up for.
  if (user && !isExpired(user)) {
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  const handleSubmit = async (values: SignUpFormValues) => {
    setError(undefined);
    try {
      // The response (which still carries the password hash, plan L.1) is not used.
      await createUser(values);
      const state: LoginPageState = { registeredEmail: values.email };
      navigate(PATHS.LOGIN, { state });
    } catch (err) {
      setError(getErrorMessage(err, "Sign-up failed. Please try again."));
      throw err;
    }
  };

  const goToLogin = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    navigate(PATHS.LOGIN);
  };

  return (
    <AuthLayout title="Create an account" subtitle="Join the Alumni Details System">
      <Flex vertical gap="middle">
        <SignUpForm onSubmit={handleSubmit} error={error} />
        <Flex justify="center">
          <Typography.Text type="secondary">
            Already have an account?{" "}
            <Typography.Link href={PATHS.LOGIN} onClick={goToLogin}>
              Log in
            </Typography.Link>
          </Typography.Text>
        </Flex>
      </Flex>
    </AuthLayout>
  );
}
