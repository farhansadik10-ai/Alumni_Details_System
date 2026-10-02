import { Grid } from "antd";

// True below antd's `md` breakpoint (768px): sidebar becomes a Drawer, tables drop columns, etc.
export default function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint();
  // Before the first measurement `md` is undefined; assume desktop until known.
  return screens.md === false;
}
