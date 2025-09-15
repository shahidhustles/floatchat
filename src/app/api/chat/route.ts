import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import type { CoreMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: `You are FloatChat, an expert AI oceanographer and data scientist specializing in ARGO float oceanographic data analysis. 

    You help users explore and understand ocean data through natural conversation. You can discuss:
    - Ocean temperature, salinity, and depth measurements
    - ARGO float data and oceanographic research
    - Marine science concepts and trends
    - Climate patterns and ocean dynamics
    - Data analysis and visualization concepts

    Keep your responses conversational, informative, and accessible to both scientists and non-experts. When users ask about specific data queries or visualizations, acknowledge their request and explain what kind of analysis would be helpful, even though you don't yet have access to live data tools.

    Be enthusiastic about ocean science and help users understand the fascinating world of oceanographic data!`,
    messages,
  });

  return result.toDataStreamResponse();
}
