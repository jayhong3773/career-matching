"use client";

import { useState } from "react";
import questions from "@/data/quiz-questions.json";

export type QuizQuestion = {
  id: string;
  text: string;
  trait: string;
  category: "riasec" | "workStyle";
  direction: 1 | -1;
};

export type QuizAnswers = Record<string, number>; // questionId -> 1-5

const SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

export default function Quiz({
  onComplete,
}: {
  onComplete: (answers: QuizAnswers) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const allQuestions = questions as QuizQuestion[];
  const question = allQuestions[current];
  const isLastQuestion = current === allQuestions.length - 1;

  function handleAnswer(value: number) {
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);

    if (isLastQuestion) {
      onComplete(updated);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <p style={{ opacity: 0.6, marginBottom: 8 }}>
        Question {current + 1} of {allQuestions.length}
      </p>

      <h2 style={{ marginBottom: 24 }}>{question.text}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SCALE_LABELS.map((label, i) => {
          const value = i + 1; // 1-5
          return (
            <button
              key={value}
              onClick={() => handleAnswer(value)}
              style={{
                padding: "12px 16px",
                textAlign: "left",
                border: "1px solid #ccc",
                borderRadius: 8,
                background: answers[question.id] === value ? "#eee" : "#fff",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
