import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Form, Modal } from "antd";
import type { ApiErrorBody } from "../../types/api";

export interface FormModalProps<T> {
  open: boolean;
  title: string;
  // Empty for "create", filled for "edit".
  initialValues?: Partial<T>;
  // Resolve when saved (the caller then closes the modal); reject to show the error and keep the form open.
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
  submitText?: string;
  // The Form.Item fields.
  children: ReactNode;
}

// Same order as getErrorMessage in services/apiClient (components may not import services).
function errorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: ApiErrorBody } }).response?.data;
    const text = data?.message || data?.error;
    if (text) return text;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not save. Please try again.";
}

export default function FormModal<T extends object>({
  open,
  title,
  initialValues,
  onSubmit,
  onCancel,
  submitText = "Save",
  children,
}: FormModalProps<T>) {
  const [form] = Form.useForm<T>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Every time the modal opens, start again from `initialValues` with no leftover error.
  useEffect(() => {
    if (open) {
      form.resetFields();
      setError(undefined);
    }
  }, [open, form]);

  const handleFinish = async (values: T) => {
    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={submitText}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      onCancel={onCancel}
      cancelButtonProps={{ disabled: submitting }}
      closable={!submitting}
      mask={{ closable: false }}
      // Full width (minus the modal's own margin) on phones.
      width={{ xs: "100%", sm: 520 }}
      // Keeps the form mounted so `form` is connected before the first open.
      forceRender
    >
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Form<T>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        disabled={submitting}
      >
        {children}
      </Form>
    </Modal>
  );
}
