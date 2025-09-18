import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get a chat by chatId
export const getChat = query({
  args: {
    id: v.string(), // Frontend chatId
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.id))
      .first();
    return chat;
  },
});

// Get messages for a specific chat
export const getMessagesForChat = query({
  args: {
    chatId: v.string(), // Frontend chatId
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      return [];
    }

    return chat.messages || [];
  },
});

// Create a new chat
export const createChat = mutation({
  args: {
    chatId: v.string(), // Frontend-generated UUID
    userId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chats", {
      chatId: args.chatId,
      userId: args.userId,
      title: args.title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.chatId; // Return the frontend chatId, not the Convex ID
  },
});

// Add a message to a chat
export const addMessage = mutation({
  args: {
    chatId: v.string(), // Frontend chatId, not Convex ID
    message: v.object({
      id: v.string(),
      role: v.union(
        v.literal("user"),
        v.literal("assistant"),
        v.literal("system")
      ),
      content: v.string(),
      createdAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const updatedMessages = [...chat.messages, args.message];

    await ctx.db.patch(chat._id, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    return args.chatId;
  },
});

// Update chat title
export const updateChatTitle = mutation({
  args: {
    chatId: v.string(), // Use string chatId instead of Convex ID
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    await ctx.db.patch(chat._id, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return args.chatId;
  },
});

// Delete a chat
export const deleteChat = mutation({
  args: {
    chatId: v.string(), // Use string chatId instead of Convex ID
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    await ctx.db.delete(chat._id);
    return true;
  },
});

// Create a new chat with initial messages (user + AI response)
export const createChatWithMessages = mutation({
  args: {
    chatId: v.string(), // Frontend-generated UUID
    userId: v.string(),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(
          v.literal("user"),
          v.literal("assistant"),
          v.literal("system")
        ),
        content: v.string(),
        createdAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if chat already exists to prevent duplicates
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existingChat) {
      // Chat already exists, just add the new messages to it
      const updatedMessages = [...existingChat.messages, ...args.messages];
      await ctx.db.patch(existingChat._id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
      return args.chatId;
    }

    // Create new chat if it doesn't exist
    await ctx.db.insert("chats", {
      chatId: args.chatId,
      userId: args.userId,
      title: args.title,
      messages: args.messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.chatId; // Return the frontend chatId
  },
});

// Add multiple messages at once (for batch operations)
export const addMessages = mutation({
  args: {
    chatId: v.string(), // Frontend chatId, not Convex ID
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(
          v.literal("user"),
          v.literal("assistant"),
          v.literal("system")
        ),
        content: v.string(),
        createdAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const updatedMessages = [...chat.messages, ...args.messages];

    await ctx.db.patch(chat._id, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    return args.chatId;
  },
});
