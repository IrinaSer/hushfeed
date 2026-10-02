/**
 * The part of `chrome.storage.StorageArea` the repositories use. Taking it as
 * a parameter keeps them testable without a browser.
 */
export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  onChanged: {
    addListener(callback: StorageChangeListener): void
    removeListener(callback: StorageChangeListener): void
  }
}

export type StorageChangeListener = (
  changes: Record<string, { oldValue?: unknown; newValue?: unknown }>
) => void

/** Storage keys. Changing one loses the users' stored data. */
export const STORAGE_KEYS = {
  rules: "rules",
  enabled: "enabled"
} as const

/**
 * Subscribes to changes of one key. `listener` gets the new raw value, or
 * `undefined` when the key was removed.
 */
export function onKeyChanged(
  area: StorageArea,
  key: string,
  listener: (newValue: unknown) => void
): () => void {
  const callback: StorageChangeListener = (changes) => {
    if (key in changes) {
      listener(changes[key].newValue)
    }
  }
  area.onChanged.addListener(callback)
  return () => area.onChanged.removeListener(callback)
}
