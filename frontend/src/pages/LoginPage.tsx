import LoginForm from "../components/LoginFrom";
import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function LoginPage() {
  const handleSuccess = (token: string) => {
    localStorage.setItem("token", token);
    window.location.href = "/dashboard";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: 420,
          maxWidth: "100%",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
        styles={{
          body: {
            padding: "30px",
          },
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <Title level={2} style={{ marginBottom: 5 }}>
            Welcome Back
          </Title>

          <Text type="secondary">
            Login to your Alumni Details System
          </Text>
        </div>

        <LoginForm onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}

