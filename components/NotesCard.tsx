import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ThemedText } from "../components/ThemedText"; // Adjust import based on your theme setup
import { ThemedView } from "../components/ThemedView"; // Adjust import based on your theme setup
import { Meeting } from "../app/types/navigation";
import { Colors } from "../constants/Colors";
import { Ionicons } from '@expo/vector-icons';

interface TranscriptCardProps {
  meeting: Meeting;
  transcribeMeeting: (meeting: Meeting) => void;
  transcribingId: string | null;
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

const TranscriptCard: React.FC<TranscriptCardProps> = ({ meeting, transcribeMeeting, transcribingId }) => {
  // Ensure timestamp is valid
  // console.log("timestamp ",meeting.timestamp);

  const meetingDate = new Date(meeting.timestamp);
  const formattedDate = isNaN(meetingDate.getTime())
    ? "Invalid Date"
    : meetingDate.toLocaleString(); // Formats date correctly


  const emoji = ["✨", "🪴", "🕧", "🗒️", "📓", "📅", "📝", "📊", "📈", "📆"];
  const randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];

  return (
    <ThemedView key={meeting.id} style={styles.transcriptCard}>
      {/* Left-side Icon */}
      <View style={styles.iconContainer}>
        {meeting.icon ? <Text style={styles.iconPlaceholder}>{meeting?.icon}</Text> : <Text style={styles.iconPlaceholder}>{randomEmoji}</Text>}
      </View>

      {/* Meeting Details */}
      <View style={styles.transcriptContent}>
        <ThemedText style={styles.transcriptTitle} numberOfLines={1}>
          {meeting.title}
        </ThemedText>
        {/* <ThemedText style={styles.transcriptTime}>{meeting.timestamp}</ThemedText> */}
        <ThemedText style={styles.transcriptDuration}>
          Duration {formatDuration(meeting.duration)}
        </ThemedText>
        {meeting.hasTranscript &&
          <ThemedText style={styles.transcriptAvailable}>Transcript Available</ThemedText>
        }
        {!meeting.hasTranscript && (
          <TouchableOpacity
            style={styles.transcribeButton}
            onPress={() => transcribeMeeting(meeting)}
            disabled={transcribingId === meeting.id}
          >
            {transcribingId === meeting.id ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <View style={styles.iconWithText}>
                <Ionicons name="document-text-outline" size={22} color={Colors.tint} />
                <Text style={styles.transcribeText}>Transcribe</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

      </View>
      <View>

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
  },
  transcribeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14, // better touch area
    borderRadius: 10,
    minWidth: 120, // allows flexibility on smaller screens
    marginTop: 8,
    borderWidth: 1, // fixed this
    borderColor: '#FF8C42',
    backgroundColor: '#FFF5EB',
    alignItems: 'center', // centers the content
    flexDirection: 'row', // allows icon + text to align
    justifyContent: 'center', // centers everything horizontally
  },
  
  iconWithText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // If "gap" is not supported in your version, use marginRight on icon or Text
  },
  transcribeText: {
    fontSize: 14,
    color: Colors.tint,
    fontWeight: '500',
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
});

export default TranscriptCard;
