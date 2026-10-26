export interface SearchableLeaderboardUser {
  name: string;
  rank: number;
}

export function filterLeaderboardUsers<T extends SearchableLeaderboardUser>(users: T[], query: string): T[];
