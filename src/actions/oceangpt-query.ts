"use server";

import { z } from "zod";

// Schema for OceanGPT request
const OceanGPTRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  max_tokens: z.number().optional().default(1000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
});

// Schema for OceanGPT response
const OceanGPTResponseSchema = z.object({
  response: z.string(),
  status: z.string(),
});

export type OceanGPTRequest = z.infer<typeof OceanGPTRequestSchema>;
export type OceanGPTResponse = z.infer<typeof OceanGPTResponseSchema>;

/**
 * Server action to query OceanGPT model via FastAPI
 * This tool is specifically for oceanic and marine science queries
 */
export async function queryOceanGPT(params: {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Validate input parameters
    const validatedParams = OceanGPTRequestSchema.parse(params);

    const OCEANGPT_SERVER_URL =
      process.env.NEXT_PUBLIC_OCEANGPT_SERVER_URL || "http://localhost:8001";

    // Make request to FastAPI server
    const response = await fetch(`${OCEANGPT_SERVER_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: validatedParams.prompt,
        max_tokens: validatedParams.max_tokens,
        temperature: validatedParams.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate response
    const validatedResponse = OceanGPTResponseSchema.parse(data);

    if (validatedResponse.status !== "success") {
      throw new Error(`OceanGPT API error: ${validatedResponse.status}`);
    }

    return {
      success: true,
      data: validatedResponse.response,
    };
  } catch (error) {
    console.error("Error querying OceanGPT:", error);

    let errorMessage = "Failed to query OceanGPT";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
