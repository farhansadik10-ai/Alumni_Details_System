import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function MonitorIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </IconBase>
  );
}
