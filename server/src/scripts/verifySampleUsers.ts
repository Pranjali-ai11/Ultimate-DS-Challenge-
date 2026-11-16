import 'dotenv/config';
import { prisma } from '../db/index.js';

const users = [
  { name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', password: 'aarav@123', xp: 0, level: 1, streak: 0, byLevel: '0/0/0/0', badges: 0 },
  { name: 'Diya Sharma', email: 'diya.sharma@gmail.com', password: 'diya@123', xp: 1350, level: 2, streak: 1, byLevel: '11/0/0/0', badges: 2 },
  { name: 'Rohan Patil', email: 'rohan.patil@gmail.com', password: 'rohan@123', xp: 2900, level: 2, streak: 2, byLevel: '24/0/0/0', badges: 4 },
  { name: 'Meera Iyer', email: 'meera.iyer@gmail.com', password: 'meera@123', xp: 7400, level: 3, streak: 3, byLevel: '26/24/0/0', badges: 9 },
  { name: 'Kabir Singh', email: 'kabir.singh@gmail.com', password: 'kabir@123', xp: 6700, level: 3, streak: 4, byLevel: '22/19/1/0', badges: 10 },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@gmail.com', password: 'sneha@123', xp: 11900, level: 4, streak: 4, byLevel: '30/28/11/0', badges: 14 },
  { name: 'Vikram Joshi', email: 'vikram.joshi@gmail.com', password: 'vikram@123', xp: 17800, level: 4, streak: 10, byLevel: '32/34/13/10', badges: 15 },
  { name: 'Isha Desai', email: 'isha.desai@gmail.com', password: 'isha@123', xp: 4300, level: 3, streak: 2, byLevel: '20/12/0/0', badges: 4 },
  { name: 'Arjun Nair', email: 'arjun.nair@gmail.com', password: 'arjun@123', xp: 19400, level: 4, streak: 11, byLevel: '32/36/15/12', badges: 15 },
  { name: 'Pranjali', email: 'pranjali@gmail.com', password: 'pranjali@123', xp: 11100, level: 4, streak: 5, byLevel: '31/31/6/0', badges: 13 }
];
const expectedOrder = users.slice().sort((a, b) => b.xp - a.xp).map(u => u.name);
const base = `http://localhost:${process.env.PORT || 5000}/api`;

async function request(path: string, token?: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...(init?.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return body;
}
function levelCounts(value: Record<string, number>) { return [1, 2, 3, 4].map(level => value[level] || 0).join('/'); }

async function main() {
  const results: Array<{ user: typeof users[number]; issues: string[] }> = [];
  for (const user of users) {
    const issues: string[] = [];
    try {
      // One login attempt per email; no login retries are performed.
      const login = await request('/auth/login', undefined, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
      if (!login.success || typeof login.token !== 'string') throw new Error('login did not return a token');
      const token = login.token as string;
      const [progressResult, achievementResult, leaderboardResult] = await Promise.all([
        request('/progress', token), request('/achievements', token), request('/leaderboard', token)
      ]);
      const progress = progressResult.progress;
      const badgeCount = achievementResult.achievements.filter((item: any) => item.earned).length;
      const actual = { xp: progress.xp, level: progress.unlockedLevel, streak: progress.streak, byLevel: levelCounts(progressResult.completedChallengesByLevel), badges: badgeCount };
      const expected = { xp: user.xp, level: user.level, streak: user.streak, byLevel: user.byLevel, badges: user.badges };
      for (const key of Object.keys(expected) as Array<keyof typeof expected>) if (actual[key] !== expected[key]) issues.push(`${key}: got ${actual[key]}, expected ${expected[key]}`);
      const sampleOrder = leaderboardResult.leaderboard.filter((entry: any) => users.some(item => item.name === entry.name)).map((entry: any) => entry.name);
      if (sampleOrder.join('|') !== expectedOrder.join('|')) issues.push(`leaderboard order: got ${sampleOrder.join(', ')}, expected ${expectedOrder.join(', ')}`);
      const attempt = await prisma.challengeAttempt.findFirst({ where: { user: { email: user.email }, submission_id: { not: null } }, orderBy: [{ completed_at: 'desc' }, { id: 'desc' }], select: { submission_id: true } });
      if (attempt?.submission_id) {
        const saved = await request(`/results/${encodeURIComponent(attempt.submission_id)}`, token);
        if (!saved.success || saved.submissionId !== attempt.submission_id || !Array.isArray(saved.questions)) issues.push('saved result response is incomplete');
      } else if (user.name !== 'Aarav Mehta') issues.push('no submission ID available for saved result lookup');
      console.log(`${issues.length ? 'FAIL' : 'PASS'} ${user.email}: ${JSON.stringify(actual)}${issues.length ? `; ${issues.join('; ')}` : ''}`);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : 'verification request failed');
      console.log(`FAIL ${user.email}: ${issues.join('; ')}`);
    }
    results.push({ user, issues });
  }
  if (results.some(result => result.issues.length)) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Verification failed.'); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
