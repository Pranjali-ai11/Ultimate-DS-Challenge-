-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(80) NOT NULL DEFAULT 'avatar-1',
    `title` VARCHAR(60) NOT NULL DEFAULT 'Novice Architect',
    `bio` VARCHAR(500) NOT NULL DEFAULT 'Exploring data structures and algorithms.',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_progress` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `unlocked_level` INTEGER NOT NULL DEFAULT 1,
    `xp` INTEGER NOT NULL DEFAULT 0,
    `score` INTEGER NOT NULL DEFAULT 0,
    `completed_challenges` INTEGER NOT NULL DEFAULT 0,
    `accuracy` DOUBLE NOT NULL DEFAULT 0,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `last_active` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_progress_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenges` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `reward_xp` INTEGER NOT NULL,
    `payload` JSON NOT NULL,

    UNIQUE INDEX `challenges_slug_key`(`slug`),
    INDEX `challenges_level_id_idx`(`level`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenge_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `challenge_id` VARCHAR(191) NOT NULL,
    `selected_structures` JSON NOT NULL,
    `final_design` JSON NULL,
    `score` INTEGER NOT NULL,
    `correctness_score` INTEGER NOT NULL,
    `performance_score` INTEGER NOT NULL,
    `memory_score` INTEGER NOT NULL,
    `complexity_score` INTEGER NOT NULL,
    `simplicity_score` INTEGER NOT NULL,
    `explanation_score` INTEGER NOT NULL,
    `feedback` JSON NULL,
    `status` VARCHAR(16) NOT NULL,
    `completed_at` DATETIME(3) NOT NULL,
    `reward_awarded` BOOLEAN NULL DEFAULT false,

    INDEX `challenge_attempts_user_id_completed_at_idx`(`user_id`, `completed_at`),
    INDEX `challenge_attempts_user_id_challenge_id_status_idx`(`user_id`, `challenge_id`, `status`),
    INDEX `challenge_attempts_challenge_id_completed_at_idx`(`challenge_id`, `completed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `code` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(80) NOT NULL,
    `requirement` VARCHAR(500) NOT NULL,
    `xp_bonus` INTEGER NOT NULL DEFAULT 50,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `achievement_id` VARCHAR(80) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL,

    INDEX `user_achievements_achievement_id_unlocked_at_idx`(`achievement_id`, `unlocked_at`),
    UNIQUE INDEX `user_achievements_user_id_achievement_id_key`(`user_id`, `achievement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revoked_tokens` (
    `token_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `revoked_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenge_completions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `challenge_id` VARCHAR(191) NOT NULL,
    `completed_at` DATETIME(3) NOT NULL,

    INDEX `challenge_completions_challenge_id_completed_at_idx`(`challenge_id`, `completed_at`),
    UNIQUE INDEX `challenge_completions_user_id_challenge_id_key`(`user_id`, `challenge_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_progress` ADD CONSTRAINT `user_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_attempts` ADD CONSTRAINT `challenge_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_attempts` ADD CONSTRAINT `challenge_attempts_challenge_id_fkey` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievement_id_fkey` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_completions` ADD CONSTRAINT `challenge_completions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_completions` ADD CONSTRAINT `challenge_completions_challenge_id_fkey` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
