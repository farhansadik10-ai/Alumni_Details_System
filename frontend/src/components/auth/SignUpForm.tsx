import { useState } from "react";
import { Alert, Button, Form, Input, Select } from "antd";
import type { FormRule } from "antd";
import { ROLE_LABELS, SIGNUP_ROLES } from "../../constants/roles";
import type { Role } from "../../constants/roles";
import { emailRules, nameRules, newPasswordRules, requiredRule, urlRule } from "../../constants/validation";

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  photo_url?: string;
}

export interface SignUpFormProps {
  // Resolves when the account is created; rejects on failure (the caller shows the reason through `error`).
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  error?: string;
}

interface FieldValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: Role;
  photo_url?: string;
}

const confirmPasswordRules: FormRule[] = [
  requiredRule("your password again"),
  ({ getFieldValue }) => ({
    validator: (_, value: string | undefined) =>
      !value || value === getFieldValue("password")
        ? Promise.resolve()
        : Promise.reject(new Error("The passwords do not match")),
  }),
];

// Q2 (a): student or alumni only; admin is never offered.
const roleOptions = SIGNUP_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export default function SignUpForm({ onSubmit, error }: SignUpFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async ({ name, email, password, role, photo_url }: FieldValues) => {
    setSubmitting(true);
    try {
      const photoUrl = photo_url?.trim();
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        // Required by the form rules, so always set here.
        role: role as Role,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });
    } catch {
      // The caller has already turned the failure into `error`.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<FieldValues>
      name="signup"
      layout="vertical"
      requiredMark="optional"
      onFinish={handleFinish}
      disabled={submitting}
    >
      {error && (
        <Form.Item>
          <Alert type="error" showIcon title={error} />
        </Form.Item>
      )}

      <Form.Item<FieldValues> label="Full name" name="name" rules={nameRules}>
        <Input placeholder="Your name" autoComplete="name" />
      </Form.Item>

      <Form.Item<FieldValues> label="Email" name="email" rules={emailRules}>
        <Input type="email" placeholder="you@example.com" autoComplete="email" />
      </Form.Item>

      <Form.Item<FieldValues> label="I am a" name="role" rules={[{ required: true, message: "Please choose student or alumni" }]}>
        <Select placeholder="Choose student or alumni" options={roleOptions} />
      </Form.Item>

      <Form.Item<FieldValues> label="Password" name="password" rules={newPasswordRules} hasFeedback>
        <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
      </Form.Item>

      <Form.Item<FieldValues>
        label="Confirm password"
        name="confirmPassword"
        dependencies={["password"]}
        rules={confirmPasswordRules}
        hasFeedback
      >
        <Input.Password placeholder="Repeat the password" autoComplete="new-password" />
      </Form.Item>

      {/* Q5: no upload endpoint, so a URL; without one the avatar shows the initials. */}
      <Form.Item<FieldValues> label="Photo URL" name="photo_url" rules={[urlRule]}>
        <Input type="url" placeholder="https://…" autoComplete="photo" />
      </Form.Item>

      <Form.Item noStyle>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Create account
        </Button>
      </Form.Item>
    </Form>
  );
}
