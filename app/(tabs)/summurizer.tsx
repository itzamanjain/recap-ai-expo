"use client"
import { useState, useCallback } from "react"
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native"
import * as Clipboard from 'expo-clipboard' // Changed to expo-clipboard
import { getTranscriptAndSummary } from "../../lib/yt"
import YTSummuryDrawer from "../../components/ytsummurydrawer"
import { Ionicons } from "@expo/vector-icons"

// Define TypeScript interfaces
interface Summary {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  summary: string;
  transcript: string;
  timestamp: string;
  uri: string;
  hasTranscript: boolean;
  addons?: string;
}

interface TabProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

interface SummaryCardProps {
  item: Summary;
  onPress: () => void;
}

// Tab component for the modal
const Tab = ({ title, active, onPress }: TabProps) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
)

// Summary card component
const SummaryCard = ({ item, onPress }: SummaryCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.summaryPreview} numberOfLines={3}>
        {item.summary}
      </Text>
    </View>
    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.viewButton} onPress={onPress}>
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
)

const YouTubeSummarizer = () => {
  const [youtubeLink, setYoutubeLink] = useState("")
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null)

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const content = await Clipboard.getStringAsync()
      if (content) {
        setYoutubeLink(content)
      }
    } catch (error) {
      console.error("Failed to paste from clipboard:", error)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!youtubeLink) return
    setLoading(true)
    try {
      const result = await getTranscriptAndSummary(youtubeLink)
      
      // Type guard to ensure we have all the required fields
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format')
      }
      
      const { transcript, summary, title, thumbnail, duration } = result as {
        transcript?: string;
        summary?: string;
        title?: string;
        thumbnail?: string;
        duration?: string;
      }

      // Create a new summary object
      const newSummary: Summary = {
        id: Date.now().toString(),
        title: title || "YouTube Video",
        thumbnail: thumbnail || "https://via.placeholder.com/320x180",
        duration: parseInt(duration || "0"),
        summary: summary || "No summary available",
        transcript: transcript || "No transcript available",
        timestamp: new Date().toISOString(),
        uri: youtubeLink,
        hasTranscript: !!transcript,
      }

      // Add to the list of summaries
      setSummaries([newSummary, ...summaries])
      setYoutubeLink("")
    } catch (error) {
      console.error("Failed to fetch transcript and summary:", error)
      alert("Failed to process the YouTube video. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = useCallback((item: Summary) => {
    setSelectedSummary(item);
    setIsDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Text style={styles.title}>YouTube Video Summarizer</Text>
      
      {/* Input bar with paste and submit buttons */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Paste YouTube URL"
            value={youtubeLink}
            onChangeText={setYoutubeLink}
          />
          <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
            <Text style={styles.pasteButtonText}>
              <Ionicons name="clipboard-outline" size={24} color="" />
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, (!youtubeLink || loading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!youtubeLink || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Summarize</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary cards list */}
      <FlatList
        data={summaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SummaryCard item={item} onPress={() => handleViewDetails(item)} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No summaries yet. Enter a YouTube URL to get started.</Text>}
      />
      {selectedSummary && (
        <YTSummuryDrawer
          meeting={selectedSummary}
          isVisible={isDrawerVisible}
          onClose={handleCloseDrawer}
          updateMeeting={() => {}}
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
    marginRight: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingRight: 40,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  pasteButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  pasteButtonText: {
    fontSize: 18,
  },
  submitButton: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: "#FF7F50",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  duration: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  summaryPreview: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
  },
  viewButton: {
    backgroundColor: "#f1f3f5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#555",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF7F50",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#FF7F50",
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
    maxHeight: "70%",
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
})

export default YouTubeSummarizer