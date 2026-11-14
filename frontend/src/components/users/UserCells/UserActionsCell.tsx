import { USERS_DELETE_BUTTON, usersDeleteButtonName } from "../../../config/text";
import { displayName } from "../../../lib/alumniDisplay";
import { Button } from "../../ui/Button/Button";

export type UserActionsCellProps = {
  name: string | null;
  // The logged-in admin's own row: no Delete (AC5, spec A12).
  isSelf: boolean;
  onDelete: () => void;
};

/**
 * The Actions cell of the Users table: Delete, read out with the person's
 * name. The md size keeps it at the touch control height on a phone (AC11).
 */
export function UserActionsCell({ name, isSelf, onDelete }: UserActionsCellProps) {
  if (isSelf) {
    return null;
  }
  return (
    <Button
      variant="quiet"
      tone="danger"
      aria-label={usersDeleteButtonName(displayName(name))}
      onClick={onDelete}
    >
      {USERS_DELETE_BUTTON}
    </Button>
  );
}
