import type { ReactNode } from "react";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

export interface AsyncContentProps {
  loading: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}

// Shows exactly one of: loading, error, empty, or the content.
export default function AsyncContent({
  loading,
  error,
  empty = false,
  emptyText = "Nothing here yet",
  onRetry,
  children,
}: AsyncContentProps) {
  if (loading) return <LoadingState />;
  if (error !== undefined && error !== null) return <ErrorState error={error} onRetry={onRetry} />;
  if (empty) return <EmptyState description={emptyText} />;
  return <>{children}</>;
}
