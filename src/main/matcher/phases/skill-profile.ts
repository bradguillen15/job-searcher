import type { AiBackend } from "../backends/types";
import { buildSkillProfilePrompt } from "../prompts";
import { isValidProfileText } from "../parse";
import { loadResume, saveSkillProfile } from "../matcher-db";
import type { ProgressEmitter } from "../../scraper/types";

export async function runSkillProfilePhase(
  backend: AiBackend,
  emit: ProgressEmitter
): Promise<{ profile: string } | { error: string }> {
  emit({
    type: "matching_phase",
    timestamp: new Date().toISOString(),
    phase: 1,
    status: "start",
  });

  const resume = loadResume();
  if (!resume) {
    emit({
      type: "log",
      timestamp: new Date().toISOString(),
      message: "Matching skipped: no resume uploaded",
    });
    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 1,
      status: "error",
      detail: "no resume",
    });
    return { error: "no resume" };
  }

  if (resume.skill_profile && isValidProfileText(resume.skill_profile)) {
    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 1,
      status: "cached",
    });
    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 1,
      status: "complete",
    });
    return { profile: resume.skill_profile.trim() };
  }

  const { system, user } = buildSkillProfilePrompt(resume.raw_text);

  try {
    const raw = await backend.complete(system, user);
    if (!isValidProfileText(raw)) {
      const message = "Skill profile generation returned empty text";
      emit({
        type: "log",
        timestamp: new Date().toISOString(),
        message,
      });
      emit({
        type: "matching_phase",
        timestamp: new Date().toISOString(),
        phase: 1,
        status: "error",
        detail: message,
      });
      return { error: message };
    }

    const profile = raw.trim();
    saveSkillProfile(resume.id, profile);

    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 1,
      status: "complete",
    });

    return { profile };
  } catch (err) {
    const message = (err as Error).message;
    emit({
      type: "log",
      timestamp: new Date().toISOString(),
      message: `Skill profile generation failed: ${message}`,
    });
    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 1,
      status: "error",
      detail: message,
    });
    return { error: message };
  }
}
