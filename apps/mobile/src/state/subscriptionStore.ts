import { useEffect, useState } from "react";
import { CustomerInfo } from "react-native-purchases";
import { getCustomerInfo, isPremium } from "../services/subscription";

export function useSubscriptionStatus() {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const ci = await getCustomerInfo();
      setInfo(ci);
      setPremium(isPremium(ci));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { info, premium, loading, refresh };
}
