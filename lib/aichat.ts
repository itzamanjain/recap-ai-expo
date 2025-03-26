import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";

const gemini_api_key = 'AIzaSyDFTENen6nFrgcTkJrbfQeTUlD2ZQsV7QU';
if (!gemini_api_key) throw new Error('Gemini API key is not set!');

const genAI = new GoogleGenerativeAI(gemini_api_key);

let chat: ChatSession | null = null;

async function initChat(transcript: string): Promise<ChatSession> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const chatSession = model.startChat({
    history: [
      {
        role: "user",
        parts: [{
          text: `
You are an AI meeting assistant.

Here is the meeting transcript:
${transcript}

Your ONLY job is to answer questions related to this transcript.

If a user asks anything that is not clearly based on this meeting transcript (like asking general knowledge, coding, personal advice, jokes, or anything outside the transcript), respond with:

"I'm sorry, I can only answer questions related to this meeting. Please ask something based on the transcript."

Do not respond to anything unrelated. Do not break this rule.
`
        }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will only respond to questions related to the transcript." }],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    },
  });

  return chatSession;
}

export async function askAi(transcript: string, question: string): Promise<string> {
  console.log("transcript:", transcript);
  console.log("question:", question);

  try {
    if (!chat) {
      chat = await initChat(transcript);
    }

    const result = await chat.sendMessage([{ text: question }]);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error in Gemini chatbot:", error);

    if (error.message?.includes("session expired") || error.message?.includes("invalid session")) {
      chat = null;
      return askAi(transcript, question);
    }

    throw new Error(`⚠️ Gemini Chatbot Error: ${error.message}`);
  }
}
