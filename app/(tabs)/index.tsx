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
  Modal,
  Image,
  SafeAreaView,
  Text
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Meeting, RootStackParamList, UserProfile } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transcribeUrlDeepgram } from '../../lib/transcribe';
import TranscriptCard from '@/components/NotesCard';

const MEETINGS_STORAGE_KEY = '@recap_ai_meetings';
const PROFILE_STORAGE_KEY = '@recap_ai_profile';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ name: '', email: '' });

  // Load profile and meetings
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      loadMeetings();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

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

  const transcribeMeeting = async (meeting: Meeting) => {
    try {
      setTranscribingId(meeting.id);
      Alert.alert('Generating Transcript', 'Please wait while we process your recording...');
      
      const result = await transcribeUrlDeepgram(meeting.uri,meeting.language!);
      if (result?.results?.channels[0]?.alternatives[0]?.transcript) {
        const transcript = result.results.channels[0].alternatives[0].transcript;
        const updatedMeeting = {
          ...meeting,
          transcript,
          hasTranscript: true
        };
        await updateMeeting(updatedMeeting);
        Alert.alert('Success', 'Transcript generated successfully!');
      } else {
        throw new Error('Failed to generate transcript');
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

  const viewTranscript = async (meeting: Meeting) => {
    navigation.navigate('(tabs)', { screen: 'transcripts', params: { meetingId: meeting.id } });
  };

  const handleEditTitle = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setNewTitle(meeting.title);
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* <View>
        <Text>Start Taking Notes </Text>
      </View> */}
      <ThemedView style={styles.container}>
      <View style={styles.sectionContainer}>
        <ThemedText style={styles.sectionTitle}>Recent Meetings Notes</ThemedText>
        
        <ScrollView 
          style={styles.meetingsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.tint]}
              tintColor={Colors.tint}
            />
          }
        >
          {meetings.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="mic-outline" size={48} color={Colors.text} />
              <ThemedText style={styles.emptyStateText}>No recordings yet</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Start recording your first meeting!
              </ThemedText>
            </ThemedView>
          ) : (
            meetings.map((meeting) => (
              <TranscriptCard 
                key={meeting.id} 
                meeting={meeting} 
                transcribeMeeting={transcribeMeeting}
                transcribingId={transcribingId}
              />
            ))
          )}
        </ScrollView>
      </View>

    </ThemedView>
    </SafeAreaView>
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
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 1,
  },
  setupProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  setupProfileText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
  },
  welcomeText: {
    fontSize: 28,
    padding: 4,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionContainer: {
    flex: 1,
    marginTop: 20,
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
    backgroundColor: Colors.tint,
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