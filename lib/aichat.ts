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
        parts: [{ text: `You are an AI meeting assistant.\n\nHere is the meeting transcript:\n${transcript}\n\nFrom now on, you will answer questions based on this transcript.` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I'm ready to answer questions based on the transcript." }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
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


// import { OpenAI } from 'openai';

// const openai = new OpenAI({
//   apiKey: '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',
// });

// let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

// function buildInitialPrompt(transcript: string): string {
//   return `You are an AI meeting assistant.

// Here is the meeting transcript:
// ${transcript}

// From now on, you will answer questions based only on this transcript.`;
// }

// export async function askAi(transcript: string, question: string): Promise<string> {
//   console.log("transcript:", transcript);
//   console.log("question:", question);

//   try {
//     if (chatHistory.length === 0) {
//       // Set up initial context
//       chatHistory.push(
//         { role: "user", content: buildInitialPrompt(transcript) },
//         { role: "assistant", content: "Understood. I'm ready to answer questions based on the transcript." }
//       );
//     }

//     // Add user's question
//     chatHistory.push({ role: "user", content: question });

//     // Get response from OpenAI
//     const response = await openai.chat.completions.create({
//       model: "gpt-4", // or "gpt-3.5-turbo"
//       messages: chatHistory,
//       temperature: 0.7,
//       max_tokens: 1024,
//     });

//     const answer = response.choices[0].message.content || "No response.";
    
//     // Add assistant's reply to history
//     chatHistory.push({ role: "assistant", content: answer });

//     return answer;
//   } catch (error: any) {
//     console.error("❌ OpenAI Chatbot Error:", error);
//     throw new Error(`⚠️ OpenAI Chatbot Error: ${error.message}`);
//   }
// }

