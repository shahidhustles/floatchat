"use server";

import { db } from "@/lib/db";
import { resources, embeddings } from "@/lib/db/schema";
import { generateEmbeddings } from "@/lib/ai/embedding";

export async function clearAllData() {
  try {
    // Delete embeddings first (due to foreign key constraint)
    await db.delete(embeddings);

    // Then delete resources
    await db.delete(resources);

    return {
      success: true,
      message: "All data cleared successfully",
    };
  } catch {
    return {
      success: false,
      error: "Unknown error occurred",
    };
  }
}

export async function addTestContent(content: string) {
  try {
    if (!content.trim()) {
      return { success: false, error: "Content cannot be empty" };
    }

    // Create the resource first
    const [resource] = await db
      .insert(resources)
      .values({ content: content.trim() })
      .returning();

    // Generate embeddings for the content
    const embeddings_data = await generateEmbeddings(content.trim());

    // Insert embeddings
    await db.insert(embeddings).values(
      embeddings_data.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      }))
    );

    return {
      success: true,
      message: `Successfully added content and generated ${embeddings_data.length} embeddings`,
      resourceId: resource.id,
    };
  } catch {
    return {
      success: false,
      error: "Unknown error occurred",
    };
  }
}

export async function getAllResources() {
  try {
    const allResources = await db
      .select({
        id: resources.id,
        content: resources.content,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .orderBy(resources.createdAt);

    return { success: true, resources: allResources };
  } catch {
    return { success: false, error: "Failed to fetch resources" };
  }
}
