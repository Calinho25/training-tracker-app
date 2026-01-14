import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRequireAuth } from "@/utils/auth/useAuth";

export default function Index() {
  const { isReady, isAuthenticated } = useRequireAuth(); // opens auth modal if needed
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkConsent = async () => {
      try {
        const consent = await AsyncStorage.getItem("@consent_accepted");
        if (!cancelled) setConsentAccepted(consent === "true");
      } catch (e) {
        console.error("Error checking consent:", e);
        if (!cancelled) setConsentAccepted(false);
      } finally {
        if (!cancelled) setConsentChecked(true);
      }
    };

    if (isReady) checkConsent();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  // Still booting auth OR still reading consent
  if (!isReady || !consentChecked) {
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

  // Consent gate
  if (!consentAccepted) {
    return <Redirect href="/consent" />;
  }

  // If user isn't authenticated, useRequireAuth will open the modal.
  // We just keep them here (loading-ish) until they sign in.
  if (!isAuthenticated) {
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

  return <Redirect href="/(tabs)/home" />;
}
