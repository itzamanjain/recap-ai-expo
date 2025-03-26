"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, TouchableOpacity, View, Text, Image, Dimensions, Animated, Modal } from "react-native"
import DropDownPicker from "react-native-dropdown-picker"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import { StatusBar } from "expo-status-bar"
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList, Meeting } from "../types/navigation"
import { ThemedView } from "../../components/ThemedView"
import { ThemedText } from "../../components/ThemedText"
import Reanimated from "react-native-reanimated"
import { ChevronDown } from "react-native-feather" // Import icon for dropdown

// Get screen dimensions
const { width } = Dimensions.get("window")

// Define tint color constant
const PRIMARY_COLOR = '#FF6B00';
const SECONDARY_COLOR = '#3F51B5'; // Example: A deep indigo

export default function RecordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  // Recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0);
const [meetingName, setMeetingName] = useState("Team Sync (Default)");
const [selectedLanguage, setSelectedLanguage] = useState("english (india)")
const [open, setOpen] = useState(false);

  const [items, setItems] = useState([
    { label: "Bulgarian", value: "bulgarian" },
    { label: "Catalan", value: "catalan" },
    { label: "Chinese (Simplified)", value: "chinese (simplified)" },
    { label: "Chinese (Traditional)", value: "chinese (traditional)" },
    { label: "Czech", value: "czech" },
    { label: "Danish", value: "danish" },
    { label: "Dutch", value: "dutch" },
    { label: "English (Australia)", value: "english (australia)" },
    { label: "English (Great Britain)", value: "english (great britain)" },
    { label: "English (India)", value: "english (india)" },
    { label: "English (New Zealand)", value: "english (new zealand)" },
    { label: "English (United States)", value: "english (united states)" },
    { label: "Estonian", value: "estonian" },
    { label: "Finnish", value: "finnish" },
    { label: "French", value: "french" },
    { label: "French (Canada)", value: "french (canada)" },
    { label: "German", value: "german" },
    { label: "German (Switzerland)", value: "german (switzerland)" },
    { label: "Greek", value: "greek" },
    { label: "Hindi", value: "hindi" },
    { label: "Hindi (Latin Script)", value: "hindi (latin script)" },
    { label: "Hungarian", value: "hungarian" },
    { label: "Indonesian", value: "indonesian" },
    { label: "Italian", value: "italian" },
    { label: "Japanese", value: "japanese" },
    { label: "Korean", value: "korean" },
    { label: "Latvian", value: "latvian" },
    { label: "Lithuanian", value: "lithuanian" },
    { label: "Malay", value: "malay" },
    { label: "Norwegian", value: "norwegian" },
    { label: "Polish", value: "polish" },
    { label: "Portuguese", value: "portuguese" },
    { label: "Portuguese (Brazil)", value: "portuguese (brazil)" },
    { label: "Portuguese (Portugal)", value: "portuguese (portugal)" },
    { label: "Romanian", value: "romanian" },
    { label: "Russian", value: "russian" },
    { label: "Slovak", value: "slovak" },
    { label: "Spanish", value: "spanish" },
    { label: "Spanish (Latin America)", value: "spanish (latin america)" },
    { label: "Swedish", value: "swedish" },
    { label: "Tamil", value: "tamil" },
    { label: "Thai", value: "thai" },
    { label: "Turkish", value: "turkish" },
    { label: "Ukrainian", value: "ukrainian" },
    { label: "Vietnamese", value: "vietnamese" },
  ]);

  const [showStartButton, setShowStartButton] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [languageModalVisible, setLanguageModalVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const countdownAnimation = useRef(new Animated.Value(1)).current
  const categories = [
    "Team Sync (Default)",
    "Standup Meeting",
    "Sales Discussion",
    "Project Update",
    "Client Call",
    "Marketing Meeting",
    "Product Review",
    "Sprint Planning",
    "Design Review",
    "Strategy Session",
    "Performance Check-in",
    "Other",
  ];
  
  // Waveform animation setup

  // Update waveform animation periodically when recording

  // Effect to manage recording timer
  useEffect(() => {
    if (isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingTime(elapsedSeconds)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Animate countdown
    Animated.sequence([
      Animated.timing(countdownAnimation, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(countdownAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // Start recording function
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        alert("Permission to access microphone is required!")
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      })

      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      })

      await newRecording.startAsync()

      setRecording(newRecording)
      setIsRecording(true)
      setRecordingTime(0)
      setShowStartButton(false)
    } catch (err) {
      console.error("Failed to start recording", err)
      alert("Failed to start recording")
    }
  }

  // Stop recording function
  const stopRecording = async () => {
    try {
      if (!recording) return

      await recording.stopAndUnloadAsync()

      setTimeout(async () => {
        const uri = recording.getURI()
        if (!uri) {
          throw new Error("Failed to get recording URI")
        }

        const timestamp = new Date()
        const fileName = `recording-${timestamp.getTime()}.wav`
        const newUri = `${FileSystem.documentDirectory}${fileName}`

        await FileSystem.moveAsync({
          from: uri,
          to: newUri,
        })

        const newMeeting: Meeting = {
          id: timestamp.getTime().toString(),
          title: meetingName ? `${meetingName} - ${timestamp.toLocaleTimeString()}` : `Meeting ${timestamp.toLocaleTimeString()}`,
          timestamp: formatTimestamp(timestamp),
          uri: newUri,
          language: selectedLanguage,
          duration: recordingTime,
          hasTranscript: false,
        }

        setRecording(null)
        setIsRecording(false)
        setRecordingTime(0)
        setShowStartButton(true)

        navigation.navigate("(tabs)", {
          screen: "index",
          params: { newMeeting },
        })
      }, 100);
    } catch (err) {
      console.error("Failed to stop recording", err)
      alert("Failed to stop recording")
    }
  }

  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString()

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    if (isToday) return `Today, ${time}`
    if (isYesterday) return `Yesterday, ${time}`
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) + `, ${time}`
    )
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recording])


  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
  
      {/* Header */}
      {/* <View style={styles.headerSection}>
        <Image 
          source={require("../../assets/images/programmer.gif")} 
          style={styles.headerImage} 
        />
        <ThemedText style={styles.title}>
          {isRecording ? "Recording in Progress" : "Ready to Record"}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Available in Over 20 Languages
        </ThemedText>
      </View>
   */}
      {/* Main Content */}
      <View style={styles.mainContent}>
        {showStartButton && (
          <>
            <ThemedText style={styles.label}>Meeting Category:</ThemedText>
            <DropDownPicker
              open={open}
              value={meetingName}
              items={categories.map((c) => ({ label: c, value: c }))}
              setOpen={setOpen}
              setValue={setMeetingName}
              setItems={() => {}}
              placeholder="Select a category"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
  
            <View style={styles.languageSelector}>
              <ThemedText style={styles.selectedLanguageText}>
                Select your language:
              </ThemedText>
              <TouchableOpacity
                style={styles.langButton}
                onPress={() => setLanguageModalVisible(true)}
              >
                <Text style={styles.langButtonText}>
                  {items.find(item => item.value === selectedLanguage)?.label}
                </Text>
                <ChevronDown width={20} height={20} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        )}
  
        {countdown > 0 ? (
          <Animated.Text
            style={[
              styles.countdown,
              {
                color: '#11181C',
                transform: [{ scale: countdownAnimation }],
              },
            ]}
          >
            {countdown}
          </Animated.Text>
        ) : (
          isRecording && <ThemedText style={styles.timer}>{formatTime(recordingTime)}</ThemedText>
        )}
        <View>
        {
          isRecording && (
            <Text>
              We are recording your meeting. Please speak clearly and ensure you are in a quiet environment.
            </Text>

          )
        }
        </View>
        <TouchableOpacity
          style={[styles.button, !showStartButton && styles.stopButton]}
          onPress={showStartButton ? startCountdown : stopRecording}
        >
          <Text style={styles.buttonText}>
            {showStartButton ? "Start Recording" : "Stop Recording"}
          </Text>
        </TouchableOpacity>
      </View>
  
      {/* Language Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
  
            <DropDownPicker
              open={open}
              value={selectedLanguage}
              items={items}
              setOpen={setOpen}
              setValue={(callback) => {
                const value = callback(selectedLanguage);
                setSelectedLanguage(value);
              }}
              setItems={setItems}
              style={styles.dropdown}
              maxHeight={300}
              listMode="MODAL"
              zIndex={3000}
              textStyle={{ textAlign: 'left' }}
              dropDownContainerStyle={styles.dropdownContainer}
            />
  
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.buttonText}>Confirm Language</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  headerImage: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: "#11181C",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  dropdown: {
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
    borderRadius: 8,
    width: "auto",
    marginBottom: 15,
  },
  dropdownContainer: {
    width: "100%",
  },
  languageSelector: {
    marginTop: 10,
    alignItems: "center",
  },
  selectedLanguageText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  langButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderRadius: 10,
    width: 'auto',
  },
  langButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginRight: 10,
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: "#e53935",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timer: {
    fontSize: 42,
    padding:20,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  countdown: {
    fontSize: 64,
    fontWeight: "bold",
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
});
