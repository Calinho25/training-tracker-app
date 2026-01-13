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
import { ChevronLeft, Calendar } from "lucide-react-native";
import { format, subDays } from "date-fns";

export default function CategoryProgress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [category, setCategory] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const fetchData = async () => {
    try {
      let startDate = null;
      const now = new Date();

      if (timeFilter === "7d") startDate = subDays(now, 7).toISOString();
      else if (timeFilter === "30d") startDate = subDays(now, 30).toISOString();
      else if (timeFilter === "90d") startDate = subDays(now, 90).toISOString();

      const params = new URLSearchParams({ categoryId: id });
      if (startDate) params.append("startDate", startDate);

      const [categoryRes, logsRes] = await Promise.all([
        fetch(`/api/categories`),
        fetch(`/api/drill-logs?${params}`),
      ]);

      if (!categoryRes.ok || !logsRes.ok)
        throw new Error("Failed to fetch data");

      const categoryData = await categoryRes.json();
      const logsData = await logsRes.json();

      const cat = categoryData.categories.find((c) => c.id === parseInt(id));
      setCategory(cat);
      setLogs(logsData.logs || []);
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

  // Group logs by drill
  const logsByDrill = logs.reduce((acc, log) => {
    if (!acc[log.drill_name]) acc[log.drill_name] = [];
    acc[log.drill_name].push(log);
    return acc;
  }, {});

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
            Category Progress
          </Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>
          {category?.name}
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
              Total Drills
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>
              {logs.length}
            </Text>
          </View>
        </View>

        {/* By Drill */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 16,
          }}
        >
          Performance by Drill
        </Text>

        {Object.keys(logsByDrill).length === 0 ? (
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
              No drill logs in this category yet
            </Text>
          </View>
        ) : (
          Object.entries(logsByDrill).map(([drillName, drillLogs]) => {
            const avgSuccess = (
              drillLogs.reduce(
                (acc, log) => acc + parseFloat(log.success_rate || 0),
                0,
              ) / drillLogs.length
            ).toFixed(1);

            return (
              <View
                key={drillName}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  {drillName}
                </Text>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                    >
                      Sessions
                    </Text>
                    <Text
                      style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}
                    >
                      {drillLogs.length}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 2 }}
                    >
                      Avg Success
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: "#10b981",
                      }}
                    >
                      {avgSuccess}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
