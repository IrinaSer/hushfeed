import type { Unsubscribe } from "./rules-repository"

/**
 * Where the global on/off switch is kept. Filtering is on unless the user
 * turned it off.
 */
export interface SettingsRepository {
  isEnabled(): Promise<boolean>
  setEnabled(enabled: boolean): Promise<void>
  /** Calls `listener` with the new value after every change. */
  subscribe(listener: (enabled: boolean) => void): Unsubscribe
}

/** Keeps settings in memory. For tests and as a reference implementation. */
export class InMemorySettingsRepository implements SettingsRepository {
  private readonly listeners = new Set<(enabled: boolean) => void>()

  constructor(private enabled = true) {}

  async isEnabled(): Promise<boolean> {
    return this.enabled
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (this.enabled === enabled) {
      return
    }
    this.enabled = enabled
    for (const listener of this.listeners) {
      listener(enabled)
    }
  }

  subscribe(listener: (enabled: boolean) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}
