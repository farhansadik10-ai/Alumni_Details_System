import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function CheckIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </IconBase>
  );
}
