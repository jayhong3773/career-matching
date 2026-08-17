"use client";

import Quiz, { QuizAnswers } from "@/components/Quiz";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const router = useRouter();

  function handleComplete(answers: QuizAnswers) {
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
    router.push("/results");
  }

  return <Quiz onComplete={handleComplete} />;
}
