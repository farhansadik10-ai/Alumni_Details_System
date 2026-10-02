import { Flex, Input, Table } from "antd";
import type { TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import EmptyState from "./EmptyState";

export interface DataTableProps<T> {
  columns: ColumnsType<T>;
  data: T[];
  rowKey: keyof T;
  loading?: boolean;
  // Extra controls next to the search box (filters, buttons).
  toolbar?: ReactNode;
  // When set, a search box is shown; called on Enter, the search button, and clear.
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
}

const PAGINATION: TableProps["pagination"] = {
  pageSize: 10,
  showSizeChanger: false,
  hideOnSinglePage: true,
};

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  toolbar,
  onSearch,
  searchPlaceholder = "Search",
}: DataTableProps<T>) {
  return (
    <Flex vertical gap="middle">
      {(onSearch || toolbar) && (
        <Flex wrap gap="small" align="center">
          {onSearch && (
            <Input.Search
              placeholder={searchPlaceholder}
              allowClear
              onSearch={(value) => onSearch(value.trim())}
              style={{ flex: "1 1 220px", maxWidth: 360 }}
            />
          )}
          {toolbar}
        </Flex>
      )}
      <Table<T>
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record[rowKey])}
        loading={loading}
        pagination={PAGINATION}
        // A wide table scrolls inside its own box, never the whole page.
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <EmptyState description="No records found" /> }}
      />
    </Flex>
  );
}
