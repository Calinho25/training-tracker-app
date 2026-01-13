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
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react-native";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export default function CalendarView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
      setAllSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleSessionForDate = async (sessionId) => {
    setScheduling(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/repeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: selectedDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule session");
      Alert.alert("Success", "Session scheduled!");
      fetchSessions();
    } catch (error) {
      console.error("Error scheduling session:", error);
      Alert.alert("Error", "Failed to schedule session");
    } finally {
      setScheduling(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, []),
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getSessionsForDate = (date) => {
    return sessions.filter((session) =>
      isSameDay(new Date(session.scheduled_date), date),
    );
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  // Get unique session templates (by name)
  const sessionTemplates = allSessions.reduce((acc, session) => {
    if (!acc.find((s) => s.name === session.name)) {
      acc.push(session);
    }
    return acc;
  }, []);

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
            Calendar
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
          Plan your training sessions
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => setCurrentDate(subMonths(currentDate, 1))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "600", color: "#fff" }}>
            {format(currentDate, "MMMM yyyy")}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentDate(addMonths(currentDate, 1))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {/* Day headers */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: "#666" }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays.map((day, i) => {
              const daySessions = getSessionsForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDate(day)}
                  style={{
                    width: "14.28%",
                    aspectRatio: 1,
                    padding: 4,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: isSelected
                        ? "#3b82f6"
                        : daySessions.length > 0
                          ? "#1a3a5a"
                          : "transparent",
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isToday ? 2 : 0,
                      borderColor: "#3b82f6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isToday ? "700" : "400",
                        color: !isCurrentMonth ? "#444" : "#fff",
                      }}
                    >
                      {format(day, "d")}
                    </Text>
                    {daySessions.length > 0 && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: isSelected ? "#fff" : "#3b82f6",
                          marginTop: 2,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Schedule session templates for selected date */}
        {sessionTemplates.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Quick Schedule for {format(selectedDate, "MMM d")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {sessionTemplates.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => scheduleSessionForDate(session.id)}
                  disabled={scheduling}
                  style={{
                    backgroundColor: "#111",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#3b82f6",
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
          </View>
        )}

        {/* Sessions for selected date */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            {format(selectedDate, "MMMM d, yyyy")}
          </Text>

          {selectedDateSessions.length === 0 ? (
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
              <CalendarIcon
                color="#333"
                size={48}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={{ fontSize: 15, color: "#666", textAlign: "center" }}
              >
                No sessions scheduled
              </Text>
            </View>
          ) : (
            selectedDateSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => router.push(`/sessions/${session.id}`)}
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
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#fff",
                    marginBottom: 6,
                  }}
                >
                  {session.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>
                  {format(new Date(session.scheduled_date), "h:mm a")}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Target color="#3b82f6" size={14} />
                  <Text style={{ fontSize: 13, color: "#666" }}>
                    {session.drill_count} drill
                    {session.drill_count !== 1 ? "s" : ""}
                  </Text>
                  {session.completed_count > 0 && (
                    <Text style={{ fontSize: 13, color: "#10b981" }}>
                      • {session.completed_count} completed
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
