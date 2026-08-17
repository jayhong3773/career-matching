"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import jobsData from "@/onet-jobs.json";

type Job = {
  code: string;
  title: string;
  description: string;
  riasec: Record<string, number>;
  skills: Record<string, number>;
  workStyles: Record<string, number>;
};

function topN(record: Record<string, number>, n: number): [string, number][] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default function JobDetailPage() {
  const params = useParams();
  const code = decodeURIComponent(params.code as string);
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    const found = (jobsData as Job[]).find((j) => j.code === code);
    setJob(found ?? null);
  }, [code]);

  if (job === undefined) {
    return <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>Loading...</div>;
  }

  if (job === null) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
        <p>Job not found.</p>
        <Link href="/results">Back to results</Link>
      </div>
    );
  }

  const topRiasec = topN(job.riasec, 3);
  const topSkills = topN(job.skills, 5);
  const topWorkStyles = topN(job.workStyles, 5);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <Link href="/results" style={{ fontSize: 14, opacity: 0.7 }}>
        ← Back to results
      </Link>

      <h1 style={{ marginTop: 16 }}>{job.title}</h1>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Overview</h2>
        <p style={{ opacity: 0.85 }}>{job.description}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Top interest areas</h2>
        <ul>
          {topRiasec.map(([trait, value]) => (
            <li key={trait}>
              {trait} ({value.toFixed(1)}/7)
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Most important skills</h2>
        <ul>
          {topSkills.map(([skill, value]) => (
            <li key={skill}>
              {skill} ({value.toFixed(1)}/5 importance)
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Personality fit</h2>
        <ul>
          {topWorkStyles.map(([trait, value]) => (
            <li key={trait}>
              {trait} ({value > 0 ? "+" : ""}
              {value.toFixed(1)})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
