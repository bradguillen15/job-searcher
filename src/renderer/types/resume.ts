export interface Resume {
  id: number;
  filename: string;
  raw_text: string;
  skill_profile: string | null;
  current_company: string | null;
  current_salary: number | null;
  target_salary: number | null;
  search_mode: string | null;
  updated_at: string;
}
