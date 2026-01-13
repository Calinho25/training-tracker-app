import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Play, TrendingUp, Library } from "lucide-react-native";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const actions = [
    {
      title: "Create Session",
      description: "Plan a new training session",
      icon: Plus,
      onPress: () => router.push("/sessions/create"),
      color: "#3b82f6",
    },
    {
      title: "Start Session",
      description: "Run a planned session",
      icon: Play,
      onPress: () => router.push("/sessions"),
      color: "#10b981",
    },
    {
      title: "Progress",
      description: "Track your performance",
      icon: TrendingUp,
      onPress: () => router.push("/progress"),
      color: "#8b5cf6",
    },
    {
      title: "Drill Library",
      description: "Manage drills and categories",
      icon: Library,
      onPress: () => router.push("/library"),
      color: "#f59e0b",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "700",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Training
          </Text>
          <Text style={{ fontSize: 17, color: "#888", marginBottom: 32 }}>
            Plan, track, and improve your performance
          </Text>

          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: action.color + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <Icon color={action.color} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "600",
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {action.title}
                    </Text>
                    <Text style={{ fontSize: 15, color: "#888" }}>
                      {action.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
