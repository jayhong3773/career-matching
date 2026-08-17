// lib/scoring.ts
//
// Takes quiz answers + the question bank + the job list, and returns
// jobs ranked by how well they match the user's RIASEC + Work Style profile.

export type Job = {
  code: string;
  title: string;
  description: string;
  riasec: Record<string, number>;
  skills: Record<string, number>;
  workStyles: Record<string, number>;
};

export type QuizQuestion = {
  id: string;
  text: string;
  trait: string;
  category: "riasec" | "workStyle";
  direction: 1 | -1;
};

export type QuizAnswers = Record<string, number>; // questionId -> 1-5

export type RankedJob = {
  code: string;
  title: string;
  description: string;
  score: number; // 0-1 overall match score
  riasecScore: number;
  workStyleScore: number;
};

// Canonical trait order - must stay consistent between user vector and job vector
export const RIASEC_TRAITS = [
  "Realistic",
  "Investigative",
  "Artistic",
  "Social",
  "Enterprising",
  "Conventional",
];

export const WORK_STYLE_TRAITS = [
  "Achievement Orientation",
  "Adaptability",
  "Attention to Detail",
  "Cautiousness",
  "Cooperation",
  "Dependability",
  "Empathy",
  "Humility",
  "Initiative",
  "Innovation",
  "Integrity",
  "Intellectual Curiosity",
  "Leadership Orientation",
  "Optimism",
  "Perseverance",
  "Self-Confidence",
  "Self-Control",
  "Sincerity",
  "Social Orientation",
  "Stress Tolerance",
  "Tolerance for Ambiguity",
];

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0; // avoid divide-by-zero
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Averages the user's raw 1-5 answers per trait.
// RIASEC traits are kept on their natural 1-5 scale (job data is 1-7, unsigned - magnitude only).
// Work Style traits are centered around 3 (neutral) to roughly match job data's -3..+3 scale,
// and the question's `direction` flips sign for reverse-scored items.
function buildUserVectors(
  answers: QuizAnswers,
  questions: QuizQuestion[]
): { riasecVector: Record<string, number>; workStyleVector: Record<string, number> } {
  const riasecSums: Record<string, { total: number; count: number }> = {};
  const workStyleSums: Record<string, { total: number; count: number }> = {};

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined) continue;

    if (q.category === "riasec") {
      if (!riasecSums[q.trait]) riasecSums[q.trait] = { total: 0, count: 0 };
      riasecSums[q.trait].total += answer * q.direction;
      riasecSums[q.trait].count += 1;
    } else {
      const centered = (answer - 3) * q.direction; // -2..+2, direction-adjusted
      if (!workStyleSums[q.trait]) workStyleSums[q.trait] = { total: 0, count: 0 };
      workStyleSums[q.trait].total += centered;
      workStyleSums[q.trait].count += 1;
    }
  }

  const riasecVector: Record<string, number> = {};
  for (const trait of RIASEC_TRAITS) {
    const s = riasecSums[trait];
    riasecVector[trait] = s ? s.total / s.count : 0;
  }

  const workStyleVector: Record<string, number> = {};
  for (const trait of WORK_STYLE_TRAITS) {
    const s = workStyleSums[trait];
    workStyleVector[trait] = s ? s.total / s.count : 0;
  }

  return { riasecVector, workStyleVector };
}

export function scoreJobs(
  answers: QuizAnswers,
  questions: QuizQuestion[],
  jobs: Job[],
  weights: { riasec: number; workStyle: number } = { riasec: 0.5, workStyle: 0.5 }
): RankedJob[] {
  const { riasecVector, workStyleVector } = buildUserVectors(answers, questions);

  const userRiasecArr = RIASEC_TRAITS.map((t) => riasecVector[t]);
  const userWorkStyleArr = WORK_STYLE_TRAITS.map((t) => workStyleVector[t]);

  const ranked: RankedJob[] = [];

  for (const job of jobs) {
    // Skip jobs with no meaningful data in either category
    if (
      Object.keys(job.riasec).length === 0 &&
      Object.keys(job.workStyles).length === 0
    ) {
      continue;
    }

    const jobRiasecArr = RIASEC_TRAITS.map((t) => job.riasec[t] ?? 0);
    const jobWorkStyleArr = WORK_STYLE_TRAITS.map((t) => job.workStyles[t] ?? 0);

    const riasecScore = cosineSimilarity(userRiasecArr, jobRiasecArr);
    const workStyleScore = cosineSimilarity(userWorkStyleArr, jobWorkStyleArr);

    const score =
      weights.riasec * riasecScore + weights.workStyle * workStyleScore;

    ranked.push({
      code: job.code,
      title: job.title,
      description: job.description,
      score,
      riasecScore,
      workStyleScore,
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}
