import { describe, expect, it, vi } from "vitest"

import { ChromeStorageSettingsRepository } from "./chrome-settings-repository"
import { FakeStorageArea } from "./fake-storage-area"

describe("ChromeStorageSettingsRepository", () => {
  it("is enabled when nothing is stored", async () => {
    const settings = new ChromeStorageSettingsRepository(new FakeStorageArea())

    expect(await settings.isEnabled()).toBe(true)
  })

  it("stores the switch", async () => {
    const area = new FakeStorageArea()
    const settings = new ChromeStorageSettingsRepository(area)

    await settings.setEnabled(false)
    expect(await settings.isEnabled()).toBe(false)
    expect(area.peek("enabled")).toBe(false)

    await settings.setEnabled(true)
    expect(await settings.isEnabled()).toBe(true)
  })

  it("treats an invalid stored value as enabled", async () => {
    const settings = new ChromeStorageSettingsRepository(
      new FakeStorageArea({ enabled: "no" })
    )

    expect(await settings.isEnabled()).toBe(true)
  })

  it("notifies subscribers of changes made through another instance", async () => {
    const area = new FakeStorageArea()
    const listener = vi.fn()
    new ChromeStorageSettingsRepository(area).subscribe(listener)

    const popup = new ChromeStorageSettingsRepository(area)
    await popup.setEnabled(false)
    await popup.setEnabled(true)

    expect(listener.mock.calls).toEqual([[false], [true]])
  })

  it("ignores changes of other keys", async () => {
    const area = new FakeStorageArea()
    const listener = vi.fn()
    new ChromeStorageSettingsRepository(area).subscribe(listener)

    await area.set({ rules: {} })

    expect(listener).not.toHaveBeenCalled()
  })
})
