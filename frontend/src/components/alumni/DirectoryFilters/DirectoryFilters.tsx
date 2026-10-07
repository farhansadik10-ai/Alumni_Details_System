import { useId, useState } from "react";
import type { ChangeEvent, FormEvent, Ref } from "react";
import type { AlumniFilters } from "@alumni/shared";
import {
  DIRECTORY_ALL_DEPARTMENTS,
  DIRECTORY_ANY_FIELD,
  DIRECTORY_ANY_YEAR,
  DIRECTORY_CLEAR_BUTTON,
  DIRECTORY_DEPARTMENT_LABEL,
  DIRECTORY_FIELD_LABEL,
  DIRECTORY_FILTERS_ERROR_TEXT,
  DIRECTORY_MENTORING_LABEL,
  DIRECTORY_SEARCH_BUTTON,
  DIRECTORY_SEARCH_LABEL,
  DIRECTORY_SEARCH_PLACEHOLDER,
  DIRECTORY_YEAR_LABEL,
  RETRY_LABEL,
  directoryFiltersButton,
} from "../../../config/text";
import { activeFilterCount, hasCriteria } from "../../../lib/directoryQuery";
import type { DirectoryQuery } from "../../../lib/directoryQuery";
import type { FiltersState } from "../../../store/alumniAtoms";
import { Button } from "../../ui/Button/Button";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { Message } from "../../ui/Message/Message";
import { Select } from "../../ui/Select/Select";
import type { SelectOption } from "../../ui/Select/Select";
import { TextInput } from "../../ui/TextInput/TextInput";
import styles from "./DirectoryFilters.module.css";

/** The filters a control can change. The page resets the page number. */
export type DirectoryFilterPatch = Partial<
  Pick<DirectoryQuery, "department" | "graduationYear" | "field" | "mentoring">
>;

export type DirectoryFiltersProps = {
  /** The query read from the address: what is really filtering the list. */
  query: DirectoryQuery;
  /** The text in the search box, which can be ahead of the address. */
  searchText: string;
  onSearchTextChange: (text: string) => void;
  /** Enter or the Search button: write the search to the address at once (AC3). */
  onSearchNow: () => void;
  onFilterChange: (patch: DirectoryFilterPatch) => void;
  /** The options of GET /api/alumni/filters, or null while none have arrived. */
  options: AlumniFilters | null;
  optionsStatus: FiltersState["status"];
  onRetryOptions: () => void;
  onClear: () => void;
  /**
   * Show "Clear search and filters" here when criteria are set. The page
   * passes false while its empty state shows its own Clear button, so the
   * page never has two (AC11).
   */
  showClear?: boolean;
  /** The search box, so the page can move focus to it after Clear. */
  searchRef?: Ref<HTMLInputElement>;
};

function toOptions(values: readonly (string | number)[]): SelectOption[] {
  return values.map((value) => ({ value: String(value), label: String(value) }));
}

/**
 * The options, plus the current value when it is not among them (the options
 * are loading or failed, or an old link): the select shows what is really
 * filtering the list, never "All" in its place (ADV-005, AC7).
 */
function withCurrent(options: SelectOption[], current: string): SelectOption[] {
  if (current === "" || options.some((option) => option.value === current)) {
    return options;
  }
  return [...options, { value: current, label: current }];
}

/**
 * The search box, the three filters and the mentoring checkbox (AC1 to AC4,
 * AC13). Controlled: the page owns the address and the data.
 *
 * On a phone the filters sit in a panel behind a "Filters" button. The panel
 * is display: none while closed, so Tab skips it; it comes after the buttons
 * in the page, so Tab reaches it in screen order when open. On a wide screen
 * the button is hidden and the panel is always shown. No JavaScript media query.
 */
export function DirectoryFilters({
  query,
  searchText,
  onSearchTextChange,
  onSearchNow,
  onFilterChange,
  options,
  optionsStatus,
  onRetryOptions,
  onClear,
  showClear = true,
  searchRef,
}: DirectoryFiltersProps) {
  const panelId = useId();
  const [panelOpen, setPanelOpen] = useState(false);

  const yearValue = query.graduationYear === null ? "" : String(query.graduationYear);
  const departmentOptions = withCurrent(toOptions(options?.departments ?? []), query.department);
  const yearOptions = withCurrent(toOptions(options?.graduation_years ?? []), yearValue);
  const fieldOptions = withCurrent(toOptions(options?.fields ?? []), query.field);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchNow();
  }

  // Choosing the value that is already set does not write the address again.
  function handleDepartment(event: ChangeEvent<HTMLSelectElement>) {
    const department = event.target.value;
    if (department !== query.department) {
      onFilterChange({ department });
    }
  }

  function handleYear(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value !== yearValue) {
      onFilterChange({ graduationYear: value === "" ? null : Number(value) });
    }
  }

  function handleField(event: ChangeEvent<HTMLSelectElement>) {
    const field = event.target.value;
    if (field !== query.field) {
      onFilterChange({ field });
    }
  }

  function handleMentoring(event: ChangeEvent<HTMLInputElement>) {
    const mentoring = event.target.checked;
    if (mentoring !== query.mentoring) {
      onFilterChange({ mentoring });
    }
  }

  const panelClass = panelOpen ? styles.panel : `${styles.panel} ${styles.closed}`;

  return (
    <form role="search" className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <TextInput
            ref={searchRef}
            label={DIRECTORY_SEARCH_LABEL}
            type="search"
            placeholder={DIRECTORY_SEARCH_PLACEHOLDER}
            enterKeyHint="search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
          />
        </div>
        <div className={styles.actions}>
          <div className={styles.toggle}>
            <Button
              fullWidth
              aria-expanded={panelOpen}
              aria-controls={panelId}
              onClick={() => setPanelOpen((open) => !open)}
            >
              {directoryFiltersButton(activeFilterCount(query))}
            </Button>
          </div>
          <Button type="submit" variant="primary">
            {DIRECTORY_SEARCH_BUTTON}
          </Button>
        </div>
      </div>

      <div id={panelId} className={panelClass}>
        <div className={styles.selects}>
          <Select
            label={DIRECTORY_DEPARTMENT_LABEL}
            placeholder={DIRECTORY_ALL_DEPARTMENTS}
            options={departmentOptions}
            value={query.department}
            onChange={handleDepartment}
          />
          <Select
            label={DIRECTORY_YEAR_LABEL}
            placeholder={DIRECTORY_ANY_YEAR}
            options={yearOptions}
            value={yearValue}
            onChange={handleYear}
          />
          <Select
            label={DIRECTORY_FIELD_LABEL}
            placeholder={DIRECTORY_ANY_FIELD}
            options={fieldOptions}
            value={query.field}
            onChange={handleField}
          />
        </div>
        <Checkbox
          boxed
          label={DIRECTORY_MENTORING_LABEL}
          checked={query.mentoring}
          onChange={handleMentoring}
        />
      </div>

      {optionsStatus === "error" ? (
        <div className={styles.optionsError}>
          <Message tone="error">{DIRECTORY_FILTERS_ERROR_TEXT}</Message>
          <Button size="sm" onClick={onRetryOptions}>
            {RETRY_LABEL}
          </Button>
        </div>
      ) : null}

      {showClear && hasCriteria(query) ? (
        <div className={styles.clear}>
          <Button variant="quiet" onClick={onClear}>
            {DIRECTORY_CLEAR_BUTTON}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
