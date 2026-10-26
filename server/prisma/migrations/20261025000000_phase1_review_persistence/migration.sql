-- Preserve every historical metric value while allowing future attempts to
-- leave non-measured dimensions unset. Add a grouping key for saved submissions.
ALTER TABLE `challenge_attempts`
  MODIFY `performance_score` INTEGER NULL,
  MODIFY `memory_score` INTEGER NULL,
  MODIFY `complexity_score` INTEGER NULL,
  MODIFY `simplicity_score` INTEGER NULL,
  MODIFY `explanation_score` INTEGER NULL,
  ADD COLUMN `submission_id` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `challenge_attempts_user_id_submission_id_challenge_id_key`
  ON `challenge_attempts`(`user_id`, `submission_id`, `challenge_id`);
