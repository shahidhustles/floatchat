import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type { CoreMessage } from "ai";
import { api } from "../../../../convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { convex } from "@/lib/convex";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatId }: { messages: CoreMessage[]; chatId?: string } =
    await req.json();

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

  const result = streamText({
    model: google("gemini-2.5-flash"),

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
            model: google("gemini-1.5-flash"),
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
