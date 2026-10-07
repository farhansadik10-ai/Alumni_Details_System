import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function AlertIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2v.3" />
    </IconBase>
  );
}
