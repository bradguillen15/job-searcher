import type { JobForScoring } from "./types";
import { RESUME_TEXT_MAX_CHARS } from "./types";

const SKILL_PROFILE_SYSTEM =
  "You are an expert résumé analyst. Extract a concise skill profile as a " +
  "plain-text bullet list covering skills, seniority level, domains, and tools. " +
  "Do not use JSON.";

const BATCH_SCORE_SYSTEM =
  "You are a job-fit scorer. Given a candidate skill profile and job listings, " +
  "return JSON only in the form {\"scores\":[{\"id\":<number>,\"score\":<0-100>}]}. " +
  "One score per job id.";

const MATCH_REASON_SYSTEM =
  "You are a career coach explaining job fit. Write 2–4 sentences in plain text " +
  "explaining why the candidate matches this role. Do not use JSON.";

function truncateResumeText(rawText: string): string {
  if (rawText.length <= RESUME_TEXT_MAX_CHARS) {
    return rawText;
  }
  return `${rawText.slice(0, RESUME_TEXT_MAX_CHARS)}…`;
}

export function buildSkillProfilePrompt(rawText: string): {
  system: string;
  user: string;
} {
  return {
    system: SKILL_PROFILE_SYSTEM,
    user: truncateResumeText(rawText),
  };
}

export function buildBatchScorePrompt(
  skillProfile: string,
  jobs: JobForScoring[]
): { system: string; user: string } {
  const payload = {
    skillProfile,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
    })),
  };

  return {
    system: BATCH_SCORE_SYSTEM,
    user: JSON.stringify(payload),
  };
}

export function buildMatchReasonPrompt(
  skillProfile: string,
  job: JobForScoring
): { system: string; user: string } {
  const payload = {
    skillProfile,
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
    },
  };

  return {
    system: MATCH_REASON_SYSTEM,
    user: JSON.stringify(payload),
  };
}
