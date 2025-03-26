// import OpenAI from 'openai';

// // const openai_api_key = process.env.EXPO_PUBLIC_API_KEY;
// const openai_api_key = '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';
// // const gemini_api_key = 'AIzaSyDFTENen6nFrgcTkJrbfQeTUlD2ZQsV7QU'
// if (!openai_api_key) {
//     throw new Error('Summury : API key is not set!!');
// }

// const openai = new OpenAI({ apiKey: openai_api_key });

// export async function getSummary(transcript: string): Promise<string> {
//     console.log("inside openai summary",transcript);
    
//     const SystemPrompt = `
// 📢 **You are an AI meeting assistant** that extracts key insights from discussions.  
// Your task is to analyze the transcript and generate a structured summary with:  
// 📝 **Concise Summary** (3-5 sentences capturing key discussions & outcomes)  
// 📌 **Key Discussion Points** (major topics, decisions, concerns)  
// ✅ **Action Items** (tasks, responsible persons, and deadlines if mentioned)  

// Make sure the response is **clear, concise, and well-structured**.  
// `;

//     const response = await openai.chat.completions.create({
//         model: 'gpt-4o',
//         messages: [
//             { role: 'system', content: SystemPrompt }, // Instructions
//             { role: 'user', content: transcript } // Only sending transcript here
//         ],
//         temperature: 0.5,
//     });

//     if (!response?.choices?.[0]?.message?.content) {
//         throw new Error('⚠️ No response from API!');
//     }

//     return response.choices[0].message.content.replace(/\*\*/g, ''); // Remove unnecessary bold formatting
// }



// File: geminiSummary.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client with your API key
// In production, you should store this in environment variables
// const gemini_api_key = process.env.GEMINI_API_KEY;
const gemini_api_key = 'AIzaSyDFTENen6nFrgcTkJrbfQeTUlD2ZQsV7QU';

if (!gemini_api_key) {
  throw new Error('Summary: Gemini API key is not set!!');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(gemini_api_key);


export async function getSummary(transcript: string): Promise<string> {
    console.log("inside gemini summary");
    
  // Create the system prompt for structured summary generation
  const systemPrompt = `
📢 **You are an AI meeting assistant** that extracts key insights from discussions.  
Your task is to analyze the transcript and generate a structured summary with:  
**Concise Summary** (3-5 sentences capturing key discussions & outcomes)  
📌 **Key Discussion Points** (major topics, decisions, concerns)  
✅ **Action Items** (tasks, responsible persons, and deadlines if mentioned)  

Make sure the response is **clear, concise, and well-structured**.  
`;

  try {
    // Get the Gemini model (using the most capable model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate content by combining system prompt and transcript
    const prompt = `${systemPrompt}\n\nTranscript to analyze:\n${transcript}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("text", text);
    
    
    // Clean up formatting if needed
    return text.replace(/\*\*/g, ''); // Remove unnecessary bold formatting
  } catch (error:any) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error(`⚠️ Gemini API error: ${error.message}`);
  }
}