import type { StorageArea, StorageChangeListener } from "./storage-area"

/**
 * In-memory stand-in for `chrome.storage.local` in tests. Like the real one,
 * it stores copies, not references, and reports changes to every listener —
 * including the writer's own.
 */
export class FakeStorageArea implements StorageArea {
  private readonly items = new Map<string, unknown>()
  private readonly listeners = new Set<StorageChangeListener>()

  readonly onChanged = {
    addListener: (callback: StorageChangeListener) => {
      this.listeners.add(callback)
    },
    removeListener: (callback: StorageChangeListener) => {
      this.listeners.delete(callback)
    }
  }

  constructor(initial: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.items.set(key, structuredClone(value))
    }
  }

  async get(key: string): Promise<Record<string, unknown>> {
    return this.items.has(key)
      ? { [key]: structuredClone(this.items.get(key)) }
      : {}
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: Parameters<StorageChangeListener>[0] = {}
    for (const [key, value] of Object.entries(items)) {
      changes[key] = {
        oldValue: structuredClone(this.items.get(key)),
        newValue: structuredClone(value)
      }
      this.items.set(key, structuredClone(value))
    }
    for (const listener of this.listeners) {
      listener(changes)
    }
  }

  /** Raw stored value, for assertions. */
  peek(key: string): unknown {
    return structuredClone(this.items.get(key))
  }
}
