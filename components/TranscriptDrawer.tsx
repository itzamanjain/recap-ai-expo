"use client"
import React, { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Text
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"

// Custom Components
import { ThemedText } from "../components/ThemedText"
import { getSummary } from "../lib/summurize"
import { ThemedView } from "../components/ThemedView"
// Constants
import { Colors } from "../constants/Colors"

// Types
interface Meeting {
  id: string
  title: string
  timestamp: string
  uri: string  // Updated to match the interface
  duration: number
  language?: string
  hasTranscript: boolean
  transcript?: string
  summary?: string
}

interface TranscriptDrawerProps {
  meeting: Meeting
  isVisible: boolean
  onClose: () => void
  updateMeeting: (updatedMeeting: Meeting) => void;
}

const { height } = Dimensions.get("window")
const DRAWER_MIN_HEIGHT = 100
const DRAWER_MAX_HEIGHT = height * 0.9
const SNAP_POINTS = [DRAWER_MIN_HEIGHT, height * 0.5, DRAWER_MAX_HEIGHT]
// Define tab bar height based on platform
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 56

const TranscriptDetailDrawer: React.FC<TranscriptDrawerProps> = ({
  meeting,
  isVisible,
  onClose,
  updateMeeting
}) => {
  // Animation refs and state
  const translateY = useRef(new Animated.Value(height)).current
  const [activeTab, setActiveTab] = useState("transcript");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(meeting.summary || "");

  // Open/close drawer animations
  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: height - DRAWER_MAX_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start()
      
      // Load audio when drawer becomes visible
    } else {
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start()
    }
  }, [isVisible, translateY, meeting])

  // Handle drawer drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = height - DRAWER_MAX_HEIGHT + gestureState.dy
        if (newPosition >= height - DRAWER_MAX_HEIGHT && newPosition <= height - DRAWER_MIN_HEIGHT) {
          translateY.setValue(newPosition)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = height - DRAWER_MAX_HEIGHT + gestureState.dy
        
        // Calculate closest snap point
        let snapTo = SNAP_POINTS[0]
        let minDistance = Math.abs(height - snapTo - currentPosition)
        
        SNAP_POINTS.forEach(point => {
          const distance = Math.abs(height - point - currentPosition)
          if (distance < minDistance) {
            minDistance = distance
            snapTo = point
          }
        })
        
        // If user drags up past 90% of screen, close drawer
        if (height - currentPosition < DRAWER_MIN_HEIGHT || gestureState.vy > 1.5) {
          onClose()
          return
        }
        
        Animated.spring(translateY, {
          toValue: height - snapTo,
          useNativeDriver: true,
          tension: 50,
          friction: 12,
        }).start()
      }
    })
  ).current

  // Function to generate summary
  const generateSummary = async () => {
    if (!meeting.transcript) {
      return;
    }
    setIsSummaryLoading(true);
    try {
      const generatedSummary = await getSummary(meeting.transcript);
      setSummary(generatedSummary);
      const updatedMeeting = { ...meeting, summary: generatedSummary };
      updateMeeting(updatedMeeting);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  if (!meeting) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          zIndex: 1000,
        },
      ]}
    >
      {/* Drag Handle */}
      <View 
        style={styles.dragHandleContainer}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title} numberOfLines={1}>{meeting.title}</ThemedText>
          <ThemedText style={styles.timestamp}>{meeting.timestamp}</ThemedText>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transcript" && styles.activeTab]}
          onPress={() => setActiveTab("transcript")}
        >
          <ThemedText style={[styles.tabText, activeTab === "transcript" && styles.activeTabText]}>
            Transcript
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "summary" && styles.activeTab]}
          onPress={() => setActiveTab("summary")}
        >
          <ThemedText style={[styles.tabText, activeTab === "summary" && styles.activeTabText]}>
            Summary
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.activeTab]}
          onPress={() => setActiveTab("chat")}
        >
          <ThemedText style={[styles.tabText, activeTab === "chat" && styles.activeTabText]}>
            AI Chat
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.contentContainer} 
        contentContainerStyle={[
          styles.contentInner,
          { paddingBottom: 120 }
        ]}
      >
        {activeTab === "transcript" && (
          <ThemedText style={styles.transcriptText}>
            {meeting.transcript || "Transcript not available"}
          </ThemedText>
        )}
        
        {activeTab === "summary" && (
          <>
            {summary ? (
              <ThemedText style={styles.summaryText}>
                {summary}
              </ThemedText>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateSummary}
                disabled={isSummaryLoading}
              >
                <ThemedText style={styles.generateButtonText}>
                  {isSummaryLoading ? "Generating..." : "Generate Summary"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {activeTab === "chat" && (
          <View style={styles.chatPlaceholder}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.icon} />
            <ThemedText style={styles.placeholderText}>
              AI Chat with your transcript coming soon!
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  )
}

// Styles
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: DRAWER_MAX_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  dragHandleContainer: {
    width: "100%",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    maxWidth: "90%",
  },
  timestamp: {
    fontSize: 14,
    color: Colors.icon,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.tint,
  },
  tabText: {
    fontSize: 16,
    color: Colors.icon,
  },
  activeTabText: {
    color: Colors.tint,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 100,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  chatPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    color: Colors.icon,
  },
  generateButton: {
    backgroundColor: Colors.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default TranscriptDetailDrawer;