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
import { useRouter, useFocusEffect } from "expo-router";
import { TrendingUp, ChevronRight, Target, Layers } from "lucide-react-native";

export default function ProgressIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        fetch("/api/drill-templates"),
        fetch("/api/categories"),
      ]);

      if (!templatesRes.ok || !categoriesRes.ok)
        throw new Error("Failed to fetch data");

      const templatesData = await templatesRes.json();
      const categoriesData = await categoriesRes.json();

      setTemplates(templatesData.templates || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

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
          Progress
        </Text>
        <Text style={{ fontSize: 17, color: "#888" }}>
          Track your performance over time
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
        {/* Categories Section */}
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Layers color="#8b5cf6" size={20} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              By Category
            </Text>
          </View>

          {categories.length === 0 ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#666", textAlign: "center" }}
              >
                No categories yet
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => router.push(`/progress/category/${category.id}`)}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#222",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 17, fontWeight: "600", color: "#fff" }}
                  >
                    {category.name}
                  </Text>
                </View>
                <ChevronRight color="#666" size={20} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Drills Section */}
        <View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Target color="#3b82f6" size={20} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              By Drill
            </Text>
          </View>

          {templates.length === 0 ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#666", textAlign: "center" }}
              >
                No drill templates yet
              </Text>
            </View>
          ) : (
            templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => router.push(`/progress/drill/${template.id}`)}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#222",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "600",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {template.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#888" }}>
                    {template.category_name || "Uncategorised"} •{" "}
                    {template.limit_type === "reps"
                      ? `${template.target_reps} reps`
                      : template.limit_type === "time"
                        ? `${template.target_seconds}s`
                        : "No limit"}
                  </Text>
                </View>
                <ChevronRight color="#666" size={20} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
