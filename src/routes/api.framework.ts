import { createFileRoute } from "@tanstack/react-router"
import { handleGetFramework } from "@/lib/server/token-api"

export const Route = createFileRoute("/api/framework")({
  server: {
    handlers: {
      GET: () => handleGetFramework(),
    },
  },
})
