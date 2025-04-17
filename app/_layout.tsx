import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FavoritesProvider } from '../src/contexts/FavoritesContext'; // ✅ Import the context
import React from 'react';
import { Slot } from "expo-router";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";


export default function RootLayout() {
  

  return (
      <ClerkAndConvexProvider>
        <SafeAreaProvider>
          <FavoritesProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
              <Slot />
            </SafeAreaView>
          </FavoritesProvider>
        </SafeAreaProvider>
      </ClerkAndConvexProvider>
  );
}
