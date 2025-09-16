import { embed, embedMany } from "ai";
import { cohere } from "@ai-sdk/cohere";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema";
import { db } from "../db";

const embeddingModel = cohere.embedding("embed-english-v3.0");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

//for retrieval query embedding
export const generateEmbedding = async (content: string) => {
  console.log(
    "🚀 [EMBEDDING] generateEmbedding called with content length:",
    content.length
  );
  console.log(
    "📝 [EMBEDDING] Content preview:",
    content.substring(0, 200) + (content.length > 200 ? "..." : "")
  );

  try {
    const { embedding } = await embed({
      model: embeddingModel, // Use the same model as for storage
      value: content,
    });

    console.log(
      "✅ [EMBEDDING] Embedding generated successfully, dimensions:",
      embedding.length
    );
    return embedding;
  } catch (error) {
    console.error("❌ [EMBEDDING] Error generating embedding:", error);
    throw error;
  }
};

//for finding the related vectors.
export const findRelevantContent = async (userQuery: string) => {
  console.log(
    "🔍 [EMBEDDING] findRelevantContent called with query:",
    userQuery
  );

  try {
    console.log("📝 [EMBEDDING] Generating embedding for query...");
    const userQueryEmbedded = await generateEmbedding(userQuery);
    console.log(
      "✅ [EMBEDDING] Query embedding generated, length:",
      userQueryEmbedded.length
    );

    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded
    )})`;

    console.log("🔍 [EMBEDDING] Searching database for similar content...");

    // First, let's see what's in the database
    const allEmbeddings = await db
      .select({ content: embeddings.content })
      .from(embeddings)
      .limit(5);
    console.log(
      "📚 [EMBEDDING] Sample content in database:",
      allEmbeddings.map((e) => e.content.substring(0, 100) + "...")
    );

    const similarGuides = await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.1)) // Lowered from 0.5 to 0.1 for better matching
      .orderBy((t) => desc(t.similarity))
      .limit(10);

    console.log(
      "📊 [EMBEDDING] Found",
      similarGuides.length,
      "similar results"
    );
    console.log(
      "📋 [EMBEDDING] Results:",
      similarGuides.map((r) => ({
        similarity: r.similarity,
        preview: r.name.substring(0, 100) + "...",
      }))
    );

    return similarGuides;
  } catch (error) {
    console.error("❌ [EMBEDDING] Error in findRelevantContent:", error);
    throw error;
  }
};

//for saving the content to db.
export const saveToDatabase = async (
  embeddingData: {
    content: string;
    embedding: number[];
  }[]
) => {
  return await db.insert(embeddings).values(embeddingData);
};
