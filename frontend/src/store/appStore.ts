import { createStore } from "jotai";

// The one Jotai store. main.tsx gives it to the Provider; store/wireApi.ts
// reads and writes it from outside React.
export const appStore = createStore();
