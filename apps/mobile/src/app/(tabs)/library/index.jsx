import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Folder, Target, Edit2, Trash2 } from "lucide-react-native";

export default function LibraryIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const deleteDrill = (id) => {
    Alert.alert(
      "Delete Drill",
      "Are you sure you want to delete this drill template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/drill-templates/${id}`, {
                method: "DELETE",
              });
              if (!response.ok) throw new Error("Failed to delete drill");
              fetchData();
            } catch (error) {
              console.error("Error deleting drill:", error);
              Alert.alert("Error", "Failed to delete drill");
            }
          },
        },
      ],
    );
  };

  const deleteCategory = (id, name) => {
    if (name === "Uncategorised") {
      Alert.alert("Error", "Cannot delete Uncategorised category");
      return;
    }

    Alert.alert(
      "Delete Category",
      "Are you sure? Drills in this category will be moved to Uncategorised.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/categories/${id}`, {
                method: "DELETE",
              });
              if (!response.ok) throw new Error("Failed to delete category");
              fetchData();
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category");
            }
          },
        },
      ],
    );
  };

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category_id === selectedCategory)
    : templates;

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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 34, fontWeight: "700", color: "#fff" }}>
            Library
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/library/create-drill")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 17, color: "#888" }}>
          Manage your drills and categories
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
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Folder color="#f59e0b" size={20} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
                Categories
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/library/create-category")}
              style={{
                backgroundColor: "#222",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
              activeOpacity={0.7}
            >
              <Plus color="#fff" size={14} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>
                New
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={{
                backgroundColor: selectedCategory === null ? "#3b82f6" : "#111",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: selectedCategory === null ? "#3b82f6" : "#222",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                All ({templates.length})
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <View
                key={category.id}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory(category.id)}
                  style={{
                    backgroundColor:
                      selectedCategory === category.id ? "#3b82f6" : "#111",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor:
                      selectedCategory === category.id ? "#3b82f6" : "#222",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                  >
                    {category.name} (
                    {
                      templates.filter((t) => t.category_id === category.id)
                        .length
                    }
                    )
                  </Text>
                </TouchableOpacity>
                {category.name !== "Uncategorised" && (
                  <TouchableOpacity
                    onPress={() => deleteCategory(category.id, category.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: -6, zIndex: 10 }}
                  >
                    <View
                      style={{
                        backgroundColor: "#ef4444",
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 color="#fff" size={12} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
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
              Drills {selectedCategory && `(${filteredTemplates.length})`}
            </Text>
          </View>

          {filteredTemplates.length === 0 ? (
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
              <Text
                style={{
                  fontSize: 15,
                  color: "#666",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {selectedCategory
                  ? "No drills in this category"
                  : "No drill templates yet"}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/library/create-drill")}
                style={{
                  backgroundColor: "#3b82f6",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  Create Drill
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTemplates.map((template) => (
              <View
                key={template.id}
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
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
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
                    <Text
                      style={{ fontSize: 13, color: "#888", marginBottom: 8 }}
                    >
                      {template.category_name || "Uncategorised"}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#222",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        {template.limit_type === "reps"
                          ? `${template.target_reps} reps`
                          : template.limit_type === "time"
                            ? `${template.target_seconds}s`
                            : "No limit"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteDrill(template.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: 12 }}
                  >
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
