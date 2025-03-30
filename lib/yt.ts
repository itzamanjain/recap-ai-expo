import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from "@google/generative-ai";

function formatTranscript(text: string): string {
  // Replace HTML entity with apostrophe
  text = text.replace(/&amp;#39;/g, "'");
  
  // Split into sentences using punctuation
  let sentences: string[] = text
    .split(/([.?!])\s+/)
    .reduce<string[]>((acc, val, i, arr) => {
      if (i % 2 === 0) {
        const nextPunctuation = arr[i + 1] || '';
        const sentence = val + nextPunctuation;
        if (sentence.trim()) {  // Only add non-empty sentences
          acc.push(sentence.trim());
        }
      }
      return acc;
    }, []);

  // Capitalize the first letter of each sentence
  sentences = sentences.map(sentence => {
    if (sentence.length > 0) {
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    return sentence;
  });

  // Group every 4 sentences into a paragraph
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 4) {
    const paragraph = sentences.slice(i, i + 4).join(' ');
    if (paragraph.trim()) {  // Only add non-empty paragraphs
      paragraphs.push(paragraph);
    }
  }

  return paragraphs.join('\n\n'); // Double line break between paragraphs
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
    const formattedText = formatTranscript(rawText);

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

  // Create the system prompt for structured summary generation
  const systemPrompt = `You are a smart AI that summarizes YouTube video transcripts.
  Your job is to read the full transcript and write a clear, pointwise summary.
  Only include the most important and useful points. Skip any extra or unimportant details.
  The summary should be easy to read and give a quick idea of what the video is about.`;
  
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