import { describe, expect, it, vi } from "vitest"

import type { ChannelRule } from "../core/channel-rule"
import { ChromeStorageRulesRepository } from "./chrome-rules-repository"
import { FakeStorageArea } from "./fake-storage-area"

const ruleA: ChannelRule = {
  channelKey: "UCaaa",
  channelName: "Channel A",
  mode: "hide"
}
const ruleB: ChannelRule = {
  channelKey: "@channel-b",
  channelName: "Channel B",
  mode: "hide"
}

describe("ChromeStorageRulesRepository", () => {
  it("has no rules when storage is empty", async () => {
    const repository = new ChromeStorageRulesRepository(new FakeStorageArea())

    expect(await repository.getRules()).toEqual([])
  })

  it("stores rules by channel key", async () => {
    const area = new FakeStorageArea()
    const repository = new ChromeStorageRulesRepository(area)

    await repository.saveRule(ruleA)
    await repository.saveRule(ruleB)

    expect(area.peek("rules")).toEqual({ UCaaa: ruleA, "@channel-b": ruleB })
    expect(await repository.getRules()).toEqual([ruleA, ruleB])
  })

  it("replaces a rule with the same channel key", async () => {
    const repository = new ChromeStorageRulesRepository(
      new FakeStorageArea({ rules: { UCaaa: ruleA } })
    )

    await repository.saveRule({ ...ruleA, channelName: "Renamed" })

    expect(await repository.getRules()).toEqual([
      { ...ruleA, channelName: "Renamed" }
    ])
  })

  it("deletes a rule", async () => {
    const repository = new ChromeStorageRulesRepository(
      new FakeStorageArea({ rules: { UCaaa: ruleA, "@channel-b": ruleB } })
    )

    await repository.deleteRule(ruleA.channelKey)

    expect(await repository.getRules()).toEqual([ruleB])
  })

  it("does not write when deleting a rule that does not exist", async () => {
    const area = new FakeStorageArea({ rules: { UCaaa: ruleA } })
    const set = vi.spyOn(area, "set")
    const repository = new ChromeStorageRulesRepository(area)

    await repository.deleteRule("UCmissing")

    expect(set).not.toHaveBeenCalled()
  })

  it("keeps every rule when saves are not awaited one by one", async () => {
    const repository = new ChromeStorageRulesRepository(new FakeStorageArea())

    await Promise.all([repository.saveRule(ruleA), repository.saveRule(ruleB)])

    expect(await repository.getRules()).toEqual([ruleA, ruleB])
  })

  it("keeps working after a failed write", async () => {
    const area = new FakeStorageArea()
    vi.spyOn(area, "set").mockRejectedValueOnce(new Error("quota"))
    const repository = new ChromeStorageRulesRepository(area)

    await expect(repository.saveRule(ruleA)).rejects.toThrow("quota")
    await repository.saveRule(ruleB)

    expect(await repository.getRules()).toEqual([ruleB])
  })

  it("drops invalid stored entries", async () => {
    const repository = new ChromeStorageRulesRepository(
      new FakeStorageArea({
        rules: {
          UCaaa: ruleA,
          broken: { channelKey: "broken" },
          mismatched: { ...ruleB },
          unknownMode: { ...ruleB, channelKey: "unknownMode", mode: "mute" }
        }
      })
    )

    expect(await repository.getRules()).toEqual([ruleA])
  })

  it("treats a non-object stored value as no rules", async () => {
    const repository = new ChromeStorageRulesRepository(
      new FakeStorageArea({ rules: "corrupted" })
    )

    expect(await repository.getRules()).toEqual([])
  })

  it("notifies subscribers of changes made through another instance", async () => {
    const area = new FakeStorageArea()
    const contentScript = new ChromeStorageRulesRepository(area)
    const popup = new ChromeStorageRulesRepository(area)
    const listener = vi.fn()
    contentScript.subscribe(listener)

    await popup.saveRule(ruleA)
    await popup.deleteRule(ruleA.channelKey)

    expect(listener.mock.calls).toEqual([[[ruleA]], [[]]])
  })

  it("ignores changes of other keys", async () => {
    const area = new FakeStorageArea()
    const listener = vi.fn()
    new ChromeStorageRulesRepository(area).subscribe(listener)

    await area.set({ enabled: false })

    expect(listener).not.toHaveBeenCalled()
  })

  it("stops notifying after unsubscribe", async () => {
    const area = new FakeStorageArea()
    const repository = new ChromeStorageRulesRepository(area)
    const listener = vi.fn()

    repository.subscribe(listener)()
    await repository.saveRule(ruleA)

    expect(listener).not.toHaveBeenCalled()
  })
})
