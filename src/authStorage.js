// Keep non-remembered sessions in this tab only. Never store the password.
export function createAuthStorage(storageKey, local, session) {
  let persistent = !session.getItem(storageKey) && !!local.getItem(storageKey);

  return {
    setRememberMe(remember) {
      persistent = remember;
    },
    getItem(key) {
      return (persistent ? local : session).getItem(key);
    },
    setItem(key, value) {
      (persistent ? local : session).setItem(key, value);
      // Avoid restoring an older session from the other store on a later visit.
      if (key === storageKey) (persistent ? session : local).removeItem(key);
    },
    removeItem(key) {
      session.removeItem(key);
      local.removeItem(key);
    },
  };
}
