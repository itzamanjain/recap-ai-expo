import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from "@google/generative-ai";

function formatTranscript(text: string): string {
  // Replace HTML entities with proper characters
  text = text.replace(/&amp;#39;/g, "'");

  // Split into sentences
  let sentences: string[] = text
    .split(/([.?!])\s+/)
    .reduce<string[]>((acc, val, i, arr) => {
      if (i % 2 === 0) {
        const punctuation = arr[i + 1] || '';
        const sentence = (val + punctuation).trim();
        if (sentence) acc.push(sentence);
      }
      return acc;
    }, []);

  // Capitalize each sentence
  sentences = sentences.map(sentence =>
    sentence.charAt(0).toUpperCase() + sentence.slice(1)
  );

  // Group sentences into bullet points with ~40–60 words each
  const points: string[] = [];
  let currentPoint: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).length;
    currentWordCount += wordCount;
    currentPoint.push(sentence);

    if (currentWordCount >= 50) {
      points.push(`• ${currentPoint.join(' ')}`);
      currentPoint = [];
      currentWordCount = 0;
    }
  }

  // Add remaining sentences
  if (currentPoint.length > 0) {
    points.push(`• ${currentPoint.join(' ')}`);
  }

  // Join points with clear spacing
  return points.join('\n\n');
}



const getYoutubeTranscript = async (videoUrl: string): Promise<string> => {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    // Join transcript into one string
    const rawText = transcript
      .map(item => item.text)
      .filter(text => text.toLowerCase() !== '[music]' && text.trim() !== '')
      .join(' ');

    // Format the transcript nicely
    const formattedText = formatTranscript(rawText); // Use bullets for formatting

    return formattedText;
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw new Error('Failed to fetch transcript');
  }
}

// Use environment variable or configuration for API key
const GEMINI_API_KEY = 'AIzaSyDFTENen6nFrgcTkJrbfQeTUlD2ZQsV7QU';

if (!GEMINI_API_KEY) {
  throw new Error('Summary: Gemini API key is not set!');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const getSummaryForYtVideo = async (transcript: string): Promise<string> => {
  console.log("Processing summary with Gemini...");

  const systemPrompt = `You are a smart AI that summarizes YouTube video transcripts.

  Your task is to read the full transcript and write a clear, structured summary.
  
  Follow these rules:
  - Only include the most important and useful points.
  - Skip any extra, repetitive, or unimportant details.
  - Write the summary in a pointwise format.
  - Use bullet points or numbered lists where needed.
  - Use clear and simple language. Avoid jargon unless necessary.
  - Be concise and to the point.
  - Avoid personal opinions or subjective statements.
  - Do not repeat the same idea in different ways.
  - Add proper spacing between points to improve readability.
  - Do not use HTML tags or unnecessary formatting.
  
  The goal is to make the summary easy to read and give a quick understanding of what the video is about.`;
  
  
  try {
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate content by combining system prompt and transcript
    const prompt = `${systemPrompt}\n\nTranscript to analyze:\n${transcript}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("Summary generated successfully");

    // Clean up formatting if needed
    return text.replace(/\*\*/g, ''); // Remove unnecessary bold formatting
  } catch (error: any) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error(`⚠️ Gemini API error: ${error.message}`);
  }
}

const getTranscriptAndSummary = async (videoUrl: string): Promise<{ transcript: string; summary: string }> => {
  const transcript = await getYoutubeTranscript(videoUrl);
  const summary = await getSummaryForYtVideo(transcript);
  return { transcript, summary };
};

export {
  getYoutubeTranscript,
  getSummaryForYtVideo,
  getTranscriptAndSummary // Export the new function
}