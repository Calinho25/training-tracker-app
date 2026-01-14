import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import Purchases from "react-native-purchases";
import PaywallGate from "@/components/PaywallGate";
import useAuth from "@/utils/auth/useAuth";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  // Initialize auth state
  useEffect(() => {
    initiate?.();
  }, [initiate]);

  // Configure RevenueCat once the app is ready (NOT on web)
  useEffect(() => {
    if (!isReady) return;

    if (Platform.OS !== "web") {
      Purchases.configure({
        apiKey: "test_LKJEbybzmUpXcgyBhVvrjPubWcs",
        // appUserID: "your-stable-user-id", // optional
      });
    }
  }, [isReady]);

  // Hide splash when ready
  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaywallGate>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
            <Stack.Screen name="index" />
            <Stack.Screen name="consent" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PaywallGate>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
