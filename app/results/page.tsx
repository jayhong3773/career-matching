"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreJobs, RankedJob, QuizAnswers } from "@/lib/scoring";
import questions from "@/data/quiz-questions.json";
import jobsData from "@/onet-jobs.json";

const TOP_N = 10;

// Raw cosine scores rarely exceed ~0.5 even for a great match, since RIASEC
// and Work Style vectors are sparse/mixed-sign. This maps the *shown* results
// onto a more intuitive percentage range for display only - it does not
// change the underlying ranking or scoring math.
function toDisplayPercent(score: number, maxScore: number, minScore: number): number {
  if (maxScore === minScore) return 90;
  const normalized = (score - minScore) / (maxScore - minScore);
  return Math.round(60 + normalized * 38); // maps to roughly 60-98%
}

export default function ResultsPage() {
  const [results, setResults] = useState<RankedJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("quizAnswers");
    if (!stored) {
      setError("No quiz answers found. Please take the quiz first.");
      return;
    }
    const answers: QuizAnswers = JSON.parse(stored);
    const ranked = scoreJobs(answers, questions as any, jobsData as any);
    setResults(ranked.slice(0, TOP_N));
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <p>{error}</p>
        <Link href="/quiz">Take the quiz</Link>
      </div>
    );
  }

  if (!results) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <p>Scoring your results...</p>
      </div>
    );
  }

  const maxScore = results[0]?.score ?? 0;
  const minScore = results[results.length - 1]?.score ?? 0;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Your top career matches</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Based on your interests and work style, here are your top {results.length} matches.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((job, i) => (
          <Link
            key={job.code}
            href={`/jobs/${encodeURIComponent(job.code)}`}
            style={{
              display: "block",
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: 0 }}>
                {i + 1}. {job.title}
              </h3>
              <span style={{ opacity: 0.6, fontSize: 14 }}>
                {toDisplayPercent(job.score, maxScore, minScore)}% match
              </span>
            </div>
            <p style={{ opacity: 0.7, fontSize: 14, marginTop: 8, marginBottom: 0 }}>
              {job.description.slice(0, 140)}...
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
