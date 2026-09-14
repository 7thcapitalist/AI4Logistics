CREATE TABLE `document_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`document_id` integer NOT NULL,
	`event` text NOT NULL,
	`payload` text,
	`occurred_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`external_id` text,
	`access_key` text,
	`protocol_number` text,
	`rejection_reason` text,
	`rejection_code` text,
	`xml_blob_key` text,
	`idempotency_key` text NOT NULL,
	`attempt_group` integer DEFAULT 1 NOT NULL,
	`authorized_at` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`name` text NOT NULL,
	`cpf` text NOT NULL,
	`phone` text NOT NULL,
	`is_autonomous` integer DEFAULT false NOT NULL,
	`rntrc` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fiscal_provider_outages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`run_after` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`payload` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cnpj` text NOT NULL,
	`antt_number` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`photo_blob_key` text NOT NULL,
	`signature_blob_key` text,
	`latitude` text,
	`longitude` text,
	`captured_at` integer NOT NULL,
	`synced_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`freight_cents` integer NOT NULL,
	`fuel_cents` integer DEFAULT 0 NOT NULL,
	`toll_cents` integer DEFAULT 0 NOT NULL,
	`advance_cents` integer DEFAULT 0 NOT NULL,
	`other_cents` integer DEFAULT 0 NOT NULL,
	`payout_cents` integer NOT NULL,
	`adjustment_cents` integer DEFAULT 0 NOT NULL,
	`adjustment_note` text,
	`finalized_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trip_costs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`kind` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`driver_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`origin_city` text NOT NULL,
	`origin_uf` text NOT NULL,
	`dest_city` text NOT NULL,
	`dest_uf` text NOT NULL,
	`cargo_description` text NOT NULL,
	`cargo_weight_kg` integer,
	`freight_cents` integer NOT NULL,
	`departed_at` integer,
	`delivered_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`plate` text NOT NULL,
	`renavam` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `document_events_org_doc_idx` ON `document_events` (`org_id`,`document_id`,`occurred_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `documents_idempotency_idx` ON `documents` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `documents_org_trip_idx` ON `documents` (`org_id`,`trip_id`);--> statement-breakpoint
CREATE INDEX `documents_open_mdfe_idx` ON `documents` (`kind`,`status`,`closed_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_org_cpf_idx` ON `drivers` (`org_id`,`cpf`);--> statement-breakpoint
CREATE INDEX `jobs_due_idx` ON `jobs` (`status`,`run_after`);--> statement-breakpoint
CREATE INDEX `jobs_org_idx` ON `jobs` (`org_id`,`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_cnpj_idx` ON `organizations` (`cnpj`);--> statement-breakpoint
CREATE INDEX `pods_org_trip_idx` ON `pods` (`org_id`,`trip_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `settlements_org_trip_idx` ON `settlements` (`org_id`,`trip_id`);--> statement-breakpoint
CREATE INDEX `trip_costs_org_trip_idx` ON `trip_costs` (`org_id`,`trip_id`);--> statement-breakpoint
CREATE INDEX `trips_org_status_idx` ON `trips` (`org_id`,`status`);--> statement-breakpoint
CREATE INDEX `trips_org_created_idx` ON `trips` (`org_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_org_phone_idx` ON `users` (`org_id`,`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_org_plate_idx` ON `vehicles` (`org_id`,`plate`);