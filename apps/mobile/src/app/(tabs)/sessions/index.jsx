import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Plus,
  Calendar,
  ChevronRight,
  RotateCcw,
  Trash2,
} from "lucide-react-native";
import { format } from "date-fns";

export default function SessionsIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();

      // Filter to show only unique session templates (one per name)
      const uniqueSessions = {};
      (data.sessions || []).forEach((session) => {
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
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const repeatSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/repeat`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to repeat session");
      Alert.alert("Success", "Session rescheduled to now!");
      fetchSessions();
    } catch (error) {
      console.error("Error repeating session:", error);
      Alert.alert("Error", "Failed to reschedule session");
    }
  };

  const deleteSession = async (sessionId, sessionName) => {
    Alert.alert(
      "Delete Session?",
      `Are you sure you want to delete "${sessionName}"? This cannot be undone. Calendar entries will be preserved but unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "DELETE",
              });
              if (!response.ok) throw new Error("Failed to delete session");
              Alert.alert("Success", "Session deleted");
              fetchSessions();
            } catch (error) {
              console.error("Error deleting session:", error);
              Alert.alert("Error", "Failed to delete session");
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, []),
  );

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
            Sessions
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/sessions/create")}
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
          Your session templates
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : sessions.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Calendar color="#333" size={64} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No sessions yet
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#666",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Create your first session to start training
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/sessions/create")}
            style={{
              backgroundColor: "#3b82f6",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              Create Session
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {sessions.map((session) => (
            <View
              key={session.id}
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <TouchableOpacity
                onPress={() => router.push(`/sessions/${session.id}`)}
                style={{
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#fff",
                      marginBottom: 6,
                    }}
                  >
                    {session.name}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#888", marginBottom: 8 }}
                  >
                    {format(
                      new Date(session.scheduled_date),
                      "MMM d, yyyy • h:mm a",
                    )}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#666" }}>
                      {session.drill_count} drill
                      {session.drill_count !== 1 ? "s" : ""}
                    </Text>
                    {session.completed_count > 0 && (
                      <Text style={{ fontSize: 13, color: "#10b981" }}>
                        {session.completed_count} completed
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight color="#666" size={20} />
              </TouchableOpacity>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#222",
                  padding: 12,
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id, session.name);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#1a1a1a",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 color="#ef4444" size={16} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#ef4444",
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
