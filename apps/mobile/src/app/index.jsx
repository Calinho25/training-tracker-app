import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import useAuth from "@/utils/auth/useAuth";

export default function Index() {
  const { isReady, isAuthenticated, signIn } = useAuth();

  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  // If auth is ready and user is not logged in, show auth modal
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) signIn();
  }, [isReady, isAuthenticated, signIn]);

  // Only check consent after user is authenticated
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      try {
        const consent = await AsyncStorage.getItem("@consent_accepted");
        if (!cancelled) setConsentAccepted(consent === "true");
      } catch (e) {
        console.error("Error checking consent:", e);
        if (!cancelled) setConsentAccepted(false);
      } finally {
        if (!cancelled) setConsentChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated]);

  if (!isReady || !isAuthenticated || !consentChecked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!consentAccepted) return <Redirect href="/consent" />;
  return <Redirect href="/(tabs)/home" />;
}
