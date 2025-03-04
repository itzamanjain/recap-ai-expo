"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform
} from "react-native"
import * as Clipboard from "expo-clipboard"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRoute, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Custom Components
import { ThemedText } from "../../components/ThemedText"
import { ThemedView } from "../../components/ThemedView"

// Constants
import { Colors } from "../../constants/Colors"
import { getSummary } from "@/lib/summurize"

// Types
interface Meeting {
  id: string
  title: string
  timestamp: string
  duration: number
  transcript?: string
  summary?: string
  hasTranscript: boolean
}

// Mock Summary Generation Function (Replace with actual implementation)


const MEETINGS_STORAGE_KEY = "@recap_ai_meetings"

export default function TranscriptPage() {
  // State Management
  const route = useRoute()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [summaryModalVisible, setSummaryModalVisible] = useState(false)
  const [currentSummary, setCurrentSummary] = useState<string>("")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMeetingId, setLoadingMeetingId] = useState<string | null>(null)

  // Load Meetings on Focus
  useFocusEffect(
    useCallback(() => {
      loadMeetings()
    }, [])
  )

  // Handle Route Params
  useEffect(() => {
    const params = route.params as { meetingId?: string }
    if (params?.meetingId) {
      const meeting = meetings.find((m) => m.id === params.meetingId)
      if (meeting?.transcript) {
        setSelectedMeeting(meeting)
      }
    }
  }, [route.params, meetings])

  // Load Meetings from Storage
  const loadMeetings = async () => {
    try {
      setRefreshing(true)
      const storedMeetings = await AsyncStorage.getItem(MEETINGS_STORAGE_KEY)
      if (storedMeetings) {
        const allMeetings = JSON.parse(storedMeetings)
        const meetingsWithTranscripts = allMeetings.filter(
          (m: Meeting) => m.hasTranscript && m.transcript
        )
        setMeetings(meetingsWithTranscripts)
      }
    } catch (error) {
      console.error("Failed to load meetings:", error)
      Alert.alert("Error", "Could not load meetings")
    } finally {
      setRefreshing(false)
    }
  }

  // Generate Meeting Summary
  const viewSummary = async (meeting: Meeting) => {
    const transcript = meeting.transcript
    if (!transcript) return

    try {
      setLoadingMeetingId(meeting.id)
      const summary = await getSummary(transcript)
      
      setCurrentSummary(summary)
      setSummaryModalVisible(true)

      // Update meeting with summary
      const updatedMeeting = { ...meeting, summary }
      const updatedMeetings = meetings.map((m) => 
        m.id === meeting.id ? updatedMeeting : m
      )
      setMeetings(updatedMeetings)

      // Persist updated meetings
      await AsyncStorage.setItem(
        MEETINGS_STORAGE_KEY, 
        JSON.stringify(updatedMeetings)
      )
    } catch (error) {
      console.error("Failed to generate summary:", error)
      Alert.alert("Error", "Could not generate summary")
    } finally {
      setLoadingMeetingId(null)
    }
  }

  // Refresh Meetings
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadMeetings()
  }, [])

  // Format Meeting Duration
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return "00:00"
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0")
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

  // Filter Meetings
  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // View Full Transcript
  const viewFullTranscript = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setModalVisible(true)
  }

  // Close Modals
  const closeModal = () => setModalVisible(false)
  const closeSummaryModal = () => {
    setSummaryModalVisible(false)
    setCurrentSummary("")
  }

  // Copy Summary to Clipboard
  const copySummaryToClipboard = async () => {
    await Clipboard.setString(currentSummary)
    Alert.alert("Copied", "Summary copied to clipboard")
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Transcripts</ThemedText>
      </View>

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={Colors.icon} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transcripts..."
            placeholderTextColor={Colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={Colors.icon} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Meetings List */}
      <ScrollView
        style={styles.transcriptList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.tint]}
            tintColor={Colors.tint}
          />
        }
      >
        {filteredMeetings.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons 
              name="document-text-outline" 
              size={48} 
              color={Colors.text} 
            />
            <ThemedText style={styles.emptyStateText}>
              No transcripts available
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Generate transcripts from your recordings in the Recent Meetings section
            </ThemedText>
          </ThemedView>
        ) : (
          filteredMeetings.map((meeting) => (
            <ThemedView
              key={meeting.id}
              style={styles.transcriptCard}
              lightColor="#FFF5EB"
            >
              {/* Meeting Header */}
              <View style={styles.transcriptHeader}>
                <View>
                  <ThemedText style={styles.transcriptTitle}>
                    {meeting.title}
                  </ThemedText>
                  <ThemedText style={styles.transcriptTime}>
                    {meeting.timestamp}
                  </ThemedText>
                </View>
                <ThemedText style={styles.transcriptDuration}>
                  Duration: {formatTime(meeting.duration)}
                </ThemedText>
              </View>

              {/* Transcript Preview */}
              <ThemedText 
                style={styles.transcriptSummary} 
                numberOfLines={3}
              >
                {meeting.transcript}
              </ThemedText>

              {/* Action Buttons */}
              <View style={styles.buttonsSideBySide}>
                <TouchableOpacity
                  style={[styles.readFullButton, { backgroundColor: "#FFE0CC" }]}
                  onPress={() => viewFullTranscript(meeting)}
                >
                  <ThemedText style={[styles.readFullText, { color: "#333333" }]}>
                    Read Full
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.readFullButton, { backgroundColor: "#FFE0CC" }]}
                  onPress={() => viewSummary(meeting)}
                  disabled={loadingMeetingId === meeting.id}
                >
                  {loadingMeetingId === meeting.id ? (
                    <ActivityIndicator size="small" color="#333333" />
                  ) : (
                    <ThemedText style={[styles.readFullText, { color: "#333333" }]}>
                      Read Summary
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))
        )}
      </ScrollView>

      {/* Full Transcript Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={modalVisible} 
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent} lightColor="#FFFFFF">
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>
                  {selectedMeeting?.title}
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedMeeting?.timestamp} • Duration: {formatTime(selectedMeeting?.duration || 0)}
                </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeModal}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.fullTranscriptText}>
                {selectedMeeting?.transcript}
              </ThemedText>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={summaryModalVisible} 
        onRequestClose={closeSummaryModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent} lightColor="#FFFFFF">
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>
                  Meeting Summary
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  Your meeting summary & action items
                </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeSummaryModal}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.fullTranscriptText}>
                {currentSummary}
              </ThemedText>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: "#EEEEEE" }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#FFE0CC" }]}
                onPress={copySummaryToClipboard}
              >
                <ThemedText style={[styles.modalButtonText, { color: "#333333" }]}>
                  Copy Summary
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  )
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    padding: 0,
  },
  transcriptList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transcriptCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transcriptTime: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  transcriptDuration: {
    fontSize: 14,
    opacity: 0.7,
  },
  transcriptSummary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  buttonsSideBySide: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  readFullButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  readFullText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    opacity: 0.6,
  },
  modalBody: {
    marginBottom: 16,
    maxHeight: "70%",
  },
  fullTranscriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: Colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 12,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
  },
})
