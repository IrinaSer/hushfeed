import type { Unsubscribe } from "../core/rules-repository"
import type { SettingsRepository } from "../core/settings-repository"
import { onKeyChanged, STORAGE_KEYS, type StorageArea } from "./storage-area"

/**
 * Keeps the on/off switch in an extension storage area. Filtering is on
 * when nothing is stored.
 */
export class ChromeStorageSettingsRepository implements SettingsRepository {
  constructor(private readonly area: StorageArea) {}

  async isEnabled(): Promise<boolean> {
    const items = await this.area.get(STORAGE_KEYS.enabled)
    return parseEnabled(items[STORAGE_KEYS.enabled])
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await this.area.set({ [STORAGE_KEYS.enabled]: enabled })
  }

  subscribe(listener: (enabled: boolean) => void): Unsubscribe {
    return onKeyChanged(this.area, STORAGE_KEYS.enabled, (value) =>
      listener(parseEnabled(value))
    )
  }
}

function parseEnabled(value: unknown): boolean {
  return value !== false
}
