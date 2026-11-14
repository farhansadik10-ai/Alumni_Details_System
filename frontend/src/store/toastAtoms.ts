import { atom } from "jotai";

// The toast list. A toast is a short text in the bottom corner that says an
// action worked ("Post published"). ToastViewport shows the list; any code
// that can reach the store adds one with showToastAtom.

/** How long a toast stays before it leaves by itself. */
export const TOAST_DURATION_MS = 5000;

/** The most toasts shown at once. One more pushes the oldest out. */
export const MAX_TOASTS = 3;

export interface Toast {
  id: number;
  text: string;
}

const toastListAtom = atom<readonly Toast[]>([]);
const nextToastIdAtom = atom(1);

/** The toasts on screen, oldest first. Read only: change it with the two actions. */
export const toastsAtom = atom((get) => get(toastListAtom));

/** Adds a toast and returns its id. Keeps the newest MAX_TOASTS. */
export const showToastAtom = atom(null, (get, set, text: string): number => {
  const id = get(nextToastIdAtom);
  set(nextToastIdAtom, id + 1);
  set(toastListAtom, [...get(toastListAtom), { id, text }].slice(-MAX_TOASTS));
  return id;
});

/** Removes one toast. An id that is already gone changes nothing. */
export const dismissToastAtom = atom(null, (get, set, id: number) => {
  const toasts = get(toastListAtom);
  if (toasts.some((toast) => toast.id === id)) {
    set(
      toastListAtom,
      toasts.filter((toast) => toast.id !== id),
    );
  }
});
