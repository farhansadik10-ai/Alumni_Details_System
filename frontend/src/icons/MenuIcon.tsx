import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function MenuIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}
