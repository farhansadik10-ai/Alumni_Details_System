// Keys this app uses in the browser's localStorage (ADR-14).
// Plain constants only: vite.config.ts imports this file, so no DOM and no imports here.

// The login token.
export const TOKEN_STORAGE_KEY = "ua.token";

// The theme choice: light, dark or system.
export const THEME_STORAGE_KEY = "ua.theme";

// The email kept by "Remember my email" on the log-in page.
export const REMEMBERED_EMAIL_STORAGE_KEY = "ua.rememberedEmail";
