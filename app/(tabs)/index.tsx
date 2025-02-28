import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Meeting, RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transcribeUrlDeepgram } from '@/lib/transcribe';

const MEETINGS_STORAGE_KEY = '@recap_ai_meetings';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Load meetings from storage on mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMeetings();
    }, [])
  );

  // Handle new meeting from recording screen
  useEffect(() => {
    const params = route.params as { newMeeting?: Meeting };
    if (params?.newMeeting) {
      addMeeting(params.newMeeting);
      navigation.setParams({ newMeeting: undefined });
    }
  }, [route.params]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadMeetings = async () => {
    try {
      const storedMeetings = await AsyncStorage.getItem(MEETINGS_STORAGE_KEY);
      if (storedMeetings) {
        const parsedMeetings = JSON.parse(storedMeetings);
        console.log('Loaded meetings:', parsedMeetings.length);
        setMeetings(parsedMeetings);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
      Alert.alert('Error', 'Failed to load meetings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadMeetings();
  }, []);

  const addMeeting = async (newMeeting: Meeting) => {
    try {
      const updatedMeetings = [newMeeting, ...meetings];
      setMeetings(updatedMeetings);
      await AsyncStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updatedMeetings));
    } catch (error) {
      console.error('Failed to save meeting:', error);
      Alert.alert('Error', 'Failed to save meeting');
    }
  };

  const updateMeeting = async (updatedMeeting: Meeting) => {
    try {
      const updatedMeetings = meetings.map(meeting => 
        meeting.id === updatedMeeting.id ? updatedMeeting : meeting
      );
      console.log('Updating meetings:', updatedMeetings.length);
      setMeetings(updatedMeetings);
      await AsyncStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updatedMeetings));
    } catch (error) {
      console.error('Failed to update meeting:', error);
      Alert.alert('Error', 'Failed to update meeting');
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      // Stop audio if playing
      if (playingId === meetingId && sound) {
        await sound.unloadAsync();
        setPlayingId(null);
        setSound(null);
      }

      const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId);
      setMeetings(updatedMeetings);
      await AsyncStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updatedMeetings));

      // Delete the audio file
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting?.uri) {
        await FileSystem.deleteAsync(meeting.uri);
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      Alert.alert('Error', 'Failed to delete meeting');
    }
  };

  const startRecording = () => {
    navigation.navigate('(tabs)', { screen: 'record' });
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const playAudio = async (meeting: Meeting) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (playingId === meeting.id) {
        setPlayingId(null);
        setSound(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: meeting.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(meeting.id);

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.error('Failed to play audio:', err);
      Alert.alert('Error', 'Failed to play audio recording. The file may be corrupted or missing.');
    }
  };

  const viewTranscript = async (meeting: Meeting) => {
    try {
      if (!meeting.transcript) {
        setTranscribingId(meeting.id);
        Alert.alert('Generating Transcript', 'Please wait while we process your recording...');
        
        const result = await transcribeUrlDeepgram(meeting.uri);
        if (result?.results?.channels[0]?.alternatives[0]?.transcript) {
          const transcript = result.results.channels[0].alternatives[0].transcript;
          const updatedMeeting = {
            ...meeting,
            transcript,
            hasTranscript: true
          };
          await updateMeeting(updatedMeeting);
          Alert.alert('Success', 'Transcript generated successfully!');
          navigation.navigate('(tabs)', { screen: 'transcripts', params: { meetingId: meeting.id } });
        } else {
          throw new Error('Failed to generate transcript');
        }
      } else {
        navigation.navigate('(tabs)', { screen: 'transcripts', params: { meetingId: meeting.id } });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate transcript. Please try again.'
      );
    } finally {
      setTranscribingId(null);
    }
  };

  const handleEditTitle = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setNewTitle(meeting.title);
  };

  const saveTitle = async () => {
    if (editingMeeting && newTitle.trim()) {
      const updatedMeeting = {
        ...editingMeeting,
        title: newTitle.trim()
      };
      await updateMeeting(updatedMeeting);
      setEditingMeeting(null);
      setNewTitle('');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#FFFFFF' : '#FF6B00'} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.welcomeText}>Welcome to Recap AI</ThemedText>
        <ThemedText style={styles.subtitle}>Your AI meeting assistant</ThemedText>
      </View>

      <View style={styles.sectionContainer}>
        <ThemedText style={styles.sectionTitle}>Recent Meetings</ThemedText>
        
        <ScrollView 
          style={styles.meetingsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B00']}
              tintColor={theme === 'dark' ? '#FFFFFF' : '#FF6B00'}
            />
          }
        >
          {meetings.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="mic-outline" size={48} color={theme === 'dark' ? Colors.dark.text : Colors.light.text} />
              <ThemedText style={styles.emptyStateText}>No recordings yet</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Start recording your first meeting!
              </ThemedText>
            </ThemedView>
          ) : (
            meetings.map((meeting) => (
              <ThemedView
                key={meeting.id}
                style={styles.meetingCard}
                lightColor={Colors.light.cardBackground}
                darkColor={Colors.dark.cardBackground}
              >
                <View style={styles.meetingCardContent}>
                  <TouchableOpacity 
                    style={styles.meetingInfo}
                    onPress={() => handleEditTitle(meeting)}
                  >
                    <ThemedText style={styles.meetingTitle}>{meeting.title}</ThemedText>
                    <ThemedText style={styles.meetingTime}>{meeting.timestamp}</ThemedText>
                    <ThemedText style={styles.duration}>Duration: {formatTime(meeting.duration)}</ThemedText>
                    {meeting.hasTranscript && (
                      <ThemedText style={styles.transcriptAvailable}>Transcript Available</ThemedText>
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.meetingActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                      onPress={() => playAudio(meeting)}
                    >
                      <Ionicons 
                        name={playingId === meeting.id ? "stop" : "play"} 
                        size={20} 
                        color={theme === 'dark' ? Colors.dark.text : Colors.light.text} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton, 
                        { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background },
                        transcribingId === meeting.id && styles.disabledButton
                      ]}
                      onPress={() => viewTranscript(meeting)}
                      disabled={transcribingId === meeting.id}
                    >
                      {transcribingId === meeting.id ? (
                        <ActivityIndicator size="small" color={theme === 'dark' ? Colors.dark.text : Colors.light.text} />
                      ) : (
                        <Ionicons 
                          name="document-text-outline" 
                          size={20} 
                          color={theme === 'dark' ? Colors.dark.text : Colors.light.text} 
                        />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                      onPress={() => {
                        Alert.alert(
                          'Delete Meeting',
                          'Are you sure you want to delete this recording?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: () => deleteMeeting(meeting.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={20} 
                        color="#FF3B30" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>
      </View>

      <ThemedView 
        style={styles.recordingCard}
        lightColor="#FF6B00"
        darkColor="#FF6B00"
      >
        <ThemedText style={styles.recordingTitle}>
          Start a new meeting now!
        </ThemedText>
        <ThemedText style={styles.recordingDescription}>
          Capture your thoughts and conversations effortlessly.
        </ThemedText>
        
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={startRecording}
        >
          <ThemedText style={styles.recordButtonText}>
            Start Recording
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Edit Title Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!editingMeeting}
        onRequestClose={() => setEditingMeeting(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Edit Meeting Title</ThemedText>
            <TextInput
              style={[
                styles.titleInput,
                { 
                  color: theme === 'dark' ? '#FFFFFF' : '#000000',
                  borderColor: theme === 'dark' ? '#333333' : '#DDDDDD'
                }
              ]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              placeholderTextColor={theme === 'dark' ? '#777777' : '#999999'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingMeeting(null)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveTitle}
              >
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  meetingsList: {
    flex: 1,
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
  meetingCard: {
    borderRadius: 12,
    marginBottom: 10,
  },
  meetingCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meetingTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  duration: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  transcriptAvailable: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  meetingActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordingCard: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  recordingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  recordingDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#FF6B00',
  },
  modalButtonText: {
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});