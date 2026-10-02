import { useState } from "react";
import { Button, Drawer, Flex, Layout, Typography, theme } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { Outlet } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import HeaderUserMenu from "./HeaderUserMenu";
import SideMenu from "./SideMenu";

const SIDER_WIDTH = 220;
const DRAWER_WIDTH = 260;

// Shell for every logged-in screen: Sider on desktop (auto-collapses below lg),
// Drawer opened from the header on phones (below md); the screen renders in <Outlet />.
export default function AppLayout() {
  const { token } = theme.useToken();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Layout.Sider
          theme="light"
          width={SIDER_WIDTH}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "auto",
            borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
          }}
        >
          <SideMenu collapsed={collapsed} />
        </Layout.Sider>
      )}

      <Layout>
        <Layout.Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            paddingInline: isMobile ? token.padding : token.paddingLG,
            background: token.colorBgContainer,
            borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap="small" style={{ height: "100%", width: "100%" }}>
            {isMobile && (
              <Flex align="center" gap="small" style={{ minWidth: 0 }}>
                <Button type="text" icon={<MenuOutlined />} aria-label="Open menu" onClick={() => setDrawerOpen(true)} />
                <Typography.Text strong ellipsis>
                  Alumni Details System
                </Typography.Text>
              </Flex>
            )}
            {/* Auto margin pins the user menu to the right edge at every width. */}
            <Flex style={{ marginInlineStart: "auto", flexShrink: 0 }}>
              <HeaderUserMenu />
            </Flex>
          </Flex>
        </Layout.Header>

        <Layout.Content style={{ padding: isMobile ? token.padding : token.paddingLG, minWidth: 0 }}>
          <Outlet />
        </Layout.Content>
      </Layout>

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={DRAWER_WIDTH}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <SideMenu collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}
    </Layout>
  );
}
