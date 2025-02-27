import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Meeting, RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEETINGS_STORAGE_KEY = '@recap_ai_meetings';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Load meetings from storage on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  // Handle new meeting from recording screen
  useEffect(() => {
    const params = route.params as { newMeeting?: Meeting };
    if (params?.newMeeting) {
      addMeeting(params.newMeeting);
      // Clear the params to prevent duplicate additions
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
        setMeetings(JSON.parse(storedMeetings));
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  };

  const addMeeting = async (newMeeting: Meeting) => {
    try {
      const updatedMeetings = [newMeeting, ...meetings];
      setMeetings(updatedMeetings);
      await AsyncStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updatedMeetings));
    } catch (error) {
      console.error('Failed to save meeting:', error);
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
      // Stop currently playing audio if any
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
      Alert.alert('Error', 'Failed to play audio recording');
    }
  };

  const viewTranscript = (meeting: Meeting) => {
    navigation.navigate('(tabs)', { screen: 'transcripts' });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <ThemedText style={styles.welcomeText}>Welcome to Recap AI</ThemedText>
        <ThemedText style={styles.subtitle}>Your AI meeting assistant</ThemedText>
      </View>

      {/* Recent Meetings Section */}
      <View style={styles.sectionContainer}>
        <ThemedText style={styles.sectionTitle}>Recent Meetings</ThemedText>
        
        <ScrollView style={styles.meetingsList}>
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
                  <View style={styles.meetingInfo}>
                    <ThemedText style={styles.meetingTitle}>{meeting.title}</ThemedText>
                    <ThemedText style={styles.meetingTime}>{meeting.timestamp}</ThemedText>
                    <ThemedText style={styles.duration}>Duration: {formatTime(meeting.duration)}</ThemedText>
                  </View>
                  
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
                      style={[styles.actionButton, { backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background }]}
                      onPress={() => viewTranscript(meeting)}
                    >
                      <Ionicons 
                        name="document-text-outline" 
                        size={20} 
                        color={theme === 'dark' ? Colors.dark.text : Colors.light.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedView>
            ))
          )}
        </ScrollView>
      </View>

      {/* Start Recording Card */}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});