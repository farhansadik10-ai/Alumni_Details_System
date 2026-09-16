import { atom } from "jotai";

export const tokenAtom = atom<string | null>(
  localStorage.getItem("token")
);

export const isLoggedInAtom = atom((get) => {
  return get(tokenAtom) !== null;
});