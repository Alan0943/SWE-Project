import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from "@/cache";
import { FavoritesProvider } from '../src/contexts/FavoritesContext';
import { BarDataProvider } from '../src/contexts/BarDataContext'; // ✅ Import the BarDataContext
import React from 'react';
import { Slot } from "expo-router";


export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <BarDataProvider> 
            <FavoritesProvider>
              <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
                <Slot />
              </SafeAreaView>
            </FavoritesProvider>
          </BarDataProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}