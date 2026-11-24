export interface KeptRead<T> {
  get: () => T | undefined;
  load: () => Promise<T>;
  set: (value: T) => void;
  clear: () => void;
}

/** Keeps one answer and shares a read that is already running. A failed read is not kept, so the next call reads again. */
export function keepRead<T>(read: () => Promise<T>): KeptRead<T> {
  let kept: T | undefined;
  let running: Promise<T> | undefined;
  return {
    get: () => kept,
    load: () => {
      if (kept !== undefined) return Promise.resolve(kept);
      if (running) return running;
      const request: Promise<T> = read().then((value) => {
        // A value set or cleared while this read was running wins over its older answer.
        if (running === request) { kept = value; running = undefined; }
        return value;
      }, (error) => {
        if (running === request) running = undefined;
        throw error;
      });
      running = request;
      return request;
    },
    set: (value) => { kept = value; running = undefined; },
    clear: () => { kept = undefined; running = undefined; },
  };
}
