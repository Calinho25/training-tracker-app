import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/utils/auth/useAuth";
import useUser from "@/utils/auth/useUser";
import {
  User,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Trash2,
} from "lucide-react-native";

export default function SettingsIndex() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { data: user } = useUser();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your training data. This action cannot be undone.\n\nAre you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch("/api/account/delete", {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Failed to delete account");
              }

              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted.",
                [{ text: "OK", onPress: () => signOut() }]
              );
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    const baseUrl =
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://calinho25.github.io/training-tracker/privacy-policy.html";
    Linking.openURL(`${baseUrl}/privacy-policy`);
  };

  const openTerms = () => {
    const baseUrl =
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://calinho25.github.io/training-tracker/terms-of-service.html";
    Linking.openURL(`${baseUrl}/terms`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#1a1a1a",
        }}
      >
        <Text
          style={{
            fontSize: 34,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Settings
        </Text>
        <Text style={{ fontSize: 17, color: "#888" }}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#666",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Account
          </Text>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#3b82f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User color="#fff" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#fff",
                    marginBottom: 2,
                  }}
                >
                  {user?.email || "Loading..."}
                </Text>
                <Text style={{ fontSize: 14, color: "#888" }}>Signed in</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy & Legal Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#666",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Privacy & Legal
          </Text>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <TouchableOpacity
              onPress={openPrivacyPolicy}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#222",
              }}
              activeOpacity={0.7}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Shield color="#888" size={20} />
                <Text style={{ fontSize: 16, color: "#fff" }}>
                  Privacy Policy
                </Text>
              </View>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openTerms}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              activeOpacity={0.7}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <FileText color="#888" size={20} />
                <Text style={{ fontSize: 16, color: "#fff" }}>
                  Terms of Service
                </Text>
              </View>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Collection Notice */}
        <View
          style={{
            backgroundColor: "#1a1a2e",
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: "#3b82f6",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            📊 Your Training Data
          </Text>
          <Text style={{ fontSize: 14, color: "#aaa", lineHeight: 20 }}>
            We collect your drill performance data (reps, success rate, time) to
            help you track your progress. This data is stored securely and is
            only visible to you. We never share your personal training data with
            third parties.
          </Text>
        </View>

        {/* Danger Zone */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#ef4444",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Danger Zone
          </Text>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{
              backgroundColor: "#1a1a1a",
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: "#ef4444",
            }}
            activeOpacity={0.7}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Trash2 color="#ef4444" size={20} />
              <View>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#ef4444" }}
                >
                  Delete Account
                </Text>
                <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                  Permanently delete all your data
                </Text>
              </View>
            </View>
            <ChevronRight color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: "#1a1a1a",
            padding: 16,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "#333",
          }}
          activeOpacity={0.7}
        >
          <LogOut color="#888" size={20} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#888" }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text
          style={{
            fontSize: 13,
            color: "#444",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}