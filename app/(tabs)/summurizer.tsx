import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import React, { useState } from 'react';
import { getTranscriptAndSummary } from '../../lib/yt';

const summurizer = () => {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = async () => {
    try {
      const { transcript, summary } = await getTranscriptAndSummary(youtubeLink);
      setTranscript(transcript);
      setSummary(summary);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch transcript and summary');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Summarizer</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter YouTube Link"
        value={youtubeLink}
        onChangeText={setYoutubeLink}
      />
      <Button
        title="Summarize"
        onPress={handleSubmit}
        color="#FF7F50" // Orange color
      />
      {transcript && summary ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transcript</Text>
          <Text style={styles.cardText}>{transcript}</Text>
          <Text style={styles.cardTitle}>Summary</Text>
          <Text style={styles.cardText}>{summary}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default summurizer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 12,
  },
});