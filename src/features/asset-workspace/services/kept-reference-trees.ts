import { referenceTree, type ReferenceTree, type ReferenceTreeKind, type TreeNode } from "../domain/registration-reference-tree.ts";

export interface KeptReferenceTrees {
  get: (kind: ReferenceTreeKind) => ReferenceTree | undefined;
  /** `null`: the read failed. Nothing is kept then, so the next call reads again. */
  load: (kind: ReferenceTreeKind) => Promise<ReferenceTree | null>;
  clear: () => void;
}

/** Keeps the picker lists of one open form, and shares a read that is already running. */
export function keepReferenceTrees(read: (kind: ReferenceTreeKind) => Promise<TreeNode[] | null>): KeptReferenceTrees {
  const kept = new Map<ReferenceTreeKind, ReferenceTree>();
  const running = new Map<ReferenceTreeKind, Promise<ReferenceTree | null>>();

  return {
    get: (kind) => kept.get(kind),
    load: (kind) => {
      const tree = kept.get(kind);
      if (tree) return Promise.resolve(tree);
      const started = running.get(kind);
      if (started) return started;
      const request: Promise<ReferenceTree | null> = read(kind).catch(() => null).then((rows) => {
        const loaded = rows && referenceTree(rows);
        if (running.get(kind) === request) {
          running.delete(kind);
          // An empty list asks the user to add a row, so it is read again next time.
          if (loaded?.byId.size) kept.set(kind, loaded);
        }
        return loaded;
      });
      running.set(kind, request);
      return request;
    },
    clear: () => { kept.clear(); running.clear(); },
  };
}
