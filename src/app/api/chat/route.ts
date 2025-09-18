import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
  generateText,
} from "ai";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { convex } from "@/lib/convex/convex";
import { api } from "../../../../convex/_generated/api";
import { findRelevantContent } from "@/lib/ai/embedding";

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

  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  console.log("📨 [API] Received messages:", messages.length);
  console.log(
    "💬 [API] Last message:",
    messages[messages.length - 1]?.parts
      ?.map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
  );

  // Enhanced system prompt for FloatChat
  const systemPrompt = `You are FloatChat, an expert AI oceanographer and marine data specialist.

You have expertise in:
- Ocean data analysis and ARGO float measurements
- Oceanographic research and marine science concepts
- Climate policies and environmental regulations
- Marine science developments and research findings

Guidelines:
- Check your knowledge base before answering any questions using the getInformation tool
- If you find relevant information in the knowledge base, use it to provide comprehensive responses
- If no relevant information is found in the tool calls, rely on your general expertise but mention that you're using general knowledge
- Keep responses accessible to both scientists and policymakers
- Be enthusiastic about ocean science and democratizing data access

Your mission: Bridge the gap between complex oceanographic data and practical insights for scientists, policymakers, and researchers.`;

  // Get existing messages from Convex if chatId is provided
  let existingMessages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt?: number;
  }> = [];
  if (chatId) {
    try {
      existingMessages =
        (await convex.query(api.chats.getMessagesForChat, { chatId })) || [];
      console.log(
        `📚 [API] Found ${existingMessages.length} existing messages for chat ${chatId}`
      );
    } catch {
      console.log(
        `📚 [API] No existing messages found for chat ${chatId}, starting new chat`
      );
    }
  }

  // Convert existing messages to UIMessage format and combine with current messages
  const existingUIMessages: UIMessage[] = existingMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }));

  // Combine existing messages with new messages (avoid duplicates)
  const existingIds = new Set(existingUIMessages.map((msg) => msg.id));
  const newMessages = messages.filter((msg) => !existingIds.has(msg.id));
  const allMessages = [...existingUIMessages, ...newMessages];

  console.log(
    `💬 [API] Processing ${allMessages.length} total messages (${existingUIMessages.length} existing + ${newMessages.length} new)`
  );

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: convertToModelMessages(allMessages),
    stopWhen: stepCountIs(5),
    tools: {
      // Get information from knowledge base
      getInformation: tool({
        description: `Search your knowledge base for relevant oceanographic information, ARGO float data, marine science research, or climate data.
        Use this before answering questions to find specific information from your knowledge base.`,
        inputSchema: z.object({
          question: z
            .string()
            .describe("The user's question or topic to search for"),
        }),
        execute: async ({ question }) => {
          console.log("🔍 [TOOL] Searching knowledge base for:", question);
          return await findRelevantContent(question);
        },
      }),
    },

    onFinish: async (result) => {
      console.log("🏁 [API] Generation finished, saving to Convex");

      // Determine if it's the first message for this chat
      const isFirstMessage = existingMessages.length === 0;

      // Save the assistant message to convex
      const assistantMessage = {
        id: nanoid(),
        role: "assistant" as const,
        content: result.text,
        createdAt: Date.now(),
      };

      // Handle chat creation/update
      if (isFirstMessage && chatId) {
        // Generate a 3-word title for the new chat
        const userMessage = newMessages[0];
        let generatedTitle = "Ocean Data Chat"; // Fallback title

        try {
          // Use AI to generate a meaningful 3-4 word title from the conversation
          const userContent =
            userMessage.parts
              ?.map((p) => (p.type === "text" ? p.text : ""))
              .join(" ") || "New Chat";

          const titleGeneration = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `Based on this conversation between a user and FloatChat (an AI oceanographer assistant), generate a concise 3-4 word title that captures the main topic:

User: ${userContent}
Assistant: ${result.text}

Generate only the title, no quotes or additional text. Keep it under 25 characters.`,
          });

          generatedTitle =
            titleGeneration.text.trim().substring(0, 25) || "Ocean Data Chat";
        } catch (error) {
          console.error("Failed to generate title:", error);
          // Fallback to simple word extraction if AI generation fails
          const userContent =
            userMessage.parts
              ?.map((p) => (p.type === "text" ? p.text : ""))
              .join(" ") || "New Chat";
          const words = userContent.trim().split(/\s+/);
          generatedTitle =
            words.length > 0
              ? words.slice(0, 3).join(" ").substring(0, 25)
              : "Ocean Data Chat";
        }

        // Create new chat with both first user message and assistant message
        const firstUserMessage = {
          id: nanoid(),
          role: "user" as const,
          content:
            userMessage.parts
              ?.map((p) => (p.type === "text" ? p.text : ""))
              .join(" ") || "user message",
          createdAt: Date.now(),
        };

        await convex.mutation(api.chats.createChatWithMessages, {
          chatId: chatId,
          userId: user.id,
          title: generatedTitle,
          messages: [firstUserMessage, assistantMessage],
        });
      } else if (chatId) {
        // For existing chats, save user message first, then assistant message
        if (newMessages.length > 0) {
          const lastUserMessage = newMessages[newMessages.length - 1];
          if (lastUserMessage.role === "user") {
            await convex.mutation(api.chats.addMessage, {
              chatId: chatId,
              message: {
                id: nanoid(),
                role: "user",
                content:
                  lastUserMessage.parts
                    ?.map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ") || "user message",
                createdAt: Date.now(),
              },
            });
          }
        }

        // Add assistant message to existing chat
        await convex.mutation(api.chats.addMessage, {
          chatId: chatId,
          message: assistantMessage,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
