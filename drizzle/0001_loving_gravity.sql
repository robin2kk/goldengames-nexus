CREATE INDEX `idx_posts_status_created` ON `posts` (`status`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
