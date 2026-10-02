import { App, Popconfirm } from "antd";
import type { ReactElement } from "react";
import type { ApiErrorBody } from "../../types/api";

export interface ConfirmDeleteProps {
  title: string;
  description?: string;
  onConfirm: () => Promise<void>;
  // The trigger, e.g. a Delete button.
  children: ReactElement;
}

// Same order as getErrorMessage in services/apiClient (components may not import services).
function errorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: ApiErrorBody } }).response?.data;
    const text = data?.message || data?.error;
    if (text) return text;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not delete. Please try again.";
}

export default function ConfirmDelete({ title, description, onConfirm, children }: ConfirmDeleteProps) {
  const { message } = App.useApp();

  // Returning the promise keeps the Delete button loading until the request finishes.
  const handleConfirm = async () => {
    try {
      await onConfirm();
      message.success("Deleted");
    } catch (error) {
      message.error(errorText(error));
    }
  };

  return (
    <Popconfirm
      title={title}
      description={description}
      okText="Delete"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      onConfirm={handleConfirm}
    >
      {children}
    </Popconfirm>
  );
}
