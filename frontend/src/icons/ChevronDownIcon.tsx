import { IconBase } from "./IconBase";
import type { IconProps } from "./IconBase";

export function ChevronDownIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  );
}
