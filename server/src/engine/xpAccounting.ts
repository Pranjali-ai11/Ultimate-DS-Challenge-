export interface TimedChallengeReward { completedAt: Date | string; rewardXp: number }
export interface TimedBadgeReward { unlockedAt: Date | string; xpBonus: number }

function asTime(value: Date | string): number {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

function awardEvents(completions: TimedChallengeReward[], badgeAwards: TimedBadgeReward[]) {
  return [
    ...completions.map(event => ({ at: event.completedAt, amount: event.rewardXp })),
    ...badgeAwards.map(event => ({ at: event.unlockedAt, amount: event.xpBonus }))
  ];
}

function isValidAward(event: { at: Date | string; amount: number }): boolean {
  return Number.isFinite(asTime(event.at)) && Number.isFinite(event.amount) && event.amount > 0;
}

/** XP is the sum of persisted challenge-completion rewards and badge bonuses. */
export function calculateAllTimeXp(completions: TimedChallengeReward[], badgeAwards: TimedBadgeReward[]): number {
  return awardEvents(completions, badgeAwards).reduce((sum, event) => isValidAward(event) ? sum + event.amount : sum, 0);
}

function sumInWindow(events: Array<{ at: Date | string; amount: number }>, cutoff: Date, now: Date): number {
  const start = cutoff.getTime();
  const end = now.getTime();
  return events.reduce((sum, event) => {
    const time = asTime(event.at);
    return Number.isFinite(time) && time >= start && time <= end && isValidAward(event)
      ? sum + event.amount
      : sum;
  }, 0);
}

/** Rolling 7- and 30-day UTC windows; events at the inclusive lower boundary count. */
export function calculatePeriodXp(
  completions: TimedChallengeReward[],
  badgeAwards: TimedBadgeReward[],
  now: Date
): { weekly: number; monthly: number } {
  const events = awardEvents(completions, badgeAwards);
  const weeklyCutoff = new Date(now);
  weeklyCutoff.setUTCDate(weeklyCutoff.getUTCDate() - 7);
  const monthlyCutoff = new Date(now);
  monthlyCutoff.setUTCDate(monthlyCutoff.getUTCDate() - 30);
  return {
    weekly: sumInWindow(events, weeklyCutoff, now),
    monthly: sumInWindow(events, monthlyCutoff, now)
  };
}
