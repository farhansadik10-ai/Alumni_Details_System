import type { ChangeEvent, FormEvent, Ref } from "react";
import {
  ROLE_WORDS,
  USERS_ALL_ROLES,
  USERS_ROLE_LABEL,
  USERS_SEARCH_BUTTON,
  USERS_SEARCH_LABEL,
  USERS_SEARCH_PLACEHOLDER,
} from "../../../config/text";
import { ROLES, asRole } from "../../../lib/token";
import type { Role } from "../../../lib/token";
import type { UsersQuery } from "../../../lib/usersQuery";
import { Button } from "../../ui/Button/Button";
import { Card } from "../../ui/Card/Card";
import { Select } from "../../ui/Select/Select";
import type { SelectOption } from "../../ui/Select/Select";
import { TextInput } from "../../ui/TextInput/TextInput";
import styles from "./UsersFilters.module.css";

// The three roles, with the word shown for each (AC3).
const ROLE_OPTIONS: SelectOption[] = ROLES.map((role) => ({ value: role, label: ROLE_WORDS[role] }));

export type UsersFiltersProps = {
  /** The query read from the address: what is really filtering the list. */
  query: UsersQuery;
  /** The text in the search box, which can be ahead of the address. */
  searchText: string;
  onSearchTextChange: (text: string) => void;
  /** Enter or the Search button: write the search to the address at once (AC2). */
  onSearchNow: () => void;
  /** A role, or "" for all roles. Called only when the choice changed. */
  onRoleChange: (role: "" | Role) => void;
  /** The search box, so the page can move focus to it after Clear. */
  searchRef?: Ref<HTMLInputElement>;
};

/**
 * The search card of users.html: the search box, the role filter and the
 * Search button (AC2, AC3). Controlled: the page owns the address and the data.
 */
export function UsersFilters({
  query,
  searchText,
  onSearchTextChange,
  onSearchNow,
  onRoleChange,
  searchRef,
}: UsersFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchNow();
  }

  // Choosing the role that is already set does not write the address again.
  function handleRole(event: ChangeEvent<HTMLSelectElement>) {
    const role = asRole(event.target.value) ?? "";
    if (role !== query.role) {
      onRoleChange(role);
    }
  }

  return (
    <Card>
      <form role="search" className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.search}>
          <TextInput
            ref={searchRef}
            label={USERS_SEARCH_LABEL}
            type="search"
            placeholder={USERS_SEARCH_PLACEHOLDER}
            enterKeyHint="search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
          />
        </div>
        <div className={styles.role}>
          <Select
            label={USERS_ROLE_LABEL}
            placeholder={USERS_ALL_ROLES}
            options={ROLE_OPTIONS}
            value={query.role}
            onChange={handleRole}
          />
        </div>
        <Button type="submit" variant="primary">
          {USERS_SEARCH_BUTTON}
        </Button>
      </form>
    </Card>
  );
}
