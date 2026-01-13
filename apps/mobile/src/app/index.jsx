import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useRequireAuth } from "@/utils/auth/useAuth";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const { isReady } = useRequireAuth();
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const consent = await AsyncStorage.getItem("@consent_accepted");
        setConsentAccepted(consent === "true");
      } catch (error) {
        console.error("Error checking consent:", error);
      } finally {
        setConsentChecked(true);
      }
    };

    if (isReady) {
      checkConsent();
    }
  }, [isReady]);

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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!consentAccepted) {
    return <Redirect href="/consent" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
