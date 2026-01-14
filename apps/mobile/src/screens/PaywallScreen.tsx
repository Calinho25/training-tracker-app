import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { getMonthlyPackage, purchase, restore } from "../services/subscription";

export default function PaywallScreen({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMonthlyPackage();
        setPkg(p);
      } catch (e: any) {
        Alert.alert("Error", "Could not load subscription options.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startTrial() {
    if (!pkg) return;
    try {
      await purchase(pkg);
      onDone();
    } catch (e: any) {
      // User cancelled is common; don’t treat as error
      if (e?.userCancelled) return;
      Alert.alert("Purchase failed", "Please try again.");
    }
  }

  async function onRestore() {
    try {
      await restore();
      onDone();
    } catch {
      Alert.alert("Restore failed", "Please try again.");
    }
  }

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        Go Premium
      </Text>

      <Text style={{ marginBottom: 12 }}>
        Start your 7-day free trial. Cancel anytime in Google Play.
      </Text>

      <Text style={{ marginBottom: 20 }}>
        After the trial, your subscription renews monthly unless cancelled.
      </Text>

      <Button title="Start Free Trial" onPress={startTrial} disabled={!pkg} />
      <View style={{ height: 12 }} />
      <Button title="Restore Purchases" onPress={onRestore} />
    </View>
  );
}
