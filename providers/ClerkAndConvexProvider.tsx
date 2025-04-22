import type React from "react"
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo"
import { Text } from "react-native"
import { tokenCache } from "@/cache"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error("Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env")
}

// Custom ClerkLoaded component that ensures all content is properly wrapped
const SafeClerkLoaded = ({ children }: { children: React.ReactNode }) => (
  <ClerkLoaded>{typeof children === "string" ? <Text>{children}</Text> : children}</ClerkLoaded>
)

export default function ClerkAndConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {/* Use the SafeClerkLoaded component instead of ClerkLoaded directly */}
        <SafeClerkLoaded>
          {/* Also check if children contains text */}
          {typeof children === "string" ? <Text>{children}</Text> : children}
        </SafeClerkLoaded>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
