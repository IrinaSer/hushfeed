import { describe, expect, it, vi } from "vitest"

import type { ChannelRule } from "./channel-rule"
import { InMemoryRulesRepository } from "./rules-repository"

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

describe("InMemoryRulesRepository", () => {
  it("starts with the initial rules", async () => {
    const repository = new InMemoryRulesRepository([ruleA])

    expect(await repository.getRules()).toEqual([ruleA])
  })

  it("saves and deletes rules", async () => {
    const repository = new InMemoryRulesRepository()

    await repository.saveRule(ruleA)
    await repository.saveRule(ruleB)
    await repository.deleteRule(ruleA.channelKey)

    expect(await repository.getRules()).toEqual([ruleB])
  })

  it("replaces a rule with the same channel key", async () => {
    const repository = new InMemoryRulesRepository([ruleA])

    await repository.saveRule({ ...ruleA, channelName: "Renamed" })

    expect(await repository.getRules()).toEqual([
      { ...ruleA, channelName: "Renamed" }
    ])
  })

  it("does not expose its internal state", async () => {
    const repository = new InMemoryRulesRepository([ruleA])

    const rules = await repository.getRules()
    rules[0].channelName = "Mutated"
    rules.pop()

    expect(await repository.getRules()).toEqual([ruleA])
  })

  it("notifies subscribers with the full rule list after each change", async () => {
    const repository = new InMemoryRulesRepository()
    const listener = vi.fn()
    repository.subscribe(listener)

    await repository.saveRule(ruleA)
    await repository.deleteRule(ruleA.channelKey)

    expect(listener.mock.calls).toEqual([[[ruleA]], [[]]])
  })

  it("does not notify when deleting a rule that does not exist", async () => {
    const repository = new InMemoryRulesRepository()
    const listener = vi.fn()
    repository.subscribe(listener)

    await repository.deleteRule("UCmissing")

    expect(listener).not.toHaveBeenCalled()
  })

  it("stops notifying after unsubscribe", async () => {
    const repository = new InMemoryRulesRepository()
    const listener = vi.fn()
    const unsubscribe = repository.subscribe(listener)

    unsubscribe()
    await repository.saveRule(ruleA)

    expect(listener).not.toHaveBeenCalled()
  })
})
