CREATE TABLE `admins` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`platform` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`author_id` text NOT NULL,
	`download_key` text,
	`download_name` text,
	`download_type` text,
	`download_size` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
