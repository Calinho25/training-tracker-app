import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";
import PaywallScreen from "../screens/PaywallScreen";

function isPremium(info: CustomerInfo | null) {
  return !!info?.entitlements.active["premium"];
}

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const ci = await Purchases.getCustomerInfo();
      setInfo(ci);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1) initial load
    refresh();

    // 2) live updates (trial ends / renewal / cancellation)
    const sub = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      setInfo(customerInfo);
      setLoading(false);
    });

    return () => {
      // RN Purchases returns a remove function in newer versions,
      // in older ones you call sub.remove(). This handles both:
      // @ts-ignore
      if (typeof sub === "function") sub();
      // @ts-ignore
      if (sub?.remove) sub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isPremium(info)) {
    // Block the entire app until they subscribe or restore.
    return <PaywallScreen onDone={refresh} />;
  }

  return <>{children}</>;
}
