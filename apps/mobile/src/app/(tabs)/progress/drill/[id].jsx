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
import {
  ChevronLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { format, subDays } from "date-fns";

export default function DrillProgress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [template, setTemplate] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [improvement, setImprovement] = useState(null);

  const fetchData = async () => {
    try {
      let startDate = null;
      const now = new Date();

      if (timeFilter === "7d") startDate = subDays(now, 7).toISOString();
      else if (timeFilter === "30d") startDate = subDays(now, 30).toISOString();
      else if (timeFilter === "90d") startDate = subDays(now, 90).toISOString();

      const params = new URLSearchParams({ drillTemplateId: id });
      if (startDate) params.append("startDate", startDate);

      const [templateRes, logsRes] = await Promise.all([
        fetch(`/api/drill-templates/${id}`),
        fetch(`/api/drill-logs?${params}`),
      ]);

      if (!templateRes.ok || !logsRes.ok)
        throw new Error("Failed to fetch data");

      const templateData = await templateRes.json();
      const logsData = await logsRes.json();

      setTemplate(templateData.template);
      setLogs(logsData.logs || []);

      // Calculate improvement
      if (logsData.logs && logsData.logs.length >= 6) {
        const recentLogs = logsData.logs.slice(0, 3);
        const olderLogs = logsData.logs.slice(-3);

        const recentAvg =
          recentLogs.reduce(
            (sum, log) => sum + (parseFloat(log.success_rate) || 0),
            0,
          ) / recentLogs.length;
        const olderAvg =
          olderLogs.reduce(
            (sum, log) => sum + (parseFloat(log.success_rate) || 0),
            0,
          ) / olderLogs.length;

        if (olderAvg > 0) {
          const change = ((recentAvg - olderAvg) / olderAvg) * 100;
          setImprovement({
            change: change.toFixed(1),
            recent: recentAvg.toFixed(1),
            older: olderAvg.toFixed(1),
          });
        }
      } else {
        setImprovement(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id, timeFilter]),
  );

  const getAverage = (field) => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce(
      (acc, log) => acc + (parseFloat(log[field]) || 0),
      0,
    );
    return (sum / logs.length).toFixed(field === "success_rate" ? 1 : 0);
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
            Progress
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
          {template?.name}
        </Text>
        <Text style={{ fontSize: 15, color: "#888" }}>
          {template?.category_name || "Uncategorised"}
        </Text>
      </View>

      {/* Time Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 8,
        }}
      >
        {[
          { label: "All Time", value: "all" },
          { label: "Last 7 Days", value: "7d" },
          { label: "Last 30 Days", value: "30d" },
          { label: "Last 90 Days", value: "90d" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setTimeFilter(filter.value)}
            style={{
              backgroundColor: timeFilter === filter.value ? "#3b82f6" : "#111",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: timeFilter === filter.value ? "#3b82f6" : "#222",
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Improvement Metric */}
        {improvement && (
          <View
            style={{
              backgroundColor: improvement.change >= 0 ? "#1a3a2a" : "#3a1a1a",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: improvement.change >= 0 ? "#10b981" : "#ef4444",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                  Improvement
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 32,
                      fontWeight: "700",
                      color: improvement.change >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {improvement.change >= 0 ? "+" : ""}
                    {improvement.change}%
                  </Text>
                  <Text style={{ fontSize: 14, color: "#666" }}>
                    {improvement.older}% → {improvement.recent}%
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                  Recent 3 vs earliest 3 sessions
                </Text>
              </View>
              {improvement.change >= 0 ? (
                <TrendingUp color="#10b981" size={32} />
              ) : (
                <TrendingDown color="#ef4444" size={32} />
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#111",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
              Avg Success
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#10b981" }}>
              {getAverage("success_rate")}%
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#111",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
              Sessions
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>
              {logs.length}
            </Text>
          </View>
        </View>

        {/* History */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 16,
          }}
        >
          History
        </Text>

        {logs.length === 0 ? (
          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 12,
              padding: 32,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <Calendar color="#333" size={48} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, color: "#666", textAlign: "center" }}>
              No drill logs yet for this time period
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <View
              key={log.id}
              style={{
                backgroundColor: "#111",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 13, color: "#888" }}>
                  {format(new Date(log.finished_at), "MMM d, yyyy • h:mm a")}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      log.success_rate >= 70
                        ? "#10b98120"
                        : log.success_rate >= 50
                          ? "#f59e0b20"
                          : "#ef444420",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color:
                        log.success_rate >= 70
                          ? "#10b981"
                          : log.success_rate >= 50
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    {log.success_rate}% Success
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                  >
                    Score
                  </Text>
                  <Text
                    style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}
                  >
                    {log.successful_reps}/{log.attempted_reps}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                  >
                    Time
                  </Text>
                  <Text
                    style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}
                  >
                    {Math.floor(log.time_spent_seconds / 60)}:
                    {(log.time_spent_seconds % 60).toString().padStart(2, "0")}
                  </Text>
                </View>

                {log.session_name && (
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                    >
                      Session
                    </Text>
                    <Text
                      style={{ fontSize: 14, fontWeight: "500", color: "#888" }}
                      numberOfLines={1}
                    >
                      {log.session_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
