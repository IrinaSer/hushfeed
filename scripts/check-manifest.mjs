// Fails when the built manifest asks for more than spec 001 allows:
// the `storage` permission and access to YouTube only.
import { readFileSync } from "node:fs"

const MANIFEST = "build/chrome-mv3-prod/manifest.json"
const ALLOWED_PERMISSIONS = new Set(["storage"])
const ALLOWED_ORIGIN = /^https:\/\/www\.youtube\.com\//

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"))
const problems = []

for (const permission of manifest.permissions ?? []) {
  if (!ALLOWED_PERMISSIONS.has(permission)) {
    problems.push(`permission not allowed: ${permission}`)
  }
}
for (const permission of manifest.optional_permissions ?? []) {
  problems.push(`optional permission not allowed: ${permission}`)
}

const origins = [
  ...(manifest.host_permissions ?? []),
  ...(manifest.optional_host_permissions ?? []),
  ...(manifest.content_scripts ?? []).flatMap((script) => script.matches ?? []),
  ...(manifest.web_accessible_resources ?? []).flatMap(
    (resource) => resource.matches ?? []
  )
]
for (const origin of origins) {
  if (!ALLOWED_ORIGIN.test(origin)) {
    problems.push(`host access not allowed: ${origin}`)
  }
}

if (problems.length > 0) {
  console.error(`${MANIFEST}:\n  ${problems.join("\n  ")}`)
  process.exit(1)
}
console.log(`${MANIFEST}: permissions OK`)
