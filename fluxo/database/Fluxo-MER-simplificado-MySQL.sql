-- Fluxo Pessoal | Esquema simplificado conforme MER entregue
-- Dialeto: MySQL 8.0+ | Apenas estrutura (sem dados)
-- Baseado em fluxo-pessoal-mer.drawio e Fluxo-D1-completo.sql.
-- Os campos com nomes diferentes da versão completa seguem exatamente o MER.
-- ATENÇÃO: Execute em banco novo; não é script de migração de dados.

CREATE DATABASE IF NOT EXISTS `fluxo_pessoal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fluxo_pessoal`;

-- users: 8 campos
CREATE TABLE `users` (
    `id` VARCHAR(64) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `password_salt` VARCHAR(255) NOT NULL,
    `password_iterations` INT DEFAULT 210000,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- accounts: 14 campos
CREATE TABLE `accounts` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `institution` VARCHAR(255),
    `currency_code` CHAR(3) DEFAULT 'BRL',
    `kind` VARCHAR(255) NOT NULL,
    `balance_cents` BIGINT,
    `goal_cents` BIGINT,
    `monthly_yield_basis_points` INT,
    `fixed` BOOLEAN DEFAULT FALSE,
    `exclude_from_totals` BOOLEAN DEFAULT FALSE,
    `color` VARCHAR(16),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_accounts_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- cards: 23 campos
CREATE TABLE `cards` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `linked_account` INT,
    `kind` VARCHAR(255) NOT NULL,
    `brand` VARCHAR(255),
    `tier` VARCHAR(255),
    `last4` VARCHAR(4),
    `limit_cents` BIGINT,
    `closing_day` INT,
    `due_day` INT,
    `due_adjustment` VARCHAR(255),
    `points_per_dollar_milli` BIGINT,
    `cashback_basis_points` INT,
    `reward_mode` VARCHAR(255),
    `points_goal` INT,
    `manual_usd_rate_micros` BIGINT,
    `color` VARCHAR(16),
    `image_data` LONGTEXT,
    `is_favorite` BOOLEAN DEFAULT FALSE,
    `sort_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_cards_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- categories: 8 campos
CREATE TABLE `categories` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `kind` VARCHAR(255) NOT NULL,
    `color` VARCHAR(16),
    `icon` VARCHAR(255),
    `essential` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_categories_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- trips: 9 campos
CREATE TABLE `trips` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `currency` CHAR(3) DEFAULT 'BRL',
    `exchange_rate_micros` BIGINT DEFAULT 1000000,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_trips_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- recurring_entries: 17 campos
CREATE TABLE `recurring_entries` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255),
    `account` INT,
    `amount_cents` BIGINT NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `day_of_month` INT NOT NULL,
    `calculation_mode` VARCHAR(255),
    `schedule_mode` VARCHAR(255),
    `date_adjustment` VARCHAR(255),
    `payment_method` VARCHAR(255),
    `card_id` VARCHAR(64),
    `active` BOOLEAN DEFAULT TRUE,
    `last_confirmed_month` CHAR(7),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_recurring_entries_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_recurring_entries_card_id` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reward_redemptions: 9 campos
CREATE TABLE `reward_redemptions` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `card_id` VARCHAR(64),
    `kind` VARCHAR(255) NOT NULL,
    `amount_milli` BIGINT NOT NULL,
    `account` INT,
    `redeemed_at` DATETIME NOT NULL,
    `note` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_reward_redemptions_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reward_redemptions_card_id` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transactions: 36 campos
CREATE TABLE `transactions` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255),
    `account` INT,
    `destination_account` INT,
    `occurred_at` DATETIME NOT NULL,
    `amount_cents` BIGINT NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `installments` INT,
    `installment_group_id` VARCHAR(64),
    `import_batch_id` VARCHAR(64),
    `import_batch_name` VARCHAR(255),
    `import_batch_month` CHAR(7),
    `imported_at` DATETIME,
    `status` VARCHAR(255),
    `source` VARCHAR(255),
    `payment_method` VARCHAR(255),
    `card_id` VARCHAR(64),
    `trip_id` VARCHAR(64),
    `invoice_month` CHAR(7),
    `reward_points_milli` BIGINT,
    `reward_cashback_cents` BIGINT,
    `reward_usd_rate_micros` BIGINT,
    `fingerprint` VARCHAR(128),
    `version` INT DEFAULT 1,
    `deleted_at` DATETIME,
    `device_id` VARCHAR(128),
    `last_mutation_id` VARCHAR(64),
    `auto_imported` BOOLEAN DEFAULT FALSE,
    `review_status` VARCHAR(255),
    `source_app` VARCHAR(255),
    `raw_text` TEXT,
    `confidence` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_transactions_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transactions_card_id` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_transactions_trip_id` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ai_usage_daily: 6 campos
CREATE TABLE `ai_usage_daily` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `feature` VARCHAR(255) NOT NULL,
    `usage_day` DATE NOT NULL,
    `request_count` INT DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ai_usage_daily_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- establishment_rules: 5 campos
CREATE TABLE `establishment_rules` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `match_text` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_establishment_rules_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- installment_labels: 5 campos
CREATE TABLE `installment_labels` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `group_id` VARCHAR(64) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_installment_labels_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- notification_app_rules: 8 campos
CREATE TABLE `notification_app_rules` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `source_app` VARCHAR(255) NOT NULL,
    `action` VARCHAR(255) NOT NULL,
    `account_id` VARCHAR(64),
    `card_id` VARCHAR(64),
    `default_category` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_notification_app_rules_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notification_app_rules_account_id` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_notification_app_rules_card_id` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- pending_auto_transactions: 15 campos
CREATE TABLE `pending_auto_transactions` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `source_app` VARCHAR(255) NOT NULL,
    `raw_text` TEXT NOT NULL,
    `confidence` INT,
    `description` VARCHAR(255),
    `amount_cents` BIGINT,
    `type` VARCHAR(255),
    `occurred_at` DATETIME,
    `suggested_category` VARCHAR(255),
    `suggested_account` INT,
    `card_id` VARCHAR(64),
    `review_status` VARCHAR(255),
    `ignore_reason` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_pending_auto_transactions_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pending_auto_transactions_card_id` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- auth_rate_limits: 6 campos
CREATE TABLE `auth_rate_limits` (
    `key_hash` VARCHAR(64) NOT NULL,
    `scope` VARCHAR(255) NOT NULL,
    `failures` INT DEFAULT 0,
    `window_started_at` DATETIME NOT NULL,
    `blocked_until` DATETIME,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`key_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- mobile_devices: 12 campos
CREATE TABLE `mobile_devices` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `device_id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255),
    `platform` VARCHAR(255),
    `app_version` INT,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `revoked_at` DATETIME,
    `last_seen_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mobile_devices_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- push_subscriptions: 9 campos
CREATE TABLE `push_subscriptions` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `device_id` VARCHAR(128) NOT NULL,
    `expo_push_token` VARCHAR(255) NOT NULL,
    `platform` VARCHAR(255),
    `active` BOOLEAN DEFAULT TRUE,
    `last_registered_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_push_subscriptions_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- sync_mutations: 10 campos
CREATE TABLE `sync_mutations` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `mutation_id` VARCHAR(128) NOT NULL,
    `device_id` VARCHAR(128) NOT NULL,
    `entity_type` VARCHAR(255) NOT NULL,
    `entity_id` VARCHAR(64) NOT NULL,
    `operation` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `response_json` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_sync_mutations_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- web_sessions: 8 campos
CREATE TABLE `web_sessions` (
    `id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `revoked_at` DATETIME,
    `last_seen_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_web_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- developer_feedback: 8 campos
CREATE TABLE `developer_feedback` (
    `id` VARCHAR(64) NOT NULL,
    `sender_owner_id` VARCHAR(64) NOT NULL,
    `sender_name` VARCHAR(255),
    `message` TEXT NOT NULL,
    `status` VARCHAR(255),
    `developer_comment` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_developer_feedback_sender_owner_id` FOREIGN KEY (`sender_owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- app_notifications: 8 campos
CREATE TABLE `app_notifications` (
    `id` VARCHAR(64) NOT NULL,
    `owner_id` VARCHAR(64) NOT NULL,
    `kind` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `feedback_id` VARCHAR(64),
    `read_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_app_notifications_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_app_notifications_feedback_id` FOREIGN KEY (`feedback_id`) REFERENCES `developer_feedback`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- user_profiles: 3 campos
CREATE TABLE `user_profiles` (
    `owner_id` VARCHAR(64) NOT NULL,
    `avatar_data` LONGTEXT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices de apoio para chaves de acesso e consultas frequentes
CREATE UNIQUE INDEX `uq_users_email` ON `users` (`email`);
CREATE UNIQUE INDEX `uq_ai_usage_owner_feature_day` ON `ai_usage_daily` (`owner_id`, `feature`, `usage_day`);
CREATE UNIQUE INDEX `uq_sync_mutations_owner_mutation` ON `sync_mutations` (`owner_id`, `mutation_id`);
CREATE UNIQUE INDEX `uq_mobile_devices_owner_device` ON `mobile_devices` (`owner_id`, `device_id`);
