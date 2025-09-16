
import { ConvexHttpClient } from "convex/browser";

// Server-side client for API routes
export const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
