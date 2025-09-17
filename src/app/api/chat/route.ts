import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type { CoreMessage } from "ai";
import { api } from "../../../../convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { convex } from "@/lib/convex/convex";
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

  console.log("🔧 [API] Implementing manual RAG approach");

  // Get the user's last message for searching embeddings
  const lastMessage = messages[messages.length - 1];
  const userQuery =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : "search query";

  console.log("🔍 [RAG] Searching for relevant content for:", userQuery);

  // Search for relevant content using embeddings
  let relevantContext = "";
  try {
    const results = await findRelevantContent(userQuery);
    console.log("✅ [RAG] Found", results?.length || 0, "relevant documents");

    if (results && results.length > 0) {
      relevantContext = results.map((r) => `- ${r.name}`).join("\n");
      console.log(
        "📄 [RAG] Context length:",
        relevantContext.length,
        "characters"
      );
    }
  } catch (error) {
    console.error("❌ [RAG] Error searching embeddings:", error);
  }

  // Enhanced system prompt with context injection
  const systemPrompt = `You are FloatChat, an expert AI oceanographer and marine data specialist.

${
  relevantContext
    ? `RELEVANT RESEARCH CONTEXT:
${relevantContext}

Based on the above research context and your expertise, provide a comprehensive and accurate response.`
    : ""
}

You have expertise in:
- Ocean data analysis and ARGO float measurements
- Oceanographic research and marine science concepts
- Climate policies and environmental regulations
- Marine science developments and research findings

Guidelines:
- Provide accurate, helpful information about oceanography and marine science
- If you have relevant context from research documents, incorporate that information into your response
- Keep responses accessible to both scientists and policymakers
- Be enthusiastic about ocean science and democratizing data access
- If no relevant information is found in the knowledge base, rely on your general expertise

Your mission: Bridge the gap between complex oceanographic data and practical insights for scientists, policymakers, and researchers.`;

  const result = streamText({
    model: google("gemini-2.5-pro"),
    system: systemPrompt,
    messages,

    onFinish: async (result) => {
      // Save the assistant message to convex
      const assistantMessage = {
        id: nanoid(),
        role: "assistant" as const,
        content: result.text,
        createdAt: Date.now(),
      };

      // Handle chat creation/update
      if (isFirstMessage) {
        // Generate a 3-word title for the new chat
        const userMessage = messages[messages.length - 1];
        let generatedTitle = "New Chat"; // Fallback title

        try {
          const { text } = await generateText({
            model: google("gemini-2.0-flash"),
            system: `Generate a 3-word title for this chat conversation. Return only 3 words, no punctuation.`,
            prompt: `User message: "${typeof userMessage.content === "string" ? userMessage.content : "user message"}"\nAI response: "${result.text}"`,
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
              content:
                typeof userMessage.content === "string"
                  ? userMessage.content
                  : "user message",
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
