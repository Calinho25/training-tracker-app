import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";

const ANDROID_API_KEY = "YOUR_REVENUECAT_ANDROID_PUBLIC_API_KEY"; // from RevenueCat

export async function initPurchases(appUserId?: string) {
  if (Platform.OS !== "android") return;

  Purchases.configure({
    apiKey: ANDROID_API_KEY,
    appUserID: appUserId, // IMPORTANT if you have login
  });
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

export function isPremium(info: CustomerInfo): boolean {
  return !!info.entitlements.active["premium"];
}

export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;

  // Usually current.availablePackages[0] is your default monthly package
  // but better is to pick by identifier if you set one in RevenueCat.
  return current.availablePackages[0] ?? null;
}

export async function purchase(pkg: PurchasesPackage) {
  return await Purchases.purchasePackage(pkg);
}

export async function restore() {
  return await Purchases.restorePurchases();
}

export async function logoutPurchasesUser() {
  // Call this when your app user logs out
  await Purchases.logOut();
}
