import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ChevronLeft, Play, CheckCircle2, Circle } from "lucide-react-native";

export default function SessionRunner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      const data = await response.json();
      setSession(data.session);
      setDrills(data.drills || []);
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSession();
    }, [id]),
  );

  const startDrill = (drill) => {
    router.push({
      pathname: `/sessions/${id}/drill`,
      params: {
        drillInstanceId: drill.id,
        drillTemplateId: drill.drill_template_id,
        sessionId: id,
        drillName: drill.drill_name,
        limitType: drill.limit_type,
        targetReps: drill.target_reps || 0,
        targetSeconds: drill.target_seconds || 0,
        categoryName: drill.category_name || "Uncategorised",
        trackingMode: drill.tracking_mode || "success_fail",
      },
    });
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#1a1a1a",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#fff",
              marginLeft: 12,
            }}
          >
            Session
          </Text>
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {session?.name}
        </Text>
        <Text style={{ fontSize: 15, color: "#888" }}>
          {drills.filter((d) => d.log_id !== null).length} of {drills.length}{" "}
          drills have logs
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
        {drills.map((drill, index) => {
          const hasLog = drill.log_id !== null;

          return (
            <TouchableOpacity
              key={drill.id}
              onPress={() => startDrill(drill)}
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#222",
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#333",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}
                    >
                      {drill.drill_name}
                    </Text>
                  </View>

                  <Text
                    style={{ fontSize: 14, color: "#888", marginBottom: 12 }}
                  >
                    {drill.category_name}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View>
                      <Text
                        style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                      >
                        Target
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        {drill.limit_type === "reps"
                          ? `${drill.target_reps} reps`
                          : drill.limit_type === "time"
                            ? `${drill.target_seconds}s`
                            : "No limit"}
                      </Text>
                    </View>

                    {hasLog && drill.success_rate !== null && (
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginBottom: 2,
                          }}
                        >
                          Last Score
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          {drill.successful_reps}/{drill.attempted_reps} (
                          {drill.success_rate}%)
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      backgroundColor: "#3b82f6",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 12,
                      gap: 6,
                    }}
                  >
                    <Play color="#fff" size={16} fill="#fff" />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      {hasLog ? "Start Again" : "Start Drill"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
