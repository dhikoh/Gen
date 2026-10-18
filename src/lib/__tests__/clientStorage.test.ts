import { describe, it, expect, beforeEach } from "vitest";
import {
  userStorageKey,
  getUserItem,
  setUserItem,
  removeUserItem,
  clearAllUserScopedStorage,
  purgeForeignStorage,
} from "@/lib/clientStorage";

describe("clientStorage per-user namespace and isolation", () => {
  let mockMap: Map<string, string>;

  beforeEach(() => {
    mockMap = new Map<string, string>();

    const mockStorage = {
      getItem: (key: string) => mockMap.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mockMap.set(key, String(value));
      },
      removeItem: (key: string) => {
        mockMap.delete(key);
      },
      clear: () => {
        mockMap.clear();
      },
      key: (index: number) => {
        const keys = Array.from(mockMap.keys());
        return keys[index] ?? null;
      },
      get length() {
        return mockMap.size;
      },
    };

    // Stub window.localStorage for node vitest environment
    (globalThis as unknown as { window: { localStorage: typeof mockStorage } }).window = {
      localStorage: mockStorage,
    };
  });

  it("stores key with correct user prefix pg:<userId>:<name>", () => {
    setUserItem("user_123", "theme", "dark");
    expect(userStorageKey("user_123", "theme")).toBe("pg:user_123:theme");
    expect(mockMap.get("pg:user_123:theme")).toBe("dark");
    expect(getUserItem("user_123", "theme")).toBe("dark");
  });

  it("isolates data: user A cannot read data stored by user B", () => {
    setUserItem("user_A", "draftState", "stateA");
    setUserItem("user_B", "draftState", "stateB");

    expect(getUserItem("user_A", "draftState")).toBe("stateA");
    expect(getUserItem("user_B", "draftState")).toBe("stateB");
    expect(getUserItem("user_C", "draftState")).toBeNull();
  });

  it("removeUserItem only removes specific key for that user", () => {
    setUserItem("user_A", "key1", "val1");
    setUserItem("user_A", "key2", "val2");
    setUserItem("user_B", "key1", "val1_B");

    removeUserItem("user_A", "key1");
    expect(getUserItem("user_A", "key1")).toBeNull();
    expect(getUserItem("user_A", "key2")).toBe("val2");
    expect(getUserItem("user_B", "key1")).toBe("val1_B");
  });

  it("purgeForeignStorage retains current user data while removing foreign user data and legacy keys", () => {
    setUserItem("user_A", "state", "keepMe");
    setUserItem("user_B", "state", "deleteMeB");
    mockMap.set("generatorFormState", "legacy1");
    mockMap.set("generatorFormState_ch1", "legacy2");
    mockMap.set("scenePromptState", "legacy3");
    mockMap.set("unrelatedCustomKey", "unrelated");

    purgeForeignStorage("user_A");

    // user_A's data must remain intact
    expect(getUserItem("user_A", "state")).toBe("keepMe");

    // user_B's data must be deleted
    expect(getUserItem("user_B", "state")).toBeNull();

    // Legacy keys must be purged
    expect(mockMap.has("generatorFormState")).toBe(false);
    expect(mockMap.has("generatorFormState_ch1")).toBe(false);
    expect(mockMap.has("scenePromptState")).toBe(false);

    // Unrelated non-pg key should not be touched
    expect(mockMap.get("unrelatedCustomKey")).toBe("unrelated");
  });

  it("clearAllUserScopedStorage removes all pg: keys and legacy keys on logout", () => {
    setUserItem("user_A", "state", "dataA");
    setUserItem("user_B", "state", "dataB");
    mockMap.set("generatorFormState", "legacy");
    mockMap.set("promptgen_favorite_voices", "[\"voice1\"]");

    clearAllUserScopedStorage();

    expect(getUserItem("user_A", "state")).toBeNull();
    expect(getUserItem("user_B", "state")).toBeNull();
    expect(mockMap.has("generatorFormState")).toBe(false);
    expect(mockMap.has("promptgen_favorite_voices")).toBe(false);
    expect(mockMap.size).toBe(0);
  });
});
