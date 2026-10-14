// index-inline-2 01 — navigator
// Lines 1-5 of readable/index-inline-2.pretty.js (statement-aligned).
if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  );
}
