import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Modal, useColorScheme, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';
import { Meeting } from '@/app/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MEETINGS_STORAGE_KEY = '@recap_ai_meetings';

export default function TranscriptPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { theme } = useTheme();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load meetings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMeetings();
    }, [])
  );

  // Handle meetingId from navigation params
  useEffect(() => {
    const params = route.params as { meetingId?: string };
    if (params?.meetingId) {
      const meeting = meetings.find(m => m.id === params.meetingId);
      if (meeting?.transcript) {
        setSelectedMeeting(meeting);
        setModalVisible(true);
      }
    }
  }, [route.params, meetings]);

  const loadMeetings = async () => {
    try {
      const storedMeetings = await AsyncStorage.getItem(MEETINGS_STORAGE_KEY);
      if (storedMeetings) {
        const allMeetings = JSON.parse(storedMeetings);
        // Only show meetings that have transcripts
        const meetingsWithTranscripts = allMeetings.filter((m: Meeting) => m.hasTranscript && m.transcript);
        console.log('Meetings with transcripts:', meetingsWithTranscripts.length);
        setMeetings(meetingsWithTranscripts);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadMeetings();
  }, []);

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewFullTranscript = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMeeting(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Transcripts</ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          { backgroundColor: isDark ? Colors.dark.cardBackground : '#FFF5EB' }
        ]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isDark ? '#777777' : '#999999'} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}
            placeholder="Search transcripts..."
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={isDark ? '#777777' : '#999999'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transcript List */}
      <ScrollView 
        style={styles.transcriptList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor={isDark ? '#FFFFFF' : '#FF6B00'}
          />
        }
      >
        {filteredMeetings.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons 
              name="document-text-outline" 
              size={48} 
              color={isDark ? Colors.dark.text : Colors.light.text} 
            />
            <ThemedText style={styles.emptyStateText}>No transcripts available</ThemedText>
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
              darkColor={Colors.dark.cardBackground}
            >
              <View style={styles.transcriptHeader}>
                <View>
                  <ThemedText style={styles.transcriptTitle}>{meeting.title}</ThemedText>
                  <ThemedText style={styles.transcriptTime}>{meeting.timestamp}</ThemedText>
                </View>
                <ThemedText style={styles.transcriptDuration}>
                  Duration: {formatTime(meeting.duration)}
                </ThemedText>
              </View>
              
              <ThemedText 
                style={styles.transcriptSummary} 
                numberOfLines={3}
              >
                {meeting.transcript}
              </ThemedText>
              
              <TouchableOpacity 
                style={[
                  styles.readFullButton,
                  { backgroundColor: isDark ? '#FF5722' : '#FFE0CC' }
                ]}
                onPress={() => viewFullTranscript(meeting)}
              >
                <ThemedText style={[
                  styles.readFullText,
                  { color: isDark ? '#FFFFFF' : '#333333' }
                ]}>
                  Read Full
                </ThemedText>
              </TouchableOpacity>
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
          <ThemedView
            style={styles.modalContent}
            lightColor="#FFFFFF"
            darkColor={Colors.dark.cardBackground}
          >
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>{selectedMeeting?.title}</ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedMeeting?.timestamp} • Duration: {formatTime(selectedMeeting?.duration || 0)}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
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
    </ThemedView>
  );
}

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
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  transcriptList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  transcriptCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  readFullButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  readFullText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  modalBody: {
    maxHeight: '90%',
  },
  fullTranscriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
});