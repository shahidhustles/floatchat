import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, tool } from "ai";
import type { CoreMessage } from "ai";
import { api } from "../../../../convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { convex } from "@/lib/convex/convex";
import z from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("🚀 [API] POST /api/chat called");

  const user = await currentUser();
  if (!user?.id) {
    console.log("❌ [API] Unauthorized user");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("✅ [API] User authenticated:", user.id);

  const { messages, chatId }: { messages: CoreMessage[]; chatId?: string } =
    await req.json();

  console.log("📨 [API] Received messages:", messages.length);
  console.log("💬 [API] Last message:", messages[messages.length - 1]?.content);

  // We'll determine if it's the first message based on the messages array length
  // For new chats, we'll create the chat only in the onFinish callback with both messages
  const isFirstMessage = messages.length === 1;

  // Add the user message to Convex if chat already exists (not first message)
  if (!isFirstMessage && chatId) {
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      await convex.mutation(api.chats.addMessage, {
        chatId: chatId,
        message: {
          id: nanoid(),
          role: userMessage.role as "user" | "assistant" | "system",
          content: userMessage.content as string,
          createdAt: Date.now(),
        },
      });
    }
  }

  console.log("🔧 [API] Setting up streamText with tools");

  const result = streamText({
    model: google("gemini-2.5-flash"),

    system: `You are FloatChat, an expert AI oceanographer and marine data specialist.

    You have TWO key capabilities:

    1. **Ocean Data Analysis**: Answer questions about ARGO float data, oceanographic measurements, and marine science concepts. For statistical queries about ocean data (temperature, salinity, depth profiles), you will eventually have access to live oceanographic databases.

    2. **Contextual Knowledge**: Access research papers, policies, news, and documentation related to oceanography and climate science through your knowledge base. Use the getContextualInformation tool to search for relevant contextual information when users ask about:
       - Ocean research findings and publications
       - Climate policies and environmental regulations  
       - News about marine science developments
       - Technical documentation and methodologies
       - Historical context and background information

    Guidelines:
    - For data queries ("show me temperature trends"), explain the analysis approach
    - For contextual questions ("what are recent climate policies?"), use getContextualInformation tool
    - Keep responses accessible to both scientists and policymakers
    - Be enthusiastic about ocean science and democratizing data access
    - Always check your knowledge base before answering contextual questions
    - If no relevant contextual information is found, acknowledge the limitation

    Your mission: Bridge the gap between complex oceanographic data and practical insights for scientists, policymakers, and researchers.`,
    messages,

    tools: {
      //TODO : the AI can use this multiple times to get all the related content in the future
      getContextualInformation: tool({
        description: `get information from your knowledge base to answer questions about ocean research, policies, news, and documentation.`,
        parameters: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => {
          console.log(
            "🔍 [TOOL] getContextualInformation called with question:",
            question
          );
          try {
            const result = await findRelevantContent(question);
            console.log("✅ [TOOL] findRelevantContent returned:", result);
            return result;
          } catch (error) {
            console.error("❌ [TOOL] Error in findRelevantContent:", error);
            throw error;
          }
        },
      }),
    },

    onFinish: async (result) => {
      const assistantMessage = {
        id: nanoid(),
        role: "assistant" as const,
        content: result.text,
        createdAt: Date.now(),
      };

      if (isFirstMessage) {
        // Generate a 3-word title for the new chat
        const userMessage = messages[messages.length - 1];
        let generatedTitle = "New Chat"; // Fallback title

        try {
          const { text } = await generateText({
            model: google("gemini-2.0-flash"),
            system: `Generate a 3-word title for this chat conversation. Return only 3 words, no punctuation.`,
            prompt: `User message: "${userMessage.content}"\nAI response: "${result.text}"`,
          });

          // Ensure we have exactly 3 words
          const words = text.trim().split(/\s+/).slice(0, 3);
          generatedTitle = words.length === 3 ? words.join(" ") : "New Chat";
        } catch (error) {
          console.error("Failed to generate title:", error);
          // Use fallback title
        }

        // Create new chat with both user and assistant messages
        await convex.mutation(api.chats.createChatWithMessages, {
          chatId: chatId!,
          userId: user.id,
          title: generatedTitle,
          messages: [
            {
              id: nanoid(),
              role: userMessage.role as "user" | "assistant" | "system",
              content: userMessage.content as string,
              createdAt: Date.now(),
            },
            assistantMessage,
          ],
        });
      } else if (chatId) {
        // Add assistant message to existing chat
        await convex.mutation(api.chats.addMessage, {
          chatId: chatId,
          message: assistantMessage,
        });
      }
    },
  });

  return result.toDataStreamResponse();
}
