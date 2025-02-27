import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Modal, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';

interface Transcript {
  id: number;
  title: string;
  timestamp: string;
  duration: string;
  summary: string;
  fullContent: string;
}

export default function TranscriptPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Sample transcript data
  const transcripts: Transcript[] = [
    {
      id: 1,
      title: "Team Sync #1",
      timestamp: "Today, 2:00 PM",
      duration: "45:20",
      summary: "Discussed Q4 goals and team metrics. The team reviewed progress on current projects and set priorities for the upcoming quarter. Action items were assigned to team members.",
      fullContent: "John: Welcome everyone to our Q4 planning session.\n\nSarah: Thanks John. I've prepared the metrics from Q3 to guide our discussion.\n\nJohn: Great. Let's start by looking at our current goals and how we're tracking.\n\nSarah: We've achieved 85% of our Q3 targets. The main gap is in the user acquisition area.\n\nMark: I think we need to adjust our marketing strategy. The current campaigns aren't performing as expected.\n\nJohn: Agreed. Let's allocate more resources to channels that are working well.\n\nSarah: Based on the data, social media and content marketing are our best performers.\n\nJohn: Let's increase budget there by 20% and reduce spend on paid search.\n\nMark: I'll update the marketing plan and share it by Friday.\n\nJohn: Great. Now let's discuss product roadmap priorities..."
    },
    {
      id: 2,
      title: "Team Sync #2",
      timestamp: "Today, 3:30 PM",
      duration: "32:15",
      summary: "Product roadmap review. Discussed feature prioritization and timeline adjustments. Decided to push back analytics dashboard to focus on mobile enhancements.",
      fullContent: "Lisa: Let's review the product roadmap for Q4.\n\nDavid: We need to make some adjustments to the timeline based on the feedback from engineering.\n\nLisa: What specifically needs to change?\n\nDavid: The analytics dashboard is taking longer than expected. We're dealing with some data processing challenges.\n\nEmma: How long do we need to delay it?\n\nDavid: At least two weeks. It's better to release it when it's stable.\n\nLisa: That makes sense. Let's prioritize the mobile app enhancements in the meantime.\n\nEmma: I can have the design team focus on finalizing the mobile UI updates.\n\nLisa: Perfect. Let's move forward with that plan and revisit the analytics timeline next week."
    },
    {
      id: 3,
      title: "Team Sync #3",
      timestamp: "Today, 4:45 PM",
      duration: "28:45",
      summary: "Sprint planning session. Assigned tasks for the next two weeks. Discussed blockers and resource allocation for critical feature development.",
      fullContent: "Mark: Welcome to sprint planning. Let's discuss our priorities for the next two weeks.\n\nJulia: The highest priority is finishing the authentication system updates.\n\nMark: What's the current status?\n\nJulia: We've completed about 70% of the work. The main components are in place, but we need to finalize security testing.\n\nAlex: I've been working on the password reset flow and it's almost done.\n\nMark: Great. Let's make sure we allocate enough time for testing.\n\nJulia: I'll need another developer to help with the final implementation.\n\nMark: Alex, can you pair with Julia once you're done with your current task?\n\nAlex: Yes, I should be available by Thursday.\n\nMark: Perfect. Let's also discuss the upcoming feature requests..."
    }
  ];

  const filteredTranscripts = transcripts.filter(transcript => 
    transcript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transcript.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewFullTranscript = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTranscript(null);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? Colors.dark.cardBackground : '#FFF5EB',
              color: isDark ? Colors.dark.text : Colors.light.text,
            }
          ]}
          placeholder="Search recordings..."
          placeholderTextColor={isDark ? '#777' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Transcript List */}
      <ScrollView style={styles.transcriptList}>
        {filteredTranscripts.map((transcript) => (
          <ThemedView
            key={transcript.id}
            style={styles.transcriptCard}
            lightColor="#FFF5EB"
            darkColor={Colors.dark.cardBackground}
          >
            <View style={styles.transcriptHeader}>
              <View>
                <ThemedText style={styles.transcriptTitle}>{transcript.title}</ThemedText>
                <ThemedText style={styles.transcriptTime}>{transcript.timestamp}</ThemedText>
              </View>
              <ThemedText style={styles.transcriptDuration}>Duration: {transcript.duration}</ThemedText>
            </View>
            
            <ThemedText 
              style={styles.transcriptSummary} 
              numberOfLines={3}
            >
              {transcript.summary}
            </ThemedText>
            
            <TouchableOpacity 
              style={[
                styles.readFullButton,
                { backgroundColor: isDark ? '#FF5722' : '#FFE0CC' }
              ]}
              onPress={() => viewFullTranscript(transcript)}
            >
              <ThemedText style={[
                styles.readFullText,
                { color: isDark ? '#FFFFFF' : '#333333' }
              ]}>
                Read Full
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))}
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
                <ThemedText style={styles.modalTitle}>{selectedTranscript?.title}</ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedTranscript?.timestamp} • Duration: {selectedTranscript?.duration}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.fullTranscriptText}>
                {selectedTranscript?.fullContent}
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
    paddingTop: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  transcriptList: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  readFullText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
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