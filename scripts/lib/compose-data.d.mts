/**
 * Typed contract for the VENDORED composer (compose-data.mjs is byte-identical
 * to otf-cms and stays plain JS so it vendors cleanly). The composed values are
 * `unknown` on purpose — build-data.ts Zod-parses each against the shared
 * schemas before writing, so the real shapes are enforced at runtime there.
 */
export function composeAll(dir?: string): {
  index: unknown
  tokenDocs: { id: string }[]
  frameworkDoc: unknown
  faq: unknown
  testimonials: unknown
  manifest: { snapshot_id: string }
}
