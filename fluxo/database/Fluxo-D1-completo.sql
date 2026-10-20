PRAGMA defer_foreign_keys=TRUE;

/* Aqui inicializa a tabela para as migrações feitas no fluxo. */
CREATE TABLE _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

/* Aqui inicializa a tabela para o controle de logins da aplicaçãao. */
CREATE TABLE `auth_attempts` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`window_started_at` text NOT NULL,
	`blocked_until` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

/*Essa tabela serve para armazenar as sessões de login dos usuários, incluindo informações sobre o dispositivo, plataforma e versão do aplicativo.
 Ela também mantém o estado da sessão, como data de expiração e revogação, além de registrar a última vez que a sessão foi vista.
 A tabela possui uma chave estrangeira referenciando a tabela de usuários para garantir a integridade dos dados.*/
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`token_hash` text NOT NULL,
	`device_id` text,
	`device_name` text,
	`platform` text,
	`app_version` text,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena informações adicionais sobre os perfis dos usuários, como a URL do avatar e as preferências do usuário.
 Ela possui uma chave estrangeira referenciando a tabela de usuários para garantir a integridade dos dados.*/
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar_url` text,
	`preferences` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena informações sobre os usuários, incluindo email, nome de exibição e informações de senha.
 Ela possui uma chave primária na coluna "id" e garante que o email seja único para cada usuário.*/
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer DEFAULT 210000 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

/*Essa tabela armazena informações sobre as contas financeiras dos usuários, incluindo nome, instituição, tipo de conta, moeda e saldo inicial.
 Ela possui uma chave primária na coluna "id" e uma chave estrangeira referenciando a tabela de usuários para garantir a integridade dos dados.*/
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`institution` text DEFAULT 'manual' NOT NULL,
	`kind` text NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`opening_balance_cents` integer DEFAULT 0 NOT NULL,
	`opened_on` text NOT NULL,
	`goal_cents` integer,
	`monthly_yield_basis_points` integer DEFAULT 0 NOT NULL,
	`include_in_totals` integer DEFAULT true NOT NULL,
	`is_protected` integer DEFAULT false NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena as informações dos cartões dos usuários, incluindo nome, tipo, marca, limite, datas de fechamento e vencimento, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários e contas para garantir a integridade dos dados, e integração entre as contas e os cartões.*/
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`payment_account_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`tier` text DEFAULT '' NOT NULL,
	`last4` text DEFAULT '' NOT NULL,
	`limit_cents` integer DEFAULT 0 NOT NULL,
	`closing_day` integer NOT NULL,
	`due_day` integer NOT NULL,
	`due_adjustment` text DEFAULT 'next' NOT NULL,
	`reward_mode` text DEFAULT 'none' NOT NULL,
	`points_per_dollar_milli` integer DEFAULT 0 NOT NULL,
	`cashback_basis_points` integer DEFAULT 0 NOT NULL,
	`points_goal` integer DEFAULT 0 NOT NULL,
	`manual_usd_rate_micros` integer DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`image_url` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, `closing_adjustment` text DEFAULT 'previous' NOT NULL, `points_opening_milli` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);

/*Essa tabela armazena informações sobre as categorias de despesas e receitas dos usuários, incluindo nome, tipo, cor, ícone e outras propriedades.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários e categorias para garantir a integridade dos dados e permitir a criação de categorias hierárquicas.*/
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`parent_id` text,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`icon` text DEFAULT 'tag' NOT NULL,
	`is_essential` integer DEFAULT false NOT NULL,
	`exclude_from_free_to_spend` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);

/*Aqui é uma ideia de vincular viagens a certos períodos de gastos, para o controle específico dos gastos na viagem além de manter o controle de gastos gerais. 
A tabela de viagens possui uma chave primária na coluna "id" e uma chave estrangeira referenciando a tabela de usuários para garantir a integridade dos dados.*/
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`exchange_rate_micros` integer DEFAULT 1000000 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena informações sobre os planos de parcelamento dos usuários, incluindo descrição, valor total, número de parcelas, datas de compra e competência, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários, cartões e categorias para garantir a integridade dos dados.*/
CREATE TABLE `installment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`category_id` text,
	`description` text NOT NULL,
	`total_amount_cents` integer NOT NULL,
	`installment_count` integer NOT NULL,
	`purchase_date` text NOT NULL,
	`first_competence` text NOT NULL,
	`monthly_interest_basis_points` integer DEFAULT 0 NOT NULL,
	`label` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);

/*Essa tabela armazena informações sobre as faturas dos cartões dos usuários, incluindo competência, datas de fechamento e vencimento, status e datas de pagamento, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários e cartões para garantir a integridade dos dados.*/
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`competence` text NOT NULL,
	`closing_date` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`closed_at` text,
	`paid_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena informações sobre os lançamentos contábeis dos usuários, incluindo o valor, a data de efetivação, a competência e o estado do lançamento, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários, transações, contas e cartões para garantir a integridade dos dados.*/
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text,
	`card_id` text,
	`amount_cents` integer NOT NULL,
	`effective_on` text NOT NULL,
	`competence` text NOT NULL,
	`state` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, `kind` text DEFAULT 'expense' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);

/*Essa tabela armazena informações sobre as transações financeiras dos usuários, incluindo o tipo, o estado, a origem, a descrição, a categoria, o valor e a data de ocorrência da transação, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários, categorias, contas e cartões para garantir a integridade dos dados.*/
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`state` text DEFAULT 'confirmed' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`occurred_on` text NOT NULL,
	`competence` text NOT NULL,
	`origin_account_id` text,
	`origin_card_id` text,
	`destination_account_id` text,
	`destination_card_id` text,
	`trip_id` text,
	`installment_plan_id` text,
	`installment_number` integer,
	`invoice_id` text,
	`notes` text,
	`fingerprint` text,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	`last_mutation_id` text,
	`device_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, `recurrence_id` text, `reward_points_milli` integer, `reward_cashback_cents` integer, `reward_usd_rate_micros` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`origin_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`origin_card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`installment_plan_id`) REFERENCES `installment_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null
);

/*Essa tabela armazena informações sobre as execuções de recorrências, incluindo o usuário, a recorrência, a competência, o resultado, a data agendada e o valor da execução, entre outros.
 Ela possui uma chave primária na coluna "id" e chaves estrangeiras referenciando as tabelas de usuários, recorrências e transações para garantir a integridade dos dados.*/
CREATE TABLE `recurrence_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recurrence_id` text NOT NULL,
	`competence` text NOT NULL,
	`transaction_id` text,
	`outcome` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`ran_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recurrence_id`) REFERENCES `recurrences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `recurrences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'standard' NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`account_id` text,
	`card_id` text,
	`destination_account_id` text,
	`amount_cents` integer NOT NULL,
	`amount_mode` text DEFAULT 'fixed' NOT NULL,
	`schedule_mode` text DEFAULT 'day_of_month' NOT NULL,
	`schedule_day` integer NOT NULL,
	`day_adjustment` text DEFAULT 'next' NOT NULL,
	`interval` text DEFAULT 'monthly' NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`is_active` integer DEFAULT true NOT NULL,
	`auto_confirm` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, `subscription_label_id` text, `capture_match` text, `capture_ignore` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `categorization_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`match_text` text NOT NULL,
	`category_id` text NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`filename` text NOT NULL,
	`format` text NOT NULL,
	`target_account_id` text,
	`target_card_id` text,
	`competence` text,
	`status` text DEFAULT 'review' NOT NULL,
	`found_count` integer DEFAULT 0 NOT NULL,
	`fresh_count` integer DEFAULT 0 NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`without_category_count` integer DEFAULT 0 NOT NULL,
	`possible_transfer_count` integer DEFAULT 0 NOT NULL,
	`discarded_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`committed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `import_items` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`user_id` text NOT NULL,
	`raw_text` text NOT NULL,
	`external_id` text,
	`occurred_on` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`installment_current` integer,
	`installment_total` integer,
	`fingerprint` text NOT NULL,
	`verdict` text NOT NULL,
	`category_id` text,
	`transfer_counterpart_id` text,
	`decision` text DEFAULT 'pendente' NOT NULL,
	`transaction_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transfer_counterpart_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `goal_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`goal_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`target_cents` integer NOT NULL,
	`monthly_contribution_cents` integer DEFAULT 0 NOT NULL,
	`target_date` text,
	`account_id` text,
	`color` text DEFAULT '#7c5cff' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `investment_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`investment_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`investment_id`) REFERENCES `investments`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `investments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text,
	`name` text NOT NULL,
	`institution` text DEFAULT '' NOT NULL,
	`asset_class` text DEFAULT 'fixed_income' NOT NULL,
	`liquidity` text DEFAULT 'daily' NOT NULL,
	`maturity_date` text,
	`principal_cents` integer DEFAULT 0 NOT NULL,
	`current_value_cents` integer DEFAULT 0 NOT NULL,
	`valued_on` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `exchange_rates` (
	`currency` text NOT NULL,
	`quoted_on` text NOT NULL,
	`rate_micros` integer NOT NULL,
	`source` text DEFAULT 'BCB PTAX' NOT NULL,
	`fetched_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE `reward_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`account_id` text,
	`transaction_id` text,
	`redeemed_on` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`usage_day` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `capture_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_app` text NOT NULL,
	`raw_text` text NOT NULL,
	`description` text NOT NULL,
	`merchant` text,
	`amount_cents` integer NOT NULL,
	`kind` text NOT NULL,
	`method` text DEFAULT 'unknown' NOT NULL,
	`installment_current` integer,
	`installment_total` integer,
	`confidence_milli` integer DEFAULT 0 NOT NULL,
	`posted_at` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`transaction_id` text,
	`device_event_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, suggested_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, category_confidence_milli INTEGER NOT NULL DEFAULT 0, `subscription_id` text REFERENCES recurrences(id),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `capture_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_app` text NOT NULL,
	`label` text,
	`action` text DEFAULT 'ignore' NOT NULL,
	`default_account_id` text,
	`default_card_id` text,
	`default_category_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`default_card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`default_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `sync_mutations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mutation_id` text NOT NULL,
	`device_id` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`status` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pairing_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`poll_token` text NOT NULL,
	`device_id` text NOT NULL,
	`device_name` text,
	`platform` text,
	`app_version` text,
	`approved_by_user_id` text,
	`approved_at` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`email` text,
	`phone` text,
	`document` text,
	`notes` text,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `project_deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`environment` text DEFAULT 'production' NOT NULL,
	`provider` text,
	`domain` text,
	`status` text DEFAULT 'unknown' NOT NULL,
	`last_deployed_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `project_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`summary` text NOT NULL,
	`details` text,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `project_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`due_on` text NOT NULL,
	`received_on` text,
	`transaction_id` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, received_amount_cents INTEGER,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `project_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`kind` text DEFAULT 'feature' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`due_on` text,
	`estimate_milli` integer DEFAULT 0 NOT NULL,
	`billable` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, group_id TEXT REFERENCES project_checklist_groups(id) ON DELETE SET NULL, archived_at TEXT,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`starts_on` text,
	`due_on` text,
	`delivered_on` text,
	`contract_cents` integer DEFAULT 0 NOT NULL,
	`hourly_rate_cents` integer DEFAULT 0 NOT NULL,
	`estimated_hours_milli` integer DEFAULT 0 NOT NULL,
	`repository_url` text,
	`main_branch` text,
	`production_url` text,
	`documentation_url` text,
	`notes` text,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, `infra_url` text, `admin_url` text, `admin_user` text, `credentials_hint` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`client_id` text,
	`title` text NOT NULL,
	`scope` text,
	`conditions` text,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`deadline_days` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`sent_on` text,
	`decided_on` text,
	`file_url` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `capture_reconciliations` (
	`capture_event_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`rule_id` text,
	`target` text NOT NULL,
	`payment_id` text,
	`outcome` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`capture_event_id`) REFERENCES `capture_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rule_id`) REFERENCES `receipt_rules`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`payment_id`) REFERENCES `project_payments`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `receipt_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`payer_name` text NOT NULL,
	`target` text NOT NULL,
	`project_id` text,
	`account_id` text NOT NULL,
	`category_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_matched_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `subscription_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "time_entries" (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`task_id` text,
	`worked_on` text NOT NULL,
	`duration_milli` integer NOT NULL,
	`description` text NOT NULL,
	`activity` text DEFAULT 'development' NOT NULL,
	`billable` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `project_tasks`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `project_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`notes` text,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `project_document_blobs` (
	`document_id` text PRIMARY KEY NOT NULL,
	`content` blob NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `project_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `card_images` (
	`card_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` blob NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE project_checklist_groups (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE integration_credentials (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'github')),
  nonce TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, provider)
);
CREATE TABLE integration_preferences (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_provider TEXT CHECK (ai_provider IN ('gemini', 'openai')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX `auth_attempts_updated_idx` ON `auth_attempts` (`updated_at`);
CREATE UNIQUE INDEX `sessions_token_unq` ON `sessions` (`token_hash`);
CREATE INDEX `sessions_user_kind_idx` ON `sessions` (`user_id`,`kind`);
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);
CREATE UNIQUE INDEX `users_email_unq` ON `users` (`email`);
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);
CREATE INDEX `cards_user_idx` ON `cards` (`user_id`);
CREATE INDEX `cards_payment_account_idx` ON `cards` (`payment_account_id`);
CREATE INDEX `categories_user_parent_idx` ON `categories` (`user_id`,`parent_id`);
CREATE UNIQUE INDEX `trips_user_name_start_unq` ON `trips` (`user_id`,`name`,`start_date`);
CREATE INDEX `trips_user_period_idx` ON `trips` (`user_id`,`start_date`);
CREATE INDEX `installment_plans_user_status_idx` ON `installment_plans` (`user_id`,`status`);
CREATE INDEX `installment_plans_card_idx` ON `installment_plans` (`card_id`);
CREATE UNIQUE INDEX `invoices_card_competence_unq` ON `invoices` (`card_id`,`competence`);
CREATE INDEX `invoices_user_due_idx` ON `invoices` (`user_id`,`due_date`);
CREATE INDEX `ledger_account_date_idx` ON `ledger_entries` (`user_id`,`account_id`,`effective_on`);
CREATE INDEX `ledger_card_competence_idx` ON `ledger_entries` (`user_id`,`card_id`,`competence`);
CREATE INDEX `ledger_transaction_idx` ON `ledger_entries` (`transaction_id`);
CREATE INDEX `ledger_user_state_date_idx` ON `ledger_entries` (`user_id`,`state`,`effective_on`);
CREATE UNIQUE INDEX `transactions_user_fingerprint_unq` ON `transactions` (`user_id`,`fingerprint`);
CREATE INDEX `transactions_user_occurred_idx` ON `transactions` (`user_id`,`occurred_on`);
CREATE INDEX `transactions_user_competence_idx` ON `transactions` (`user_id`,`competence`);
CREATE INDEX `transactions_user_updated_idx` ON `transactions` (`user_id`,`updated_at`);
CREATE INDEX `transactions_plan_idx` ON `transactions` (`installment_plan_id`,`installment_number`);
CREATE INDEX `transactions_invoice_idx` ON `transactions` (`invoice_id`);
CREATE INDEX `transactions_trip_idx` ON `transactions` (`user_id`,`trip_id`);
CREATE UNIQUE INDEX `recurrence_runs_recurrence_competence_unq` ON `recurrence_runs` (`recurrence_id`,`competence`);
CREATE INDEX `recurrence_runs_user_idx` ON `recurrence_runs` (`user_id`,`competence`);
CREATE INDEX `recurrences_user_active_idx` ON `recurrences` (`user_id`,`is_active`);
CREATE INDEX `recurrences_user_role_idx` ON `recurrences` (`user_id`,`role`);
CREATE UNIQUE INDEX `categorization_rules_user_match_unq` ON `categorization_rules` (`user_id`,`match_text`);
CREATE INDEX `categorization_rules_user_idx` ON `categorization_rules` (`user_id`);
CREATE INDEX `import_batches_user_status_idx` ON `import_batches` (`user_id`,`status`);
CREATE INDEX `import_batches_user_created_idx` ON `import_batches` (`user_id`,`created_at`);
CREATE INDEX `import_items_batch_idx` ON `import_items` (`batch_id`,`sort_order`);
CREATE UNIQUE INDEX `import_items_batch_fingerprint_unq` ON `import_items` (`batch_id`,`fingerprint`);
CREATE INDEX `import_items_user_idx` ON `import_items` (`user_id`);
CREATE INDEX `budgets_user_category_idx` ON `budgets` (`user_id`,`category_id`);
CREATE UNIQUE INDEX `budgets_user_category_start_unq` ON `budgets` (`user_id`,`category_id`,`starts_on`);
CREATE INDEX `goal_contributions_goal_idx` ON `goal_contributions` (`goal_id`,`occurred_on`);
CREATE INDEX `goals_user_status_idx` ON `goals` (`user_id`,`status`);
CREATE INDEX `investment_movements_investment_idx` ON `investment_movements` (`investment_id`,`occurred_on`);
CREATE INDEX `investments_user_idx` ON `investments` (`user_id`,`asset_class`);
CREATE UNIQUE INDEX `exchange_rates_currency_day_unq` ON `exchange_rates` (`currency`,`quoted_on`);
CREATE INDEX `reward_redemptions_card_idx` ON `reward_redemptions` (`card_id`,`redeemed_on`);
CREATE INDEX `reward_redemptions_user_idx` ON `reward_redemptions` (`user_id`);
CREATE UNIQUE INDEX `ai_usage_user_feature_day_unq` ON `ai_usage` (`user_id`,`feature`,`usage_day`);
CREATE INDEX `capture_events_user_status_idx` ON `capture_events` (`user_id`,`status`,`posted_at`);
CREATE UNIQUE INDEX `capture_events_user_device_event_unq` ON `capture_events` (`user_id`,`device_event_id`);
CREATE UNIQUE INDEX `capture_sources_user_app_unq` ON `capture_sources` (`user_id`,`source_app`);
CREATE UNIQUE INDEX `sync_mutations_user_mutation_unq` ON `sync_mutations` (`user_id`,`mutation_id`);
CREATE INDEX `sync_mutations_user_created_idx` ON `sync_mutations` (`user_id`,`created_at`);
CREATE UNIQUE INDEX `pairing_requests_code_unique` ON `pairing_requests` (`code`);
CREATE INDEX `pairing_requests_expires_idx` ON `pairing_requests` (`expires_at`);
CREATE INDEX `clients_user_idx` ON `clients` (`user_id`);
CREATE UNIQUE INDEX `clients_user_name_unq` ON `clients` (`user_id`,`name`);
CREATE INDEX `project_deployments_user_project_idx` ON `project_deployments` (`user_id`,`project_id`);
CREATE INDEX `project_events_user_project_idx` ON `project_events` (`user_id`,`project_id`);
CREATE INDEX `project_payments_user_project_idx` ON `project_payments` (`user_id`,`project_id`);
CREATE INDEX `project_payments_user_due_idx` ON `project_payments` (`user_id`,`due_on`);
CREATE INDEX `project_tasks_user_project_idx` ON `project_tasks` (`user_id`,`project_id`);
CREATE INDEX `project_tasks_user_status_idx` ON `project_tasks` (`user_id`,`status`);
CREATE INDEX `projects_user_status_idx` ON `projects` (`user_id`,`status`);
CREATE INDEX `projects_user_client_idx` ON `projects` (`user_id`,`client_id`);
CREATE INDEX `projects_user_due_idx` ON `projects` (`user_id`,`due_on`);
CREATE INDEX `proposals_user_project_idx` ON `proposals` (`user_id`,`project_id`);
CREATE INDEX `capture_reconciliations_user_idx` ON `capture_reconciliations` (`user_id`,`outcome`);
CREATE INDEX `receipt_rules_user_idx` ON `receipt_rules` (`user_id`,`is_active`);
CREATE UNIQUE INDEX `receipt_rules_user_payer_target_unq` ON `receipt_rules` (`user_id`,`payer_name`,`target`);
CREATE UNIQUE INDEX `subscription_labels_user_name_unq` ON `subscription_labels` (`user_id`,`name`);
CREATE INDEX `time_entries_user_project_idx` ON `time_entries` (`user_id`,`project_id`);
CREATE INDEX `time_entries_user_date_idx` ON `time_entries` (`user_id`,`worked_on`);
CREATE INDEX `time_entries_user_activity_idx` ON `time_entries` (`user_id`,`activity`);
CREATE INDEX `project_documents_user_project_idx` ON `project_documents` (`user_id`,`project_id`);
CREATE UNIQUE INDEX `accounts_user_name_unq` ON `accounts` (`user_id`,`name`) WHERE `archived_at` IS NULL;
CREATE UNIQUE INDEX `cards_user_name_unq` ON `cards` (`user_id`,`name`) WHERE `archived_at` IS NULL;
CREATE UNIQUE INDEX `categories_user_name_kind_unq` ON `categories` (`user_id`,`name`,`kind`) WHERE `archived_at` IS NULL;
CREATE INDEX `card_images_user_idx` ON `card_images` (`user_id`);
CREATE INDEX project_checklist_groups_user_project_idx ON project_checklist_groups(user_id, project_id);
