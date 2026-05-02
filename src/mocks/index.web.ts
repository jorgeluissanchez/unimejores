import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

declare global {
  // eslint-disable-next-line no-var
  var __MSW_WEB_STARTED__: boolean | undefined;
}

const useMock = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export async function initMocks() {
  if (!useMock || globalThis.__MSW_WEB_STARTED__) {
    return;
  }

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return;
  }

  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
  globalThis.__MSW_WEB_STARTED__ = true;
}
