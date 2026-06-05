import {
  type ComposedCriterion,
  type ComposedMetric,
  CRITERIA_STATUS,
  type CriteriaStatusValue,
  type Evidence,
  type EvidenceUrl,
  type TokenDoc,
} from "@/lib/schemas"

export { CRITERIA_STATUS }
export type { CriteriaStatusValue, Evidence, EvidenceUrl }
export type Criteria = ComposedCriterion
export type Metric = ComposedMetric

const tokenDocModules = import.meta.glob<{ default: TokenDoc }>(
  "../data/generated/tokens/*.json",
  { eager: true }
)

const tokenDocs = new Map(
  Object.values(tokenDocModules).map((mod) => [mod.default.id, mod.default])
)

export function getTokenDoc(tokenId: string): TokenDoc | null {
  return tokenDocs.get(tokenId.trim().toLowerCase()) ?? null
}

export function getCriteriaStatus(
  tokenId: string,
  criteriaId: string
): CriteriaStatusValue {
  const doc = getTokenDoc(tokenId)
  if (!doc) return CRITERIA_STATUS.REFERENCE
  for (const m of doc.metrics) {
    for (const c of m.criteria) {
      // Statuses are schema-validated canonical values (ADR 0002) —
      // no runtime normalization layer exists by design.
      if (c.id === criteriaId) return c.status
    }
  }
  return CRITERIA_STATUS.REFERENCE
}

export function getMetricsByTokenId(tokenId: string): Metric[] {
  return getTokenDoc(tokenId)?.metrics ?? []
}
