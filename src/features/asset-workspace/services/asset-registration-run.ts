// A SPA remount must not compete with an outgoing flow in the same tab.
const runs = new Map<string, AbortController>();

export function beginRegistrationRun(key: string) {
  if (runs.has(key)) throw new Error("The previous confirmation is finishing. Wait a moment, then try again.");
  const controller = new AbortController();
  runs.set(key, controller);
  return {
    controller,
    check: () => controller.signal.throwIfAborted(),
    finish: () => { if (runs.get(key) === controller) runs.delete(key); },
  };
}
