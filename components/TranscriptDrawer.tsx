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
import { Audio } from 'expo-av' // Import Audio from Expo AV

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
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTimeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(meeting?.duration || 0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Ref to keep track of playback position update interval
  const playbackPositionInterval = useRef<NodeJS.Timeout | null>(null);

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
      if (meeting?.uri && !isAudioLoaded && !isLoadingAudio) {
        loadAudio()
      }
    } else {
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start()
      
      // Stop audio when drawer is closed
      if (sound) {
        stopAudio()
      }
    }
  }, [isVisible, translateY, meeting])
  
  // Cleanup audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        stopAudio()
        sound.unloadAsync()
      }
      if (playbackPositionInterval.current) {
        clearInterval(playbackPositionInterval.current)
      }
    }
  }, [sound])
  
  // Load audio file
  const loadAudio = async () => {
    if (!meeting?.uri) return
    
    try {
      setIsLoadingAudio(true)
      
      // Unload any existing sound first
      if (sound) {
        await sound.unloadAsync()
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      })
      
      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: meeting.uri },
        { shouldPlay: false, positionMillis: 0 },
        onPlaybackStatusUpdate
      )
      
      setSound(newSound)
      setIsAudioLoaded(true)
      console.log("Audio loaded successfully")
    } catch (error) {
      console.error("Failed to load audio", error)
    } finally {
      setIsLoadingAudio(false)
    }
  }
  
  // Handle audio playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      currentTimeRef.current = status.positionMillis / 1000;
      setDuration(status.durationMillis / 1000);
      setIsPlaying(status.isPlaying);

      // If the audio has reached the end, reset to beginning
      if (status.didJustFinish) {
        setIsPlaying(false)
        setCurrentTime(0)
        // Reset playback position to beginning
        sound?.setPositionAsync(0)
      }
    }
  }
  
  // Play/pause toggle handler
  const togglePlayback = async () => {
    if (!sound) {
      console.log("No sound loaded")
      return
    }
    
    try {
      if (isPlaying) {
        await sound.pauseAsync()
      } else {
        await sound.playAsync()
      }
    } catch (error) {
      console.error("Error toggling playback", error)
    }
  }
  
  // Stop audio playback
  const stopAudio = async () => {
    if (!sound) return
    
    try {
      await sound.stopAsync()
      setIsPlaying(false)
      setCurrentTime(0)
    } catch (error) {
      console.error("Error stopping audio", error)
    }
  }
  
  // Rewind 10 seconds
  const rewind10Seconds = async () => {
    if (!sound) return
    
    try {
      const newPosition = Math.max(0, currentTime - 10) * 1000
      await sound.setPositionAsync(newPosition)
    } catch (error) {
      console.error("Error rewinding", error)
    }
  }
  
  // Forward 10 seconds
  const forward10Seconds = async () => {
    if (!sound) return
    
    try {
      const newPosition = Math.min(duration, currentTime + 10) * 1000
      await sound.setPositionAsync(newPosition)
    } catch (error) {
      console.error("Error forwarding", error)
    }
  }
  
  // Audio seek handler
  const handleSeek = async (value: number) => {
    if (!sound) return
    
    try {
      await sound.setPositionAsync(value * 1000)
      setCurrentTime(value)
    } catch (error) {
      console.error("Error seeking", error)
    }
  }

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

  // Format time for audio player (mm:ss)
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
  }

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

      {/* Audio Player */}
      <View style={[
        styles.audioPlayer,
        { paddingBottom: Platform.OS === 'ios' ? 34 + TAB_BAR_HEIGHT : 16 + TAB_BAR_HEIGHT }
      ]}>
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
            disabled={!isAudioLoaded}
          />
          <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
        </View>
        
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={rewind10Seconds}
          disabled={!isAudioLoaded}
        >
          <Ionicons name="arrow-back-circle" size={24} color={isAudioLoaded ? Colors.text : Colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playButton,
            !isAudioLoaded && styles.playButtonDisabled
          ]}
          onPress={togglePlayback}
          disabled={!isAudioLoaded || isLoadingAudio}
        >
          {isLoadingAudio ? (
            <Ionicons name="hourglass-outline" size={32} color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={forward10Seconds}
          disabled={!isAudioLoaded}
        >
          <Ionicons name="arrow-forward-circle" size={24} color={isAudioLoaded ? Colors.text : Colors.icon} />
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
  audioPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
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
  playButtonDisabled: {
    backgroundColor: Colors.icon,
  },
  generateButton: {
    backgroundColor: Colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TranscriptDetailDrawer;