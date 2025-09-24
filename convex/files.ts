import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for NC files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after successful upload
export const saveFile = mutation({
  args: {
    userId: v.string(),
    filename: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    // No auth check needed - userId comes from Clerk frontend
    const fileId = await ctx.db.insert("ncFiles", {
      userId: args.userId,
      filename: args.filename,
      storageId: args.storageId,
      fileSize: args.fileSize,
      status: "uploaded",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return fileId;
  },
});

// Update file processing status
export const updateFileStatus = mutation({
  args: {
    fileId: v.id("ncFiles"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processingLog: v.optional(v.string()),
    recordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // No auth check - this is called by Python server
    await ctx.db.patch(args.fileId, {
      status: args.status,
      processingLog: args.processingLog,
      recordCount: args.recordCount,
      updatedAt: Date.now(),
    });
  },
});

// Get user's uploaded files
export const getUserFiles = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ncFiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get file by ID with storage URL
export const getFileWithUrl = query({
  args: { fileId: v.id("ncFiles") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const url = await ctx.storage.getUrl(file.storageId);
    return { ...file, url };
  },
});
