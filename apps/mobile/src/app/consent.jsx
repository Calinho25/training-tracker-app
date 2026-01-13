import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield, CheckCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ConsentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem("@consent_accepted", "true");
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Error saving consent:", error);
    }
  };

  const openPrivacyPolicy = () => {
    const baseUrl =
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://calinho25.github.io/training-tracker/privacy-policy.html";
    Linking.openURL(`${baseUrl}/privacy-policy`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#1a1a2e",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#3b82f6",
            }}
          >
            <Shield color="#3b82f6" size={40} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#fff",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Your Privacy Matters
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#888",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Before you start, let's talk about your data
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            What We Collect
          </Text>

          <View style={{ gap: 16 }}>
            <View
              style={{
                backgroundColor: "#111",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                📊 Training Performance Data
              </Text>
              <Text style={{ fontSize: 14, color: "#aaa", lineHeight: 20 }}>
                We track your drill attempts, successes, time spent, and
                left/right performance to help you monitor your progress over
                time.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#111",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                👤 Account Information
              </Text>
              <Text style={{ fontSize: 14, color: "#aaa", lineHeight: 20 }}>
                Your email address and account details are stored securely to
                enable sign-in and sync your data across devices.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            How We Use It
          </Text>

          <View
            style={{
              backgroundColor: "#1a1a2e",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#3b82f6",
            }}
          >
            <Text style={{ fontSize: 14, color: "#ccc", lineHeight: 22 }}>
              ✓ Display your personal training history and progress charts{"\n"}
              ✓ Calculate success rates and performance trends{"\n"}✓ Sync your
              data across your devices{"\n"}✓ Improve app features based on
              usage patterns{"\n"}
              {"\n"}✗ We never sell your data to third parties{"\n"}✗ We never
              share your personal training data{"\n"}✗ We never use your data
              for advertising
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={openPrivacyPolicy}
          style={{ marginBottom: 24 }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#3b82f6",
              textAlign: "center",
              textDecorationLine: "underline",
            }}
          >
            Read our full Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAccepted(!accepted)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            padding: 16,
            backgroundColor: "#111",
            borderRadius: 12,
            borderWidth: 2,
            borderColor: accepted ? "#3b82f6" : "#222",
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: accepted ? "#3b82f6" : "#666",
              backgroundColor: accepted ? "#3b82f6" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {accepted && <CheckCircle color="#fff" size={16} />}
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              color: "#fff",
              lineHeight: 20,
            }}
          >
            I understand and agree to the collection and use of my training data
            as described above
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAccept}
          disabled={!accepted}
          style={{
            backgroundColor: accepted ? "#3b82f6" : "#1a1a1a",
            padding: 18,
            borderRadius: 12,
            alignItems: "center",
            opacity: accepted ? 1 : 0.5,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: accepted ? "#fff" : "#666",
            }}
          >
            Continue to App
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}