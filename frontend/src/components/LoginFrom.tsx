import { useState } from "react";
import { useSetAtom } from "jotai";
import type { FormProps } from "antd";
import { Button, Checkbox, Form, Input } from "antd";
import { login } from "../services/authApi";
import { tokenAtom } from "../store/authAtom";

interface Props {
  onSuccess: (token: string) => void;
}

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export default function LoginForm({ onSuccess }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Jotai Atom
  const setToken = useSetAtom(tokenAtom);


  const savedEmail = localStorage.getItem("savedEmail") || "";
  const savedPassword = localStorage.getItem("savedPassword") || "";

  const handleSubmit: FormProps<FieldType>["onFinish"] = async (values) => {
    setError("");
    setLoading(true);

    try {
      
      const data = await login(
        values.email!,
        values.password!
      );

      
      setToken(data.token);

      
      localStorage.setItem("token", data.token);

      
      if (values.remember) {
        localStorage.setItem("savedEmail", values.email!);
        localStorage.setItem("savedPassword", values.password!);
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
      }

      
      onSuccess(data.token);

    } catch (err: any) {
      console.log(err);

      setError(
        err.response?.data?.message || "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<FieldType>
      name="login"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{
        email: savedEmail,
        password: savedPassword,
        remember: !!savedEmail,
      }}
      onFinish={handleSubmit}
      autoComplete="off"
    >

      {/* Email */}
      <Form.Item<FieldType>
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: "Please input your email!",
          },
          {
            type: "email",
            message: "Please enter a valid email!",
          },
        ]}
      >
        <Input placeholder="Enter your email" />
      </Form.Item>

      {/* Password */}
      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password placeholder="Enter your password" />
      </Form.Item>

      {/* Remember Me */}
      <Form.Item<FieldType>
        name="remember"
        valuePropName="checked"
        label={null}
      >
        <Checkbox>
          Remember me
        </Checkbox>
      </Form.Item>

      {/* Login Button */}
      <Form.Item label={null}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          Log In
        </Button>
      </Form.Item>

      {/* Error Message */}
      {error && (
        <p
          style={{
            color: "red",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

    </Form>
  );
}