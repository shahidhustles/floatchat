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
    filename: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const fileId = await ctx.db.insert("ncFiles", {
      userId: identity.subject,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("ncFiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Get file by ID with storage URL
export const getFileWithUrl = query({
  args: { fileId: v.id("ncFiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== identity.subject) {
      throw new Error("File not found or access denied");
    }

    const url = await ctx.storage.getUrl(file.storageId);
    return { ...file, url };
  },
});
