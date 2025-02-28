import OpenAI from 'openai';

// const openai_api_key = process.env.EXPO_PUBLIC_API_KEY;
const openai_api_key = "";
if (!openai_api_key) {
    throw new Error('Summury : API key is not set!!');
}

const openai = new OpenAI({ apiKey: openai_api_key });

export async function generateSummary(transcript: string): Promise<string> {
    const SystemPrompt = `
📢 **You are an AI meeting assistant** that extracts key insights from discussions.  
Your task is to analyze the transcript and generate a structured summary with:  
📝 **Concise Summary** (3-5 sentences capturing key discussions & outcomes)  
📌 **Key Discussion Points** (major topics, decisions, concerns)  
✅ **Action Items** (tasks, responsible persons, and deadlines if mentioned)  

Make sure the response is **clear, concise, and well-structured**.  
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: SystemPrompt }, // Instructions
            { role: 'user', content: transcript } // Only sending transcript here
        ],
        temperature: 0.5,
    });

    if (!response?.choices?.[0]?.message?.content) {
        throw new Error('⚠️ No response from API!');
    }

    return response.choices[0].message.content.replace(/\*\*/g, ''); // Remove unnecessary bold formatting
}