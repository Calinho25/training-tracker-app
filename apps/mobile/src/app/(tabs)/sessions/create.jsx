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
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  Calendar,
  Clock,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { format } from "date-fns";

export default function CreateSession() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [drills, setDrills] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchData = async () => {
    try {
      const [templatesRes, sessionsRes] = await Promise.all([
        fetch("/api/drill-templates"),
        fetch("/api/sessions"),
      ]);
      if (!templatesRes.ok || !sessionsRes.ok)
        throw new Error("Failed to fetch data");
      const templatesData = await templatesRes.json();
      const sessionsData = await sessionsRes.json();
      setTemplates(templatesData.templates || []);

      // Filter to show only unique session templates (one per name)
      const uniqueSessions = {};
      (sessionsData.sessions || []).forEach((session) => {
        if (
          !uniqueSessions[session.name] ||
          new Date(session.created_at) <
            new Date(uniqueSessions[session.name].created_at)
        ) {
          uniqueSessions[session.name] = session;
        }
      });

      setSessions(Object.values(uniqueSessions));
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

  const addDrill = (template) => {
    setDrills([...drills, { templateId: template.id, template }]);
    setShowTemplates(false);
  };

  const removeDrill = (index) => {
    setDrills(drills.filter((_, i) => i !== index));
  };

  const createNewTemplate = () => {
    router.push("/library/create-drill");
  };

  const scheduleExistingSession = async (sessionId) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/repeat`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to schedule session");
      Alert.alert("Success", "Session scheduled!");
      router.back();
    } catch (error) {
      console.error("Error scheduling session:", error);
      Alert.alert("Error", "Failed to schedule session");
    } finally {
      setSaving(false);
    }
  };

  const saveSession = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a session name");
      return;
    }

    if (drills.length === 0) {
      Alert.alert("Error", "Please add at least one drill");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scheduledDate: new Date().toISOString(),
          drills: drills.map((d) => ({ templateId: d.templateId })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
      }

      router.back();
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert("Error", error.message || "Failed to create session");
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
              New Session
            </Text>
            <TouchableOpacity
              onPress={saveSession}
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
          {/* Quick Schedule Existing Sessions */}
          {sessions.length > 0 && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Calendar color="#888" size={16} style={{ marginRight: 6 }} />
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#888" }}
                >
                  Quick Schedule
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 32, flexGrow: 0 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {sessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    onPress={() => scheduleExistingSession(session.id)}
                    disabled={saving}
                    style={{
                      backgroundColor: "#111",
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "#222",
                      minWidth: 140,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {session.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      {session.drill_count} drill
                      {session.drill_count !== 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: "#222" }} />
                <Text
                  style={{
                    fontSize: 13,
                    color: "#666",
                    marginHorizontal: 12,
                  }}
                >
                  or create new
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#222" }} />
              </View>
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
            Session Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Morning Training"
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

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
              Drills
            </Text>
            <TouchableOpacity
              onPress={() => setShowTemplates(true)}
              style={{
                backgroundColor: "#3b82f6",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
              activeOpacity={0.7}
            >
              <Plus color="#fff" size={16} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                Add Drill
              </Text>
            </TouchableOpacity>
          </View>

          {drills.length === 0 ? (
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
                style={{ fontSize: 15, color: "#666", textAlign: "center" }}
              >
                No drills added yet. Tap "Add Drill" to get started.
              </Text>
            </View>
          ) : (
            drills.map((drill, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#222",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <GripVertical
                  color="#666"
                  size={20}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {drill.template.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#888" }}>
                    {drill.template.category_name || "Uncategorised"} •{" "}
                    {drill.template.limit_type === "reps"
                      ? `${drill.template.target_reps} reps`
                      : drill.template.limit_type === "time"
                        ? `${drill.template.target_seconds}s`
                        : "No limit"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeDrill(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Template selection modal - keep as is */}
        {showTemplates && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.9)",
            }}
          >
            <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
              <View
                style={{
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
                  <Text
                    style={{ fontSize: 20, fontWeight: "600", color: "#fff" }}
                  >
                    Select Drill
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTemplates(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X color="#fff" size={28} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {templates.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: "#666",
                        marginBottom: 16,
                        textAlign: "center",
                      }}
                    >
                      No drill templates yet
                    </Text>
                    <TouchableOpacity
                      onPress={createNewTemplate}
                      style={{
                        backgroundColor: "#3b82f6",
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 12,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        Create Template
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {templates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        onPress={() => addDrill(template)}
                        style={{
                          backgroundColor: "#111",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: "#222",
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
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={createNewTemplate}
                      style={{
                        backgroundColor: "#111",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#3b82f6",
                        borderStyle: "dashed",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#3b82f6",
                        }}
                      >
                        + Create New Template
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
