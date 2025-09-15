import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all chats for a user
export const getUserChats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc") // Most recent first
      .collect();

    return chats.map((chat) => ({
      _id: chat._id,
      chatId: chat.chatId, // Include the frontend chatId
      title: chat.title,
      messageCount: chat.messages.length,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      // Get preview from last user message
      preview:
        chat.messages
          .filter((msg) => msg.role === "user")
          .slice(-1)[0]
          ?.content?.slice(0, 50) + "..." || "No messages yet",
    }));
  },
});

// Get a specific chat with all messages
export const getChat = query({
  args: {
    chatId: v.string(), // Use string chatId instead of Convex ID
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();
    return chat;
  },
});

// Get chat messages only
export const getChatMessages = query({
  args: {
    chatId: v.string(), // Use string chatId instead of Convex ID
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();
    if (!chat) {
      return null;
    }
    return {
      messages: chat.messages,
      title: chat.title,
    };
  },
});
