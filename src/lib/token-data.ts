import indexData from "@/data/generated/index.json"
import type { IndexRow } from "@/lib/schemas"

export type Token = IndexRow

const tokens = indexData.tokens as Token[]

function getTokens(): Token[] {
  return tokens
}

function getTokenById(tokenId: string): Token | null {
  const normalizedId = tokenId.trim().toLowerCase()
  return tokens.find((token) => token.id.toLowerCase() === normalizedId) ?? null
}

export { getTokenById, getTokens }
