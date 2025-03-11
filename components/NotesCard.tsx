import { View, Text, Image, StyleSheet } from "react-native";
import { ThemedText } from "../components/ThemedText"; // Adjust import based on your theme setup
import { ThemedView } from "../components/ThemedView"; // Adjust import based on your theme setup

interface Meeting {
  id: string;
  title: string;
  timestamp: string;
  duration: number;
  transcript?: string;
  summary?: string;
  hasTranscript: boolean;
  icon?: string; // Added optional icon field
}

interface TranscriptCardProps {
  meeting: Meeting;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({ meeting }) => {
  return (
    <ThemedView key={meeting.id} style={styles.transcriptCard}>
      {/* Left-side Icon */}
      {meeting.icon && (
        <View style={styles.iconContainer}>
          <Image source={{ uri: meeting.icon }} style={styles.icon} />
        </View>
      )}

      {/* Meeting Details */}
      <View style={styles.transcriptContent}>
        <ThemedText style={styles.transcriptTitle} numberOfLines={1}>
          {meeting.title}
        </ThemedText>
        <ThemedText style={styles.transcriptTime}>
          {new Date(meeting.timestamp).toLocaleString()}
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
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF5EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  transcriptContent: {
    flex: 1,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transcriptTime: {
    fontSize: 14,
    color: "#666",
  },
});

export default TranscriptCard;
