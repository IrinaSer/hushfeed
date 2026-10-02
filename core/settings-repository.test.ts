import { describe, expect, it, vi } from "vitest"

import { InMemorySettingsRepository } from "./settings-repository"

describe("InMemorySettingsRepository", () => {
  it("is enabled by default", async () => {
    expect(await new InMemorySettingsRepository().isEnabled()).toBe(true)
  })

  it("notifies subscribers only when the value changes", async () => {
    const settings = new InMemorySettingsRepository()
    const listener = vi.fn()
    settings.subscribe(listener)

    await settings.setEnabled(true)
    await settings.setEnabled(false)
    await settings.setEnabled(false)

    expect(listener.mock.calls).toEqual([[false]])
    expect(await settings.isEnabled()).toBe(false)
  })
})
