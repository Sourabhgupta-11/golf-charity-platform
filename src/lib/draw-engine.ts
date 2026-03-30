import { PRIZE_SPLIT } from '@/lib/stripe'

/** Generate 5 unique random numbers between 1-45 */
export function generateRandomDraw(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(n)) numbers.push(n)
  }
  return numbers.sort((a, b) => a - b)
}

/**
 * Algorithmic draw — weights numbers by frequency in user score data.
 * Can be biased toward most-frequent or least-frequent.
 */
export function generateAlgorithmicDraw(
  allUserScores: number[],
  bias: 'most' | 'least' = 'most'
): number[] {
  // Count frequency of each score 1–45
  const freq: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) freq[i] = 0
  allUserScores.forEach((s) => { if (s >= 1 && s <= 45) freq[s]++ })

  // Build weighted pool
  const pool: number[] = []
  for (let n = 1; n <= 45; n++) {
    const weight = bias === 'most'
      ? (freq[n] + 1) // +1 to ensure all have non-zero weight
      : (Math.max(...Object.values(freq)) - freq[n] + 1)
    for (let w = 0; w < weight; w++) pool.push(n)
  }

  // Pick 5 unique from weighted pool
  const result: number[] = []
  const shuffled = pool.sort(() => Math.random() - 0.5)
  for (const n of shuffled) {
    if (!result.includes(n)) result.push(n)
    if (result.length === 5) break
  }
  return result.sort((a, b) => a - b)
}

/** Count how many of a user's numbers match the winning numbers */
export function countMatches(userNumbers: number[], winningNumbers: number[]): number {
  return userNumbers.filter((n) => winningNumbers.includes(n)).length
}

/** Determine prize tier */
export function getPrizeTier(matchCount: number): '5-match' | '4-match' | '3-match' | null {
  if (matchCount >= 5) return '5-match'
  if (matchCount === 4) return '4-match'
  if (matchCount === 3) return '3-match'
  return null
}

/** Calculate prize pool distribution */
export function calculatePrizePools(
  totalPool: number,
  jackpotCarryOver: number = 0
): { fiveMatch: number; fourMatch: number; threeMatch: number } {
  return {
    fiveMatch: totalPool * PRIZE_SPLIT.FIVE_MATCH + jackpotCarryOver,
    fourMatch: totalPool * PRIZE_SPLIT.FOUR_MATCH,
    threeMatch: totalPool * PRIZE_SPLIT.THREE_MATCH,
  }
}

/** Calculate prize per winner in a tier */
export function prizePerWinner(tierPool: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor((tierPool / winnerCount) * 100) / 100 // floor to 2dp
}
