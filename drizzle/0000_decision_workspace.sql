-- Purpose: Create owner-scoped policy/report storage, quotas and revocable shares.
CREATE TABLE `policies` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`body` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policy_owner_name_version` ON `policies` (`owner`,`name`,`version`);--> statement-breakpoint
CREATE TABLE `quotas` (
	`owner` text NOT NULL,
	`bucket` integer NOT NULL,
	`used` integer NOT NULL,
	PRIMARY KEY(`owner`, `bucket`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`created` text NOT NULL,
	`body` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`owner` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL,
	`body` text NOT NULL
);
