import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Share as RNShare, Clipboard, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';

interface Transcript {
  id: number;
  title: string;
  timestamp: string;
  preview: string;
  content: string;
}

export default function SummariesScreen() {
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();

  const transcripts: Transcript[] = [
    {
      id: 1,
      title: "Team Sync #1 Transcript",
      timestamp: "Today, 2:00 PM",
      preview: "John: Let's review our Q4 goals. Sarah: We need to focus on increasing user engagement...",
      content: "John: Let's review our Q4 goals.\nSarah: We need to focus on increasing user engagement. Our current metrics show a decline in daily active users.\nJohn: Good point. What's our target for Q4?\nSarah: We should aim for a 15% increase in DAU and improve session duration by 20%.\nMark: I think we also need to consider improving our onboarding flow to reduce drop-offs.\nJohn: Agreed. Let's make that a priority for the next sprint."
    },
    {
      id: 2,
      title: "Team Sync #2 Transcript",
      timestamp: "Today, 3:30 PM",
      preview: "Lisa: Let's go through the product roadmap. David: We need to push back the analytics...",
      content: "Lisa: Let's go through the product roadmap for the next quarter.\nDavid: We need to push back the analytics dashboard release. The engineering team is still working on fixing some critical bugs.\nLisa: How long of a delay are we looking at?\nDavid: Probably two weeks. We want to make sure it's stable before shipping.\nEmma: While we're waiting on that, should we prioritize the mobile app improvements?\nLisa: Yes, let's shift focus to the mobile experience and get that ready for release on schedule."
    },
    {
      id: 3,
      title: "Team Sync #3 Transcript",
      timestamp: "Today, 4:45 PM",
      preview: "Mark: What are our priorities for this sprint? Julia: We need to finish the authentication...",
      content: "Mark: What are our priorities for this sprint?\nJulia: We need to finish the authentication workflow and implement the password reset functionality.\nMark: What's the current status?\nJulia: The login and registration flows are complete, but we still need to implement the email verification process.\nAlex: I've started working on the password reset flow. Should be done by Thursday.\nMark: Great. Let's also make sure we have comprehensive test coverage for these security features."
    }
  ];

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied", "Content copied to clipboard");
  };

  const shareTranscript = async (transcript: Transcript) => {
    try {
      await RNShare.share({
        message: `${transcript.title}\n${transcript.timestamp}\n\n${transcript.content}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share content");
    }
  };

  const viewTranscript = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTranscript(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Summaries</ThemedText>
      </View>

      <ScrollView style={styles.transcriptList}>
        {transcripts.map((transcript) => (
          <ThemedView 
            key={transcript.id} 
            style={styles.transcriptCard}
            lightColor={Colors.light.cardBackground}
            darkColor={Colors.dark.cardBackground}
          >
            <ThemedText style={styles.transcriptTitle}>{transcript.title}</ThemedText>
            <ThemedText style={styles.transcriptTimestamp}>{transcript.timestamp}</ThemedText>
            <ThemedText style={styles.transcriptPreview} numberOfLines={2}>{transcript.preview}</ThemedText>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                onPress={() => copyToClipboard(transcript.content)}
              >
                <ThemedText style={styles.buttonText}>Copy</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                onPress={() => shareTranscript(transcript)}
              >
                <ThemedText style={styles.buttonText}>Share</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                onPress={() => viewTranscript(transcript)}
              >
                <ThemedText style={styles.buttonText}>View</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        ))}
      </ScrollView>

      {/* Transcript Detail Modal */}
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
                {selectedTranscript?.title}
              </ThemedText>
              <ThemedText style={styles.modalTimestamp}>
                {selectedTranscript?.timestamp}
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.transcriptContent}>
                {selectedTranscript?.content}
              </ThemedText>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme === 'dark' ? Colors.dark.cardBackground : Colors.light.cardBackground }]}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => selectedTranscript && copyToClipboard(selectedTranscript.content)}
              >
                <ThemedText style={styles.modalButtonText}>Copy</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => selectedTranscript && shareTranscript(selectedTranscript)}
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
});