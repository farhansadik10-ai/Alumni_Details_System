import type { ReactNode } from "react";
import styles from "./Table.module.css";

export type TableColumn<T> = {
  key: string;
  // The column name: the head cell, and the label beside each value on a phone.
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  // Says what the table lists. Read by screen readers, not shown.
  caption: string;
};

/**
 * On a phone the stylesheet turns each row into a card, which makes some
 * browsers stop treating the elements as a table. The roles keep it a table
 * for a screen reader in both layouts.
 */
export function Table<T>({ columns, rows, rowKey, caption }: TableProps<T>) {
  return (
    <table className={styles.table} role="table">
      <caption className="visuallyHidden">{caption}</caption>
      <thead className={styles.head} role="rowgroup">
        <tr className={styles.headRow} role="row">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              role="columnheader"
              className={
                column.align === "right" ? `${styles.headCell} ${styles.right}` : styles.headCell
              }
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.body} role="rowgroup">
        {rows.map((row) => (
          <tr key={rowKey(row)} className={styles.row} role="row">
            {columns.map((column) => (
              <td
                key={column.key}
                role="cell"
                data-label={column.header}
                className={column.align === "right" ? `${styles.cell} ${styles.right}` : styles.cell}
              >
                {/* One box around the value: on a phone the cell is a two-column grid. */}
                <div className={styles.value}>{column.render(row)}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
