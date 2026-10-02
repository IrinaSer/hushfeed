import { ChromeStorageRulesRepository } from "./chrome-rules-repository"
import { ChromeStorageSettingsRepository } from "./chrome-settings-repository"

/** Repositories backed by `chrome.storage.local`, for extension contexts. */
export function createChromeStorage() {
  return {
    rules: new ChromeStorageRulesRepository(chrome.storage.local),
    settings: new ChromeStorageSettingsRepository(chrome.storage.local)
  }
}
