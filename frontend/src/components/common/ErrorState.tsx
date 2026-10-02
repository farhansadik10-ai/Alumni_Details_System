import { Button, Result } from "antd";
import type { ApiErrorBody } from "../../types/api";

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

// Same order as getErrorMessage in services/apiClient (components may not import services):
// the backend's `message` / `error`, then the Error's own message.
function errorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: ApiErrorBody } }).response?.data;
    const text = data?.message || data?.error;
    if (text) return text;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Please try again later.";
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle={errorText(error)}
      extra={
        onRetry && (
          <Button type="primary" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
