import { forwardRef } from "react";
import type { ReactNode } from "react";
import { AlertIcon } from "../../../icons/AlertIcon";
import { CheckIcon } from "../../../icons/CheckIcon";
import styles from "./Message.module.css";

export type MessageTone = "error" | "success";

export type MessageProps = {
  tone: MessageTone;
  // The words. A message is never an icon or a color alone.
  children: ReactNode;
};

/**
 * An error or a success, shown where the action happened. An error is
 * role="alert", so a screen reader says it the moment it appears: render it
 * only when there is something to say. A success is role="status".
 * It takes a ref and can hold focus, so a form can move focus to it.
 */
export const Message = forwardRef<HTMLDivElement, MessageProps>(function Message(
  { tone, children },
  ref,
) {
  const isError = tone === "error";

  return (
    <div
      ref={ref}
      role={isError ? "alert" : "status"}
      tabIndex={-1}
      className={`${styles.message} ${styles[tone]}`}
    >
      <span className={styles.icon}>{isError ? <AlertIcon /> : <CheckIcon />}</span>
      <span className={styles.words}>{children}</span>
    </div>
  );
});
