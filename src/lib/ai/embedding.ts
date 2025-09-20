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
  try {
    const { embedding } = await embed({
      model: embeddingModel, // Use the same model as for storage
      value: content,
    });

    return embedding;
  } catch (error) {
    throw error;
  }
};

//for finding the related vectors.
export const findRelevantContent = async (userQuery: string) => {
  try {
    const userQueryEmbedded = await generateEmbedding(userQuery);

    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded
    )})`;

    const similarGuides = await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.1)) // Lowered from 0.5 to 0.1 for better matching
      .orderBy((t) => desc(t.similarity))
      .limit(10);

    return similarGuides;
  } catch (error) {
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
