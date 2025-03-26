"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
  Text,
  Pressable
} from "react-native"
import * as Clipboard from "expo-clipboard"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRoute, useFocusEffect, useNavigation, useIsFocused } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Custom Components
import { ThemedText } from "../../components/ThemedText"
import { ThemedView } from "../../components/ThemedView"
import TranscriptCard from "@/components/NotesCard"
import TranscriptDetailDrawer from  "@/components/TranscriptDrawer"

// Constants
import { Colors } from "../../constants/Colors"
import { getSummary } from "@/lib/summurize"
import { Meeting } from "../../app/types/navigation";

const MEETINGS_STORAGE_KEY = "@recap_ai_meetings"

export default function TranscriptPage() {
  // State Management
  const route = useRoute()
  const [searchQuery, setSearchQuery] = useState("")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // Update Meeting
  const updateMeeting = async (updatedMeeting: Meeting) => {
    setMeetings(
      meetings.map((meeting) =>
        meeting.id === updatedMeeting.id ? updatedMeeting : meeting
      )
    );
    setSelectedMeeting(updatedMeeting); // Update selectedMeeting state
    try {
      await AsyncStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(
        meetings.map((meeting) =>
          meeting.id === updatedMeeting.id ? updatedMeeting : meeting
        )
      ));
    } catch (error) {
      console.error("Failed to save meetings:", error);
      Alert.alert("Error", "Could not save meetings");
    }
  };

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
        handleMeetingSelect(meeting)
      }
    }
  }, [route.params, meetings]);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (!isFocused) {
        setSelectedMeeting(null);
      }
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  // Load Meetings from Storage
  const loadMeetings = async () => {
    try {
      setRefreshing(true)
      const storedMeetings = await AsyncStorage.getItem(MEETINGS_STORAGE_KEY)
      if (storedMeetings) {
        let allMeetings = JSON.parse(storedMeetings)
        
        // Ensure that meetings have the 'summary' property
        allMeetings = allMeetings.map((meeting: Meeting) => ({
          ...meeting,
          summary: meeting.summary || "", // Default to empty string if undefined
        }));

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

  // Refresh Meetings
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadMeetings()
  }, [])

  // Handle Meeting Selection
  const handleMeetingSelect = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setIsDrawerVisible(true)
  }

  // Close Drawer
  const handleCloseDrawer = () => {
    setIsDrawerVisible(false)
    // Optional: Reset after animation completes
    setTimeout(() => {
      setSelectedMeeting(null)
    }, 300)
  }

  // Filter Meetings
  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Meeting Notes</ThemedText>
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
            <Pressable
              key={meeting.id}
              onPress={() => handleMeetingSelect(meeting)}
            >
              <TranscriptCard
                meeting={meeting}
                transcribeMeeting={() => {}}
                transcribingId={null}
              />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Transcript Detail Drawer */}
      {selectedMeeting && (
        <TranscriptDetailDrawer
          meeting={selectedMeeting}
          isVisible={isDrawerVisible}
          onClose={handleCloseDrawer}
          updateMeeting={updateMeeting}
        />
      )}
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
    fontSize: 20,
    fontWeight: "600",
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