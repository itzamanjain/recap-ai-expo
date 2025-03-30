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
  Text,
  KeyboardAvoidingView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { TextInput } from "react-native";
import Slider from "@react-native-community/slider"

// Custom Components
import { ThemedText } from "../components/ThemedText"
import { askAi } from "../lib/aichat"
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
  icon?: string
  addons?: string
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

const YTSummuryDrawer: React.FC<TranscriptDrawerProps> = ({
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
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [displayNotes, setDisplayNotes] = useState(meeting.addons || "");
  const chatScrollRef = useRef<ScrollView>(null);

  const handleSendQuestion = async () => {
    if (!meeting.transcript || !question)
    {
      return;
    }
    try {
      // Add user question to chat history immediately
      setChatHistory((prev) => [
        ...prev,
        { text: question, isUser: true },
        { text: "Getting your answer...", isUser: false },
      ]);

      // Scroll to bottom after adding new messages
      chatScrollRef.current?.scrollToEnd({ animated: true });

      const aiResponse = await askAi(meeting.transcript, question);

      // Update chat history with the actual response
      setChatHistory((prev) => {
        const newHistory = [...prev];
        // Replace the last message ("Getting your answer...") with the actual response
        newHistory[newHistory.length - 1] = { text: aiResponse, isUser: false };
        return newHistory;
      });

      setQuestion("");

      // Scroll to bottom after adding new messages
      chatScrollRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Failed to get AI response:", error);

      // If there was an error, remove the "Getting your answer..." message
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop();
        return newHistory;
      });
    }
  };


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
      // Display an error message to the user
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Scroll to bottom when chat history changes
  useEffect(() => {
    if (activeTab === "chat" && chatHistory.length > 0) {
      chatScrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [chatHistory, activeTab]);

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
        <TouchableOpacity
          style={[styles.tab, activeTab === "addons" && styles.activeTab]}
          onPress={() => setActiveTab("addons")}
        >
          <ThemedText style={[styles.tabText, activeTab === "addons" && styles.activeTabText]}>
            Add Ons
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentWrapper}>
        {activeTab === "transcript" && (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.contentInner}
          >
            <ThemedText style={styles.transcriptText}>
              {meeting.transcript || "Transcript not available"}
            </ThemedText>
          </ScrollView>
        )}

        {activeTab === "summary" && (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.contentInner}
          >
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
          </ScrollView>
        )}

        {activeTab === "chat" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.chatMainContainer}
          >
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatHistoryContainer}
              contentContainerStyle={styles.chatHistoryContent}
            >
              {chatHistory.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.chatMessage,
                    message.isUser ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chatMessageText,
                      message.isUser ? styles.userMessageText : styles.botMessageText,
                    ]}
                  >
                    {message.text}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>

            {/* Chat input box - now outside of ScrollView and sticky at bottom */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask a question about the transcript"
                placeholderTextColor={Colors.icon}
                value={question}
                onChangeText={setQuestion}
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={handleSendQuestion}
              >
                <Ionicons name="send" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {activeTab === "addons" && (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.contentInner}
          >
            <ThemedText style={styles.addonsheading}>
              Extra Notes Here : 
            </ThemedText>
            {displayNotes ? (
              <ThemedText style={styles.transcriptText}>
                {displayNotes}
              </ThemedText>
            ) : null}
           
          </ScrollView>
        )}
      </View>
       {/* Add Notes input box - now outside of ScrollView and sticky at bottom */}
       {activeTab === "addons" && (
        <View style={styles.addNotesContainer}>
          <TextInput
            style={styles.addNotesInput}
            placeholder="Enter your notes"
            placeholderTextColor={Colors.icon}
            multiline={true}
            numberOfLines={4}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
            }}
          />
          <TouchableOpacity
            onPress={() => {
              setIsSaving(true);
              const newAddons = meeting.addons ? meeting.addons + "\n" + notes : notes;
              const updatedMeeting = { ...meeting, addons: newAddons };
              updateMeeting(updatedMeeting);
              setDisplayNotes(newAddons); // Update displayNotes state
              setIsSaving(false);
              setNotes(""); // Clear notes input
            }}
            style={styles.addImageButton}
            disabled={isSaving || !notes}
          >
            <Text style={styles.addImageButtonText}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

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
  addonsheading:{
      fontSize: 20,
      fontWeight: '600',
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
  contentWrapper: {
    flex: 1,
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
  chatMainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHistoryContainer: {
    flex: 1,
  },
  chatHistoryContent: {
    padding: 20,
    paddingBottom: TAB_BAR_HEIGHT + 60,
  },
  chatInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    color:'red',
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT,
  
    backgroundColor: "#FFFFFF",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.icon,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: Colors.text,
  },
  chatSendButton: {
    backgroundColor: Colors.tint,
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatMessage: {
    maxWidth: "80%",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: Colors.tint,
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: Colors.cardBackground,
    alignSelf: "flex-start",
  },
  chatMessageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: Colors.text,
  },
  chatResponse: {
    fontSize: 16,
    lineHeight: 24,
  },
  addNotesInput: {
    borderWidth: 1,
    borderColor: Colors.icon,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop:40,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  addImageButton: {
    backgroundColor: Colors.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addImageButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  addNotesContainer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingVertical: 28,
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT,
    backgroundColor: "#FFFFFF",
    left: 0,
    right: 0,
  },
});

export default YTSummuryDrawer;