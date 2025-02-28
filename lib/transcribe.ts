import * as FileSystem from 'expo-file-system';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB limit

interface DeepgramError {
  err_code: string;
  err_msg: string;
}

export const transcribeUrlDeepgram = async (fileUri: string) => {
  console.log("inside api call", fileUri);
  
  const deepgramApiKey = "";
  const apiUrl = "https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=en-US";

  try {
    // Check if file exists and get info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Recording file not found');
    }

    // Check file size
    if (fileInfo.size > MAX_FILE_SIZE) {
      throw new Error('Recording is too large (max 30MB)');
    }

    // Read the file as base64 with timeout
    const base64Audio = await Promise.race([
      FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout reading file')), 30000)
      )
    ]) as string;

    // Convert base64 to binary
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
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
        } else {
          throw new Error(`Transcription failed: ${errorData.err_msg}`);
        }
      }

      const result = await response.json();
      console.log("result of trans", result);

      // Verify the response has the expected structure
      if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        throw new Error('Invalid response format from Deepgram');
      }
      
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Transcription timed out. Please try again.');
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