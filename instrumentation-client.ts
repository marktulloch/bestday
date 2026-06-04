/**
 * Wallet extensions (e.g. MetaMask) inject in-page scripts that may reject
 * promises without handling them. The Next.js dev overlay listens for
 * `unhandledrejection` and surfaces those as app errors even though this
 * project does not use Web3. Swallow extension-originated rejections in dev.
 */
function isBrowserExtensionPromiseRejection(event: PromiseRejectionEvent): boolean {
  const { reason } = event;
  const stack = reason instanceof Error ? (reason.stack ?? "") : "";
  if (stack.includes("chrome-extension://") || stack.includes("moz-extension://")) {
    return true;
  }
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";
  return message.includes("MetaMask");
}

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (!isBrowserExtensionPromiseRejection(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
}
