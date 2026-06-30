import { clerkPlugin } from '@clerk/vue'
import type { App } from 'vue'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

export function setupClerk(app: App) {
  app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY
  })
}
