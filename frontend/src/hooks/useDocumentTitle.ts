import { useEffect } from "react";
import { APP_NAME } from "../config/app";

/** Sets the browser tab title to "<title> · <app name>" (AC62). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
