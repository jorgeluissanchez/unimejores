export async function initMocks() {
  if (typeof window === "undefined") {
    const { initMocks } = await import("./index.native");
    return initMocks();
  }

  const { initMocks } = await import("./index.web");
  return initMocks();
}
