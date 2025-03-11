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
  Text,
  Platform
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"

// Custom Components
import { ThemedText } from "../components/ThemedText"
import { ThemedView } from "../components/ThemedView"
// Constants
import { Colors } from "../constants/Colors"

// Types
interface Meeting {
  id: string
  title: string
  timestamp: string
  duration: number
  transcript?: string
  summary?: string
  hasTranscript: boolean
  audioUrl?: string
}

interface TranscriptDrawerProps {
  meeting: Meeting | null
  isVisible: boolean
  onClose: () => void
}

const { height } = Dimensions.get("window")
const DRAWER_MIN_HEIGHT = 100
const DRAWER_MAX_HEIGHT = height * 0.9
const SNAP_POINTS = [DRAWER_MIN_HEIGHT, height * 0.5, DRAWER_MAX_HEIGHT]

const TranscriptDetailDrawer: React.FC<TranscriptDrawerProps> = ({
  meeting,
  isVisible,
  onClose
}) => {
  // Animation refs and state
  const translateY = useRef(new Animated.Value(height)).current
  const [activeTab, setActiveTab] = useState("transcript")
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(meeting?.duration || 0)
  
  // Open/close drawer animations
  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: height - DRAWER_MAX_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start()
    } else {
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start()
    }
  }, [isVisible, translateY])

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

  // Format time for audio player
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
  }

  // Play/pause toggle handler
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    // Here you would add actual audio playback logic
  }

  // Audio seek handler
  const handleSeek = (value: number) => {
    setCurrentTime(value)
    // Here you would add actual audio seeking logic
  }

  if (!meeting) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
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
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentInner}>
        {activeTab === "transcript" && (
          <ThemedText style={styles.transcriptText}>
            {meeting.transcript || "Transcript not available"}
          </ThemedText>
        )}
        
        {activeTab === "summary" && (
          <ThemedText style={styles.summaryText}>
            {meeting.summary || "Summary not available"}
          </ThemedText>
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

      {/* Audio Player */}
      <View style={styles.audioPlayer}>
        <View style={styles.progressContainer}>
          <ThemedText style={styles.timeText}>{formatTime(currentTime)}</ThemedText>
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            minimumTrackTintColor={Colors.tint}
            maximumTrackTintColor="#D1D1D1"
            thumbTintColor={Colors.tint}
            onValueChange={handleSeek}
          />
          <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for bottom safe area
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
    paddingBottom: 100, // Extra padding at the bottom to avoid content being hidden behind audio player
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
  audioPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for bottom safe area
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  progressBar: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: Colors.icon,
    width: 35,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.tint,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
  },
});

export default TranscriptDetailDrawer;