import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { X } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function CreateDrill() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [limitType, setLimitType] = useState("reps");
  const [targetReps, setTargetReps] = useState("");
  const [targetSeconds, setTargetSeconds] = useState("");
  const [trackingMode, setTrackingMode] = useState("success_fail");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, []),
  );

  const saveDrill = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a drill name");
      return;
    }

    if (limitType === "reps" && (!targetReps || parseInt(targetReps) <= 0)) {
      Alert.alert("Error", "Please enter a valid target for reps");
      return;
    }

    if (
      limitType === "time" &&
      (!targetSeconds || parseInt(targetSeconds) <= 0)
    ) {
      Alert.alert("Error", "Please enter a valid target time in seconds");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/drill-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          limitType,
          targetReps: limitType === "reps" ? parseInt(targetReps) : null,
          targetSeconds: limitType === "time" ? parseInt(targetSeconds) : null,
          trackingMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create drill");
      }

      router.back();
    } catch (error) {
      console.error("Error creating drill:", error);
      Alert.alert("Error", error.message || "Failed to create drill template");
    } finally {
      setSaving(false);
    }
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
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
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
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#fff" size={28} />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#fff" }}>
              New Drill Template
            </Text>
            <TouchableOpacity
              onPress={saveDrill}
              disabled={saving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text
                  style={{ fontSize: 17, fontWeight: "600", color: "#3b82f6" }}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Drill Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Corner Kicks"
            placeholderTextColor="#666"
            style={{
              backgroundColor: "#111",
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: "#fff",
              marginBottom: 24,
            }}
          />

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 24 }}
          >
            <TouchableOpacity
              onPress={() => setCategoryId(null)}
              style={{
                backgroundColor: categoryId === null ? "#3b82f6" : "#111",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: categoryId === null ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                None
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={{
                  backgroundColor:
                    categoryId === category.id ? "#3b82f6" : "#111",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: categoryId === category.id ? "#3b82f6" : "#222",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Limit Type
          </Text>
          <View style={{ gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setLimitType("reps")}
              style={{
                backgroundColor: limitType === "reps" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: limitType === "reps" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Repetition Limit
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Drill ends when target reps are reached
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLimitType("time")}
              style={{
                backgroundColor: limitType === "time" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: limitType === "time" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Time Limit
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Drill ends when time runs out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLimitType("none")}
              style={{
                backgroundColor: limitType === "none" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: limitType === "none" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                No Limit
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Manual stop when finished
              </Text>
            </TouchableOpacity>
          </View>

          {limitType === "reps" && (
            <>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Target Reps
              </Text>
              <TextInput
                value={targetReps}
                onChangeText={setTargetReps}
                placeholder="e.g., 20"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                style={{
                  backgroundColor: "#111",
                  borderWidth: 1,
                  borderColor: "#222",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: "#fff",
                  marginBottom: 24,
                }}
              />
            </>
          )}

          {limitType === "time" && (
            <>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Target Time (seconds)
              </Text>
              <TextInput
                value={targetSeconds}
                onChangeText={setTargetSeconds}
                placeholder="e.g., 60"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                style={{
                  backgroundColor: "#111",
                  borderWidth: 1,
                  borderColor: "#222",
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: "#fff",
                  marginBottom: 24,
                }}
              />
            </>
          )}

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Tracking Mode
          </Text>
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => setTrackingMode("success_fail")}
              style={{
                backgroundColor:
                  trackingMode === "success_fail" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor:
                  trackingMode === "success_fail" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Success / Miss
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Track successful vs missed attempts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTrackingMode("left_right")}
              style={{
                backgroundColor:
                  trackingMode === "left_right" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: trackingMode === "left_right" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Left / Right Foot
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Track left and right foot separately with success/miss
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTrackingMode("reps_only")}
              style={{
                backgroundColor:
                  trackingMode === "reps_only" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: trackingMode === "reps_only" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Rep Counter Only
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Just count reps without success/miss tracking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTrackingMode("time_only")}
              style={{
                backgroundColor:
                  trackingMode === "time_only" ? "#3b82f6" : "#111",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: trackingMode === "time_only" ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Time Only
              </Text>
              <Text style={{ fontSize: 13, color: "#888" }}>
                Just track elapsed time without rep counting
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
