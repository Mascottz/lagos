import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthStorage } from '../src/authStorage.js';

const key = 'sb-project-auth-token';
function memoryStorage() {
  const entries = new Map();
  return {
    getItem: k => entries.get(k) ?? null,
    setItem: (k, v) => entries.set(k, String(v)),
    removeItem: k => entries.delete(k),
  };
}

test('unchecked sessions survive a reload in the same tab, not a new tab', () => {
  const local = memoryStorage(), tab = memoryStorage();
  const storage = createAuthStorage(key, local, tab);
  storage.setRememberMe(false);
  storage.setItem(key, 'session');
  assert.equal(createAuthStorage(key, local, tab).getItem(key), 'session');
  assert.equal(createAuthStorage(key, local, memoryStorage()).getItem(key), null);
  assert.equal(local.getItem(key), null);
});

test('remembered sessions survive a new tab and token refresh', () => {
  const local = memoryStorage(), tab = memoryStorage();
  const storage = createAuthStorage(key, local, tab);
  storage.setRememberMe(true);
  storage.setItem(key, 'session');
  const nextTab = createAuthStorage(key, local, memoryStorage());
  assert.equal(nextTab.getItem(key), 'session');
  nextTab.setItem(key, 'refreshed');
  assert.equal(local.getItem(key), 'refreshed');
});

test('switching persistence removes stale sessions and logout clears both stores', () => {
  const local = memoryStorage(), tab = memoryStorage();
  local.setItem(key, 'old');
  const storage = createAuthStorage(key, local, tab);
  storage.setRememberMe(false);
  storage.setItem(key, 'new');
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), 'new');
  local.setItem(key, 'stale');
  storage.removeItem(key);
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), null);
  assert.equal(createAuthStorage(key, local, tab).getItem(key), null);
});
