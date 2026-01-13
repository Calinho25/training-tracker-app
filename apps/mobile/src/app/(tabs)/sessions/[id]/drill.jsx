import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Vibration,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  X,
  Check,
  Pause,
  Play,
  RotateCcw,
  StopCircle,
  Plus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function DrillExecution() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    drillInstanceId,
    drillTemplateId,
    sessionId,
    drillName,
    limitType,
    targetReps,
    targetSeconds,
    categoryName,
    trackingMode = "success_fail",
  } = params;

  const [attemptedReps, setAttemptedReps] = useState(0);
  const [successfulReps, setSuccessfulReps] = useState(0);
  const [leftAttempted, setLeftAttempted] = useState(0);
  const [leftSuccessful, setLeftSuccessful] = useState(0);
  const [rightAttempted, setRightAttempted] = useState(0);
  const [rightSuccessful, setRightSuccessful] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);

  const startTimeRef = useRef(new Date());
  const intervalRef = useRef(null);

  const target =
    limitType === "reps" ? parseInt(targetReps) : parseInt(targetSeconds);
  const isRepLimit = limitType === "reps";
  const isTimeLimit = limitType === "time";
  const isLeftRight = trackingMode === "left_right";
  const isRepsOnly = trackingMode === "reps_only";
  const isTimeOnly = trackingMode === "time_only";

  useEffect(() => {
    startTimer();
    fetchPreviousScore();
    return () => {
      stopTimer();
      stopAlarm();
    };
  }, []);

  const fetchPreviousScore = async () => {
    try {
      const response = await fetch(
        `/api/drill-logs?drillTemplateId=${drillTemplateId}`,
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.logs && data.logs.length > 0) {
        setPreviousScore(data.logs[0]); // Most recent log
      }
    } catch (error) {
      console.error("Error fetching previous score:", error);
    }
  };

  useEffect(() => {
    // Check if drill should end
    const totalAttempted = isLeftRight
      ? leftAttempted + rightAttempted
      : attemptedReps;

    if (isRepLimit && totalAttempted >= target) {
      triggerAlarm();
    } else if (isTimeLimit && elapsedSeconds >= target) {
      triggerAlarm();
    }
  }, [
    attemptedReps,
    leftAttempted,
    rightAttempted,
    elapsedSeconds,
    isRepLimit,
    isTimeLimit,
    target,
  ]);

  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePause = () => {
    if (isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  const triggerAlarm = async () => {
    stopTimer();
    setShowAlarm(true);

    // Vibrate the phone
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Pattern: vibrate for 500ms, pause 200ms, vibrate 500ms, pause 200ms, vibrate 500ms
    Vibration.vibrate([0, 500, 200, 500, 200, 500], true);
  };

  const stopAlarm = async () => {
    // Stop vibration
    Vibration.cancel();
  };

  const handleFinishEarly = () => {
    Alert.alert(
      "Finish Drill Early?",
      "Do you want to finish this drill now?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finish", onPress: () => triggerAlarm() },
      ],
    );
  };

  // Success/Fail Mode
  const handleTick = () => {
    if (showAlarm) return;
    setAttemptedReps((prev) => prev + 1);
    setSuccessfulReps((prev) => prev + 1);
  };

  const handleX = () => {
    if (showAlarm) return;
    setAttemptedReps((prev) => prev + 1);
  };

  // Left/Right Mode
  const handleLeftSuccess = () => {
    if (showAlarm) return;
    setLeftAttempted((prev) => prev + 1);
    setLeftSuccessful((prev) => prev + 1);
  };

  const handleLeftMiss = () => {
    if (showAlarm) return;
    setLeftAttempted((prev) => prev + 1);
  };

  const handleRightSuccess = () => {
    if (showAlarm) return;
    setRightAttempted((prev) => prev + 1);
    setRightSuccessful((prev) => prev + 1);
  };

  const handleRightMiss = () => {
    if (showAlarm) return;
    setRightAttempted((prev) => prev + 1);
  };

  // Reps Only Mode
  const handleRepIncrement = () => {
    if (showAlarm) return;
    setAttemptedReps((prev) => prev + 1);
  };

  const undoLast = () => {
    if (showAlarm) return;

    if (isLeftRight) {
      // Undo last left or right action
      if (
        rightAttempted > 0 &&
        (leftAttempted === 0 || rightAttempted >= leftAttempted)
      ) {
        if (rightSuccessful === rightAttempted) {
          setRightSuccessful((prev) => prev - 1);
        }
        setRightAttempted((prev) => prev - 1);
      } else if (leftAttempted > 0) {
        if (leftSuccessful === leftAttempted) {
          setLeftSuccessful((prev) => prev - 1);
        }
        setLeftAttempted((prev) => prev - 1);
      }
    } else {
      if (attemptedReps === 0) return;

      if (successfulReps === attemptedReps) {
        setSuccessfulReps((prev) => prev - 1);
        setAttemptedReps((prev) => prev - 1);
      } else {
        setAttemptedReps((prev) => prev - 1);
      }
    }
  };

  const saveDrillLog = async () => {
    setSaving(true);
    await stopAlarm();

    try {
      const finishedAt = new Date();

      let totalAttempted = attemptedReps;
      let totalSuccessful = successfulReps;

      if (isLeftRight) {
        totalAttempted = leftAttempted + rightAttempted;
        totalSuccessful = leftSuccessful + rightSuccessful;
      }

      const successRate =
        totalAttempted > 0
          ? ((totalSuccessful / totalAttempted) * 100).toFixed(2)
          : 0;

      const response = await fetch("/api/drill-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillInstanceId: parseInt(drillInstanceId),
          drillTemplateId: parseInt(drillTemplateId),
          sessionId: parseInt(sessionId),
          startedAt: startTimeRef.current.toISOString(),
          finishedAt: finishedAt.toISOString(),
          timeSpentSeconds: elapsedSeconds,
          attemptedReps: totalAttempted,
          successfulReps: totalSuccessful,
          leftAttempted: isLeftRight ? leftAttempted : 0,
          leftSuccessful: isLeftRight ? leftSuccessful : 0,
          rightAttempted: isLeftRight ? rightAttempted : 0,
          rightSuccessful: isLeftRight ? rightSuccessful : 0,
          limitType,
          targetReps: isRepLimit ? target : null,
          targetSeconds: isTimeLimit ? target : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save drill log");

      // Navigate back to session screen after successful save
      router.back();
    } catch (error) {
      console.error("Error saving drill log:", error);
      Alert.alert("Error", "Failed to save drill results");
      setSaving(false);
    }
  };

  const handleDone = () => {
    setShowAlarm(false);
    saveDrillLog();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCountdownTime = () => {
    if (!isTimeLimit) return null;
    const remaining = Math.max(0, target - elapsedSeconds);
    return formatTime(remaining);
  };

  const totalAttempted = isLeftRight
    ? leftAttempted + rightAttempted
    : attemptedReps;
  const totalSuccessful = isLeftRight
    ? leftSuccessful + rightSuccessful
    : successfulReps;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Header */}
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
            onPress={() => {
              Alert.alert(
                "Exit Drill",
                "Are you sure? Progress will not be saved.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Exit",
                    onPress: () => router.back(),
                    style: "destructive",
                  },
                ],
              );
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color="#fff" size={28} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>
              {categoryName}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: "600", color: "#fff" }}>
              {drillName}
            </Text>
            {previousScore && (
              <Text style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
                Last: {previousScore.successful_reps}/
                {previousScore.attempted_reps}
                {previousScore.success_rate
                  ? ` (${previousScore.success_rate}%)`
                  : ""}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={undoLast}
            disabled={isPaused || totalAttempted === 0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ opacity: isPaused || totalAttempted === 0 ? 0.3 : 1 }}
          >
            <RotateCcw color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Stats Area */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            marginBottom: 16,
          }}
        >
          {!isTimeOnly && (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                {isRepsOnly
                  ? "Reps"
                  : isLeftRight
                    ? "Total"
                    : isRepLimit
                      ? "Score"
                      : "Reps"}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: "700", color: "#fff" }}>
                {isRepsOnly || isTimeOnly
                  ? totalAttempted
                  : `${totalSuccessful}/${totalAttempted}`}
              </Text>
              {isRepLimit && !isTimeOnly && (
                <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                  Target: {target}
                </Text>
              )}
            </View>
          )}

          {!isTimeOnly && !isRepsOnly && (
            <View style={{ width: 1, height: 50, backgroundColor: "#222" }} />
          )}

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
              {isTimeLimit ? "Time Left" : "Time"}
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: "700",
                color: isTimeLimit ? "#f59e0b" : "#fff",
              }}
            >
              {isTimeLimit ? getCountdownTime() : formatTime(elapsedSeconds)}
            </Text>
            {isTimeLimit && (
              <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                Target: {formatTime(target)}
              </Text>
            )}
          </View>
        </View>

        {/* Control buttons row */}
        <View
          style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}
        >
          <TouchableOpacity
            onPress={togglePause}
            style={{
              backgroundColor: "#222",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
            activeOpacity={0.7}
          >
            {isPaused ? (
              <>
                <Play color="#fff" size={16} fill="#fff" />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                >
                  Resume
                </Text>
              </>
            ) : (
              <>
                <Pause color="#fff" size={16} fill="#fff" />
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
                >
                  Pause
                </Text>
              </>
            )}
          </TouchableOpacity>

          {(limitType === "none" ||
            (isRepLimit && totalAttempted < target) ||
            (isTimeLimit && elapsedSeconds < target)) && (
            <TouchableOpacity
              onPress={handleFinishEarly}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
              activeOpacity={0.7}
            >
              <StopCircle color="#fff" size={16} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                Finish
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Button Area */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          justifyContent: "center",
        }}
      >
        {trackingMode === "success_fail" && (
          <View style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={handleTick}
              disabled={isPaused || showAlarm}
              style={{
                flex: 1,
                backgroundColor: isPaused || showAlarm ? "#1a3a2a" : "#10b981",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                opacity: isPaused || showAlarm ? 0.5 : 1,
              }}
              activeOpacity={0.8}
            >
              <Check color="#fff" size={80} strokeWidth={3} />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#fff",
                  marginTop: 12,
                }}
              >
                Success
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleX}
              disabled={isPaused || showAlarm}
              style={{
                flex: 1,
                backgroundColor: isPaused || showAlarm ? "#3a1a1a" : "#ef4444",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                opacity: isPaused || showAlarm ? 0.5 : 1,
              }}
              activeOpacity={0.8}
            >
              <X color="#fff" size={80} strokeWidth={3} />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#fff",
                  marginTop: 12,
                }}
              >
                Miss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {trackingMode === "left_right" && (
          <View style={{ gap: 12 }}>
            {/* Left Foot Row */}
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Left Foot: {leftSuccessful}/{leftAttempted}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleLeftSuccess}
                  disabled={isPaused || showAlarm}
                  style={{
                    flex: 1,
                    backgroundColor:
                      isPaused || showAlarm ? "#1a3a2a" : "#10b981",
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                    opacity: isPaused || showAlarm ? 0.5 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  <Check color="#fff" size={50} strokeWidth={3} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLeftMiss}
                  disabled={isPaused || showAlarm}
                  style={{
                    flex: 1,
                    backgroundColor:
                      isPaused || showAlarm ? "#3a1a1a" : "#ef4444",
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                    opacity: isPaused || showAlarm ? 0.5 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  <X color="#fff" size={50} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Foot Row */}
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Right Foot: {rightSuccessful}/{rightAttempted}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleRightSuccess}
                  disabled={isPaused || showAlarm}
                  style={{
                    flex: 1,
                    backgroundColor:
                      isPaused || showAlarm ? "#1a3a2a" : "#10b981",
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                    opacity: isPaused || showAlarm ? 0.5 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  <Check color="#fff" size={50} strokeWidth={3} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRightMiss}
                  disabled={isPaused || showAlarm}
                  style={{
                    flex: 1,
                    backgroundColor:
                      isPaused || showAlarm ? "#3a1a1a" : "#ef4444",
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                    opacity: isPaused || showAlarm ? 0.5 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  <X color="#fff" size={50} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {trackingMode === "reps_only" && (
          <TouchableOpacity
            onPress={handleRepIncrement}
            disabled={isPaused || showAlarm}
            style={{
              backgroundColor: isPaused || showAlarm ? "#1a3a5a" : "#3b82f6",
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
              opacity: isPaused || showAlarm ? 0.5 : 1,
            }}
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={100} strokeWidth={3} />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#fff",
                marginTop: 16,
              }}
            >
              Add Rep
            </Text>
          </TouchableOpacity>
        )}

        {trackingMode === "time_only" && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 100,
            }}
          >
            <Text style={{ fontSize: 18, color: "#666", textAlign: "center" }}>
              Timer is running...
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#444",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Tap "Finish" when done
            </Text>
          </View>
        )}
      </View>

      {/* Alarm Modal */}
      <Modal visible={showAlarm} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 24,
              padding: 32,
              width: "100%",
              maxWidth: 400,
              borderWidth: 2,
              borderColor: "#3b82f6",
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#fff",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Drill Complete!
            </Text>

            <View style={{ marginBottom: 24 }}>
              {!isTimeOnly && !isRepsOnly && (
                <View
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#888",
                      marginBottom: 4,
                      textAlign: "center",
                    }}
                  >
                    Success Rate
                  </Text>
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: "700",
                      color: "#10b981",
                      textAlign: "center",
                    }}
                  >
                    {totalAttempted > 0
                      ? ((totalSuccessful / totalAttempted) * 100).toFixed(0)
                      : 0}
                    %
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 12 }}>
                {!isTimeOnly && (
                  <>
                    {!isRepsOnly && (
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "#1a1a1a",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#888",
                            marginBottom: 4,
                            textAlign: "center",
                          }}
                        >
                          Successful
                        </Text>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "#fff",
                            textAlign: "center",
                          }}
                        >
                          {totalSuccessful}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#1a1a1a",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#888",
                          marginBottom: 4,
                          textAlign: "center",
                        }}
                      >
                        {isRepsOnly ? "Reps" : "Total"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: "700",
                          color: "#fff",
                          textAlign: "center",
                        }}
                      >
                        {totalAttempted}
                      </Text>
                    </View>
                  </>
                )}

                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#888",
                      marginBottom: 4,
                      textAlign: "center",
                    }}
                  >
                    Time
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: "#fff",
                      textAlign: "center",
                    }}
                  >
                    {formatTime(elapsedSeconds)}
                  </Text>
                </View>
              </View>

              {isLeftRight && (
                <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#888",
                        marginBottom: 4,
                        textAlign: "center",
                      }}
                    >
                      Left
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      {leftSuccessful}/{leftAttempted}
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#888",
                        marginBottom: 4,
                        textAlign: "center",
                      }}
                    >
                      Right
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      {rightSuccessful}/{rightAttempted}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleDone}
              disabled={saving}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#fff" }}>
                {saving ? "Saving..." : "Done"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
