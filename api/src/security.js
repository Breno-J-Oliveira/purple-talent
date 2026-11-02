import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, hash) {
  const [salt, encoded] = hash.split(':');
  if (!salt || !encoded) return false;
  const expected = Buffer.from(encoded, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, candidateId: user.candidate?.id ?? null };
}
export function candidateView(candidate) {
  let redScore = 0, blueScore = 0, purpleScore = 0;
  for (const submission of candidate.submissions) {
    if (submission.challenge.track === 'RED') redScore += submission.points;
    if (submission.challenge.track === 'BLUE') blueScore += submission.points;
    if (submission.challenge.track === 'PURPLE') purpleScore += submission.points;
  }
  return { id: candidate.id, name: candidate.user.name, handle: candidate.handle, track: candidate.track,
    bio: candidate.bio, location: candidate.location, skills: candidate.skills,
    redScore, blueScore, purpleScore, score: redScore + blueScore + purpleScore,
    solved: candidate.submissions.length };
}
