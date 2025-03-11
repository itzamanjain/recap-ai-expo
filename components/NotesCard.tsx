import { View, Text, Image, StyleSheet } from "react-native";
import { ThemedText } from "../components/ThemedText"; // Adjust import based on your theme setup
import { ThemedView } from "../components/ThemedView"; // Adjust import based on your theme setup

interface Meeting {
  id: string;
  title: string;
  timestamp: string | number; // Ensure this is either an ISO string or a timestamp number
  duration: number; // Duration in seconds
  transcript?: string;
  summary?: string;
  hasTranscript: boolean;
  icon?: string;
}

interface TranscriptCardProps {
  meeting: Meeting;
}


// Function to format duration in HH:MM:SS
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const TranscriptCard: React.FC<TranscriptCardProps> = ({ meeting }) => {
  // Ensure timestamp is valid
  // console.log("timestamp ",meeting.timestamp);
  
  const meetingDate = new Date(meeting.timestamp);
  const formattedDate = isNaN(meetingDate.getTime())
    ? "Invalid Date"
    : meetingDate.toLocaleString(); // Formats date correctly

  return (
    <ThemedView key={meeting.id} style={styles.transcriptCard}>
      {/* Left-side Icon */}
      <View style={styles.iconContainer}>
        {meeting.icon ? (
          <Image source={{ uri: meeting.icon }} style={styles.icon} />
        ) : (
          <Text style={styles.iconPlaceholder}>📝</Text>
        )}
      </View>

      {/* Meeting Details */}
      <View style={styles.transcriptContent}>
        <ThemedText style={styles.transcriptTitle} numberOfLines={1}>
          {meeting.title}
        </ThemedText>
        <ThemedText style={styles.transcriptTime}>{meeting.timestamp}</ThemedText>
        <ThemedText style={styles.transcriptDuration}>
          Duration {formatDuration(meeting.duration)}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  transcriptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4, // For Android shadow
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFF5EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  icon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  iconPlaceholder: {
    fontSize: 20,
    color: "#FF8C42", // Orange theme color
  },
  transcriptContent: {
    flex: 1,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  transcriptTime: {
    fontSize: 14,
    color: "#777",
  },
  transcriptDuration: {
    fontSize: 14,
    color: "gray",
    fontWeight: "500",
  },
});

export default TranscriptCard;
