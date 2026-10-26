/** Filter the displayed users by public display name without changing global rank. */
export function filterLeaderboardUsers(users, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return users;
  return users.filter(user => user.name.toLocaleLowerCase().includes(normalizedQuery));
}
