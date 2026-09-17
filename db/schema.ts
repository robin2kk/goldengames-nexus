import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  platform: text("platform").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("draft"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  authorId: text("author_id").notNull(),
  imageKey: text("image_key"),
  imageName: text("image_name"),
  imageType: text("image_type"),
  imageSize: integer("image_size"),
  downloadKey: text("download_key"),
  downloadName: text("download_name"),
  downloadType: text("download_type"),
  downloadSize: integer("download_size"),
  youtubeId: text("youtube_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_posts_status_created").on(table.status, table.createdAt),
]);
