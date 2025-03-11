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
const TINT_COLOR = '#FF6B00';

export default function RecordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  // Recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0);
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

  // Waveform animation setup
  const BAR_COUNT = 20
  const bars = Array(BAR_COUNT)
    .fill(0)
    .map((_, i) => ({
      id: i,
      height: useSharedValue(20),
    }))

  // Update waveform animation periodically when recording
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null

    if (isRecording) {
      animationInterval = setInterval(() => {
        bars.forEach((bar) => {
          bar.height.value = 20 + Math.random() * 60
        })
      }, 200)
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval)
      }
    }
  }, [isRecording, bars])

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
        title: `Meeting ${timestamp.toLocaleTimeString()}`,
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

  const animatedBarStyles = bars.map((bar) => {
    const animatedStyle = useAnimatedStyle(() => {
      const randomHeight = isRecording ? 20 + Math.random() * 60 : 20
      return {
        height: withSpring(randomHeight, {
          damping: 10,
          stiffness: 80,
        }),
        backgroundColor: TINT_COLOR,
      }
    })
    return animatedStyle
  })

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Section */}
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
      {/* Main Content Section */}
      <View style={styles.recordingContainer}>
        {showStartButton && (
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
              <ChevronDown width={20} height={20} color="#000000" />
            </TouchableOpacity>
          </View>
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

        {isRecording && (
          <View style={styles.waveformContainer}>
            {bars.map((bar, index) => (
              <Reanimated.View key={bar.id} style={[styles.bar, animatedBarStyles[index]]} />
            ))}
          </View>
        )}

        {showStartButton ? (
          <TouchableOpacity
            style={styles.button}
            onPress={startCountdown}
          >
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Language Selection Modal */}
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
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownContainer}>
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
                listMode="SCROLLVIEW"
                zIndex={3000}
              />
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                setLanguageModalVisible(false);
              }}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginTop: 10,
  },
  headerImage: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  recordingContainer: {
    alignItems: "center",
    width: "100%",
    padding: 15,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  timer: {
    fontSize: 42,
    marginTop: 10,
    padding: 15,
    fontWeight: "bold",
    marginVertical: 10,
    fontVariant: ["tabular-nums"],
  },
  countdown: {
    fontSize: 64,
    fontWeight: "bold",
    marginVertical: 10,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 80,
    width: width * 0.8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginVertical: 15,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  languageSelector: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    padding: 5,
  },
  selectedLanguageText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  langButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderColor: '#000000',
    borderWidth: 1,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 220,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
    backgroundColor: TINT_COLOR,
    minWidth: 180,
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  langButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "500",
    marginRight: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: "300",
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 24,
  },
  dropdown: {
    borderColor: '#ccc',
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: TINT_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: "center",
  },
})
