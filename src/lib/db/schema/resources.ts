import { nanoid } from "@/lib/utils";
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const resources = pgTable("resources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources);
export type InsertResource = typeof resources.$inferInsert;
export type SelectResource = typeof resources.$inferSelect;
export type NewResourceParams = Omit<
  InsertResource,
  "id" | "createdAt" | "updatedAt"
>;
