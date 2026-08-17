"use client";

import Quiz, { QuizAnswers } from "@/components/Quiz";
import { useState } from "react";

export default function QuizPage() {
  const [done, setDone] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState<QuizAnswers | null>(null);

  function handleComplete(answers: QuizAnswers) {
    console.log("Quiz answers:", answers); // temporary - scoring comes in step 5
    setFinalAnswers(answers);
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <h2>Quiz complete!</h2>
        <p style={{ opacity: 0.7 }}>
          Raw answers collected below (open your browser console to see this
          logged too). Scoring against job data comes next.
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(finalAnswers, null, 2)}
        </pre>
      </div>
    );
  }

  return <Quiz onComplete={handleComplete} />;
}
