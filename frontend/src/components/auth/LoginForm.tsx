import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input } from "antd";
import { emailRules, requiredRule } from "../../constants/validation";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  // Resolves when logged in; rejects on failure (the caller shows the reason through `error`).
  onSubmit: (values: LoginFormValues) => Promise<void>;
  error?: string;
}

interface FieldValues extends LoginFormValues {
  remember: boolean;
}

// "Remember me" keeps the email only. The password is never stored.
const SAVED_EMAIL_KEY = "savedEmail";
// Older versions of this form stored the password in plain text under this key.
const LEGACY_SAVED_PASSWORD_KEY = "savedPassword";

export default function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [savedEmail] = useState(() => localStorage.getItem(SAVED_EMAIL_KEY) ?? "");

  useEffect(() => {
    localStorage.removeItem(LEGACY_SAVED_PASSWORD_KEY);
  }, []);

  const handleFinish = async ({ email, password, remember }: FieldValues) => {
    setSubmitting(true);
    try {
      await onSubmit({ email: email.trim(), password });
      if (remember) {
        localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch {
      // The caller has already turned the failure into `error`.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<FieldValues>
      name="login"
      layout="vertical"
      requiredMark={false}
      initialValues={{ email: savedEmail, password: "", remember: savedEmail !== "" }}
      onFinish={handleFinish}
      disabled={submitting}
    >
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

      <Form.Item<FieldValues> label="Email" name="email" rules={emailRules}>
        <Input type="email" placeholder="you@example.com" autoComplete="username" />
      </Form.Item>

      {/* No minimum length here: the minimum applies to new passwords only. */}
      <Form.Item<FieldValues> label="Password" name="password" rules={[requiredRule("your password")]}>
        <Input.Password placeholder="Your password" autoComplete="current-password" />
      </Form.Item>

      <Form.Item<FieldValues> name="remember" valuePropName="checked">
        <Checkbox>Remember my email</Checkbox>
      </Form.Item>

      <Form.Item noStyle>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
}
