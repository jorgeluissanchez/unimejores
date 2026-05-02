import { server } from "./server";

declare global {
  // eslint-disable-next-line no-var
  var __MSW_NATIVE_STARTED__: boolean | undefined;
}

const useMock = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export async function initMocks() {
  if (!useMock || globalThis.__MSW_NATIVE_STARTED__) {
    return;
  }

  server.listen({ onUnhandledRequest: "bypass" });
  globalThis.__MSW_NATIVE_STARTED__ = true;
}
