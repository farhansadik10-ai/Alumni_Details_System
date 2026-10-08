import type { PublicUser } from "@alumni/shared";
import {
  NOT_GIVEN,
  NO_ROLE,
  USERS_COLUMN_ACTIONS,
  USERS_COLUMN_EMAIL,
  USERS_COLUMN_JOINED,
  USERS_COLUMN_NAME,
  USERS_COLUMN_ROLE,
} from "../../../config/text";
import { dateText } from "../../../lib/postDisplay";
import { ROLES } from "../../../lib/token";
import type { TableColumn } from "../../ui/Table/Table";
import { RoleTag } from "../../ui/Tag/RoleTag";
import { UserActionsCell } from "./UserActionsCell";
import { UserNameCell } from "./UserNameCell";
import styles from "./usersColumns.module.css";

function isKnownRole(role: string | null): boolean {
  return ROLES.some((known) => known === role);
}

export type UsersColumnsOptions = {
  // The logged-in admin's id: their own row shows "You" and no Delete (AC5).
  selfId: number | null;
  // Delete on a row was pressed.
  onDelete: (user: PublicUser) => void;
};

/**
 * The five columns of the Users table (users.html): name, email, role,
 * joined and actions. One set, used by the Users page and the dev page, so
 * the dev page shows the real table.
 */
export function usersColumns({ selfId, onDelete }: UsersColumnsOptions): TableColumn<PublicUser>[] {
  return [
    {
      key: "name",
      header: USERS_COLUMN_NAME,
      render: (user) => (
        <UserNameCell name={user.name} photoUrl={user.photo_url} isSelf={user.id === selfId} />
      ),
    },
    {
      key: "email",
      header: USERS_COLUMN_EMAIL,
      render: (user) => <span className={styles.muted}>{user.email}</span>,
    },
    {
      key: "role",
      header: USERS_COLUMN_ROLE,
      render: (user) =>
        isKnownRole(user.role) ? (
          <RoleTag role={user.role} />
        ) : (
          <span className={styles.muted}>{NO_ROLE}</span>
        ),
    },
    {
      key: "joined",
      header: USERS_COLUMN_JOINED,
      render: (user) => <span className={styles.muted}>{dateText(user.created_at) ?? NOT_GIVEN}</span>,
    },
    {
      key: "actions",
      header: USERS_COLUMN_ACTIONS,
      align: "right",
      render: (user) => (
        <UserActionsCell name={user.name} isSelf={user.id === selfId} onDelete={() => onDelete(user)} />
      ),
    },
  ];
}
