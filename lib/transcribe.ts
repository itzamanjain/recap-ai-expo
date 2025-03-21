import * as FileSystem from 'expo-file-system';

// Increased size limit to approximately 150MB
// A 45-minute WAV file (16-bit, 44.1kHz, stereo) can be around 130-150MB
const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB limit

// Language mapping for easy maintenance and expansion
const LANGUAGE_MAP: Record<string, string> = {
  "bulgarian": "bg",
  "catalan": "ca",
  "chinese (simplified)": "zh-CN",
  "chinese (traditional)": "zh-TW",
  "czech": "cs",
  "danish": "da",
  "dutch": "nl",
  "english (australia)": "en-AU",
  "english (great britain)": "en-GB",
  "english (india)": "en-IN",
  "english (new zealand)": "en-NZ",
  "english (united states)": "en-US",
  "estonian": "et",
  "finnish": "fi",
  "french": "fr",
  "french (canada)": "fr-CA",
  "german": "de",
  "german (switzerland)": "de-CH",
  "greek": "el",
  "hindi": "hi",
  "hindi (latin script)": "hi-Latn",
  "hungarian": "hu",
  "indonesian": "id",
  "italian": "it",
  "japanese": "ja",
  "korean": "ko",
  "latvian": "lv",
  "lithuanian": "lt",
  "malay": "ms",
  "norwegian": "no",
  "polish": "pl",
  "portuguese": "pt",
  "portuguese (brazil)": "pt-BR",
  "portuguese (portugal)": "pt-PT",
  "romanian": "ro",
  "russian": "ru",
  "slovak": "sk",
  "spanish": "es",
  "spanish (latin america)": "es-419",
  "swedish": "sv",
  "tamil": "ta",
  "thai": "th",
  "turkish": "tr",
  "ukrainian": "uk",
  "vietnamese": "vi",
};


// Default language if not found in mapping
const DEFAULT_LANGUAGE = "en-US";

interface DeepgramError {
  err_code: string;
  err_msg: string;
}

export const transcribeUrlDeepgram = async (fileUri: string, language: string) => {
  console.log("inside api call", fileUri);
  console.log("inside api call language", language);
  
  // TODO: Move to environment variables or secure storage in production
  const deepgramApiKey = "2ab46da706c36124ce96f4f0b589ee972626803f"; // TODO: Move to environment variables or secure storage in production
  
  // Get language code from mapping or use default
  const languageCode = LANGUAGE_MAP[language.toLowerCase()] || DEFAULT_LANGUAGE;
  
  // Build API URL with the language code
  const apiUrl = `https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=${languageCode}`;

  try {
    // Check if file exists and get info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Recording file not found');
    }

    // Check file size
    if (fileInfo.size > MAX_FILE_SIZE) {
      throw new Error(`Recording is too large (max ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB)`);
    }

    console.log(`File size: ${Math.round(fileInfo.size / (1024 * 1024))}MB`);

    // Increased timeout for reading larger files (3 minutes)
    const READ_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
    
    // Read the file as base64 with extended timeout
    const base64Audio = await Promise.race([
      FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout reading file')), READ_TIMEOUT)
      )
    ]) as string;

    // Convert base64 to binary
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Increased API request timeout (10 minutes)
    const API_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Make the API request with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      console.log(`Starting API request for ${Math.round(len / (1024 * 1024))}MB of audio data`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramApiKey}`,
          'Content-Type': 'audio/wav'
        },
        body: bytes,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json() as DeepgramError;
        console.error('Deepgram API error:', errorData);
        
        // Handle specific API errors
        if (errorData.err_code === 'REMOTE_CONTENT_ERROR') {
          throw new Error('Failed to process audio file. Please try again.');
        } else if (errorData.err_code === 'INVALID_MIMETYPE') {
          throw new Error('Invalid audio format. Please use WAV format.');
        } else if (errorData.err_code === 'TOO_LARGE') {
          throw new Error('The audio file is too large for processing through the API.');
        } else {
          throw new Error(`Transcription failed: ${errorData.err_msg}`);
        }
      }

      const result = await response.json();
      console.log("Transcription complete");

      // Verify the response has the expected structure
      if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        throw new Error('Invalid response format from Deepgram');
      }
      
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Transcription timed out. Please try again with a shorter audio file.');
        }
        throw error;
      }
      throw new Error('An unknown error occurred');
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    // If it's a network error, provide a more user-friendly message
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Network error: Please check your internet connection');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during transcription');
  }
};