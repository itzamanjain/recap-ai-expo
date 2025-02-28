import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Share as RNShare, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';
import { Meeting } from '@/app/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const MEETINGS_STORAGE_KEY = '@recap_ai_meetings';

export default function SummariesScreen() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const storedMeetings = await AsyncStorage.getItem(MEETINGS_STORAGE_KEY);
      if (storedMeetings) {
        const allMeetings = JSON.parse(storedMeetings);
        // Only show meetings that have summaries
        const meetingsWithSummaries = allMeetings.filter((m: Meeting) => m.summary);
        setMeetings(meetingsWithSummaries);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Content copied to clipboard");
  };

  const shareSummary = async (meeting: Meeting) => {
    try {
      await RNShare.share({
        message: `${meeting.title}\n${meeting.timestamp}\n\nSummary:\n${meeting.summary}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share content");
    }
  };

  const viewSummary = (meeting: Meeting) => {
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
        <ThemedText style={styles.headerTitle}>Summaries</ThemedText>
      </View>

      <ScrollView style={styles.transcriptList}>
        {meetings.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No summaries available</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Generate summaries from your transcripts in the Transcripts section
            </ThemedText>
          </ThemedView>
        ) : (
          meetings.map((meeting) => (
            <ThemedView
              key={meeting.id}
              style={styles.transcriptCard}
              lightColor={Colors.light.cardBackground}
              darkColor={Colors.dark.cardBackground}
            >
              <ThemedText style={styles.transcriptTitle}>{meeting.title}</ThemedText>
              <ThemedText style={styles.transcriptTimestamp}>{meeting.timestamp}</ThemedText>
              <ThemedText style={styles.transcriptPreview} numberOfLines={3}>
                {meeting.summary}
              </ThemedText>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                  onPress={() => meeting.summary && copyToClipboard(meeting.summary)}
                >
                  <ThemedText style={styles.buttonText}>Copy</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                  onPress={() => shareSummary(meeting)}
                >
                  <ThemedText style={styles.buttonText}>Share</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                  onPress={() => viewSummary(meeting)}
                >
                  <ThemedText style={styles.buttonText}>View</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))
        )}
      </ScrollView>

      {/* Summary Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={styles.modalContent}
            lightColor={Colors.light.background}
            darkColor={Colors.dark.background}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? Colors.dark.cardBackground : Colors.light.cardBackground }]}>
              <ThemedText style={styles.modalTitle}>
                {selectedMeeting?.title}
              </ThemedText>
              <ThemedText style={styles.modalTimestamp}>
                {selectedMeeting?.timestamp}
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.transcriptContent}>
                {selectedMeeting?.summary}
              </ThemedText>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme === 'dark' ? Colors.dark.cardBackground : Colors.light.cardBackground }]}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => selectedMeeting?.summary && copyToClipboard(selectedMeeting.summary)}
              >
                <ThemedText style={styles.modalButtonText}>Copy</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => selectedMeeting && shareSummary(selectedMeeting)}
              >
                <ThemedText style={styles.modalButtonText}>Share</ThemedText>
              </TouchableOpacity>
            </View>
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
  transcriptList: {
    flex: 1,
    padding: 16,
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
  transcriptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transcriptTimestamp: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  transcriptPreview: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginRight: 8,
  },
  buttonText: {
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
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTimestamp: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  modalBody: {
    marginBottom: 16,
    maxHeight: '70%',
  },
  transcriptContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
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
});