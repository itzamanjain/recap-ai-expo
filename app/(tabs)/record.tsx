"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, Animated } from "react-native"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import { StatusBar } from "expo-status-bar"
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList, Meeting } from "../types/navigation"
import { ThemedView } from "@/components/ThemedView"
import { ThemedText } from "@/components/ThemedText"
import { useTheme } from "@/hooks/ThemeContext"
import Reanimated from "react-native-reanimated"

// Get screen dimensions
const { width } = Dimensions.get("window")

export default function RecordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showStartButton, setShowStartButton] = useState(true)
  const [countdown, setCountdown] = useState(0)
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
        // This will trigger the useAnimatedStyle to recalculate with new random heights
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
      // Clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Start the timer
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingTime(elapsedSeconds)
      }, 1000)
    } else {
      // Clear interval when not recording
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    // Cleanup on effect cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
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
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        alert("Permission to access microphone is required!")
        return
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      })

      // Create recording object
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
      
      // Note: The timer is now started by the useEffect that watches isRecording
    } catch (err) {
      console.error("Failed to start recording", err)
      alert("Failed to start recording")
    }
  }

  // Stop recording function
  const stopRecording = async () => {
    try {
      if (!recording) return

      // Stop recording
      await recording.stopAndUnloadAsync()
      
      // Get recording URI
      const uri = recording.getURI()
      if (!uri) {
        throw new Error("Failed to get recording URI")
      }

      // Create a unique filename with timestamp
      const timestamp = new Date()
      const fileName = `recording-${timestamp.getTime()}.wav`
      const newUri = `${FileSystem.documentDirectory}${fileName}`

      // Save recording to app's document directory
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      })

      // Create meeting object
      const newMeeting: Meeting = {
        id: timestamp.getTime().toString(),
        title: `Meeting ${timestamp.toLocaleTimeString()}`,
        timestamp: formatTimestamp(timestamp),
        uri: newUri,
        duration: recordingTime,
        hasTranscript: false,
      }

      // Reset states (this will trigger the useEffect to clear the timer)
      setRecording(null)
      setIsRecording(false)
      setRecordingTime(0)
      setShowStartButton(true)

      // Navigate back to home and pass the new meeting
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
        backgroundColor: isDark ? "#FF5722" : "#FF6B00",
      }
    })
    return animatedStyle
  })

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.recordingContainer}>
        <ThemedText style={styles.title}>{isRecording ? "Recording in Progress" : "Ready to Record"}</ThemedText>

        {countdown > 0 ? (
          <Animated.Text
            style={[
              styles.countdown,
              {
                color: isDark ? "#FFFFFF" : "#000000",
                transform: [{ scale: countdownAnimation }],
              },
            ]}
          >
            {countdown}
          </Animated.Text>
        ) : (
          isRecording && <ThemedText style={styles.timer}>{formatTime(recordingTime)}</ThemedText>
        )}

        {/* Animated waveform visualization */}
        {isRecording && (
          <View
            style={[
              styles.waveformContainer,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
            ]}
          >
            {bars.map((bar, index) => (
              <Reanimated.View key={bar.id} style={[styles.bar, animatedBarStyles[index]]} />
            ))}
          </View>
        )}

        {showStartButton ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDark ? "#FF5722" : "#FF6B00" }]}
            onPress={startCountdown}
          >
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: "#FF3B30" }]} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingContainer: {
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  timer: {
    fontSize: 48,
    marginTop: 20,
    padding: 30,
    fontWeight: "bold",
    marginVertical: 20,
    fontVariant: ["tabular-nums"],
  },
  countdown: {
    fontSize: 72,
    fontWeight: "bold",
    marginVertical: 20,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 100,
    width: width * 0.8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
})