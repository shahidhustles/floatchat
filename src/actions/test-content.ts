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
  } catch (error) {
    console.error("Error clearing data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
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
  } catch (error) {
    console.error("Error adding test content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
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
  } catch (error) {
    console.error("Error fetching resources:", error);
    return { success: false, error: "Failed to fetch resources" };
  }
}
