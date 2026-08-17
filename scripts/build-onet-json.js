// scripts/build-onet-json.js
//
// Merges 4 raw O*NET database files into one clean onet-jobs.json
// that the app reads from at runtime.
//
// Usage: node scripts/build-onet-json.js
//
// Expects these 4 files in scripts/onet-raw/:
//   occupation_data.json     - job titles + descriptions
//   career_interest_types.json - RIASEC scores (scale_id "OI")
//   essential_skills.json    - skill importance (scale_id "IM")
//   work_styles.json         - personality/IPIP-style traits (scale_id "WI")

const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "onet-raw");
const OUT_PATH = path.join(__dirname, "..", "onet-jobs.json");

function loadRows(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return raw.row;
}

// --- 1. Load the base job list -------------------------------------------
console.log("Loading occupation_data.json...");
const occupationRows = loadRows("occupation_data.json");

// jobs keyed by onetsoc_code
const jobs = {};
for (const row of occupationRows) {
  jobs[row.onetsoc_code] = {
    code: row.onetsoc_code,
    title: row.title,
    description: row.description,
    riasec: {},   // Realistic, Investigative, Artistic, Social, Enterprising, Conventional
    skills: {},   // skill name -> importance (1-5)
    workStyles: {}, // trait name -> impact (-3 to 3)
  };
}
console.log(`Loaded ${Object.keys(jobs).length} occupations.`);

// --- 2. RIASEC / Interests ------------------------------------------------
console.log("Loading career_interest_types.json...");
const interestRows = loadRows("career_interest_types.json");

for (const row of interestRows) {
  if (row.scale_id !== "OI") continue; // skip IH (high-point) rows
  const job = jobs[row.onetsoc_code];
  if (!job) continue;
  job.riasec[row.element_name] = row.data_value;
}

// --- 3. Skills --------------------------------------------------------
console.log("Loading essential_skills.json...");
const skillRows = loadRows("essential_skills.json");

for (const row of skillRows) {
  if (row.scale_id !== "IM") continue; // skip LV (level) rows, keep Importance
  const job = jobs[row.onetsoc_code];
  if (!job) continue;
  job.skills[row.element_name] = row.data_value;
}

// --- 4. Work Styles (personality / IPIP-equivalent) ------------------------
console.log("Loading work_styles.json...");
const workStyleRows = loadRows("work_styles.json");

for (const row of workStyleRows) {
  if (row.scale_id !== "WI") continue; // skip DR (distinctiveness rank) rows
  const job = jobs[row.onetsoc_code];
  if (!job) continue;
  job.workStyles[row.element_name] = row.data_value;
}

// --- 5. Write output --------------------------------------------------
const jobList = Object.values(jobs);

// Sanity check: warn about any jobs missing data (shouldn't happen, but good to know)
const incomplete = jobList.filter(
  (j) =>
    Object.keys(j.riasec).length === 0 ||
    Object.keys(j.skills).length === 0 ||
    Object.keys(j.workStyles).length === 0
);
if (incomplete.length > 0) {
  console.warn(
    `Warning: ${incomplete.length} jobs are missing one or more data types (riasec/skills/workStyles).`
  );
}

fs.writeFileSync(OUT_PATH, JSON.stringify(jobList, null, 2));
console.log(`\nDone! Wrote ${jobList.length} jobs to ${OUT_PATH}`);

// --- 6. Quick sanity print for a couple of familiar jobs -------------------
const sampleTitles = ["Chief Executives", "Graphic Designers", "Software Developers"];
for (const title of sampleTitles) {
  const job = jobList.find((j) => j.title === title);
  if (job) {
    console.log(`\n--- ${job.title} ---`);
    console.log("RIASEC:", job.riasec);
  }
}
