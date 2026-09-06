
import React from "react";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Typography,

} from "antd";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const menuItems: MenuProps["items"] = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "users",
    icon: <UserOutlined />,
    label: "Users",
  },
  {
    key: "alumni",
    icon: <TeamOutlined />,
    label: "Alumni",
  },
  {
    key: "posts",
    icon: <FileTextOutlined />,
    label: "Posts",
  },
  
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Logout",
  },
];

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "20px",
            fontWeight: "bold",
            marginRight: "40px",
          }}
        >
          Alumni Details System
        </div>

        <div style={{ color: "white", marginLeft: "auto" }}>
          
        </div>
      </Header>

      <Layout>
        {/* Sidebar */}
        <Sider
          width={220}
          style={{
            background: colorBgContainer,
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={["dashboard"]}
            style={{
              height: "100%",
              borderInlineEnd: 0,
            }}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>

        {/* Main Content */}
        <Layout style={{ padding: "0 24px 24px" }}>
          <Breadcrumb
            items={[
              { title: "Home" },
              { title: "Dashboard" },
            ]}
            style={{ margin: "16px 0" }}
          />

          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Title level={2}>Dashboard</Title>

            <Text type="secondary">
              Welcome to the Alumni Details System
            </Text>

            
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

