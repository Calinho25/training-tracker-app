import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function CreateCategory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const saveCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      router.back();
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Error", error.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

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
              New Category
            </Text>
            <TouchableOpacity
              onPress={saveCategory}
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

        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Category Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Finishing, Passing, Speed"
            placeholderTextColor="#666"
            autoFocus
            style={{
              backgroundColor: "#111",
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: "#fff",
            }}
          />
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
