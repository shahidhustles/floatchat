import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    chatId: v.string(), // Frontend-generated UUID
    userId: v.string(), // Clerk user ID
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
        createdAt: v.optional(v.number()), // timestamp
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]) // Index by userId for efficient queries
    .index("by_chatId", ["chatId"]), // Index by chatId for efficient lookups

  // NC File uploads and processing
  ncFiles: defineTable({
    userId: v.string(), // Clerk user ID
    filename: v.string(),
    storageId: v.id("_storage"), // Convex file storage ID
    fileSize: v.number(), // File size in bytes
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processingLog: v.optional(v.string()), // Error messages or processing info
    recordCount: v.optional(v.number()), // Number of records extracted
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
