import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function MoonIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </IconBase>
  );
}
