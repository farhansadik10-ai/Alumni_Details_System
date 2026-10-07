import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function CloseIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}
