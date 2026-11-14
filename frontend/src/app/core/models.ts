export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'employee';
  department: string;
  employee_code: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface Job {
  id: number;
  title: string;
  department: string;
  employment_type: string;
  level: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  active: boolean;
  workplace: string;
  opens_at: string;
  closes_at: string;
  closed: boolean;
}
export interface ApplicationRow {
  id: number;
  job_id: number | null;
  position: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  linkedin: string;
  website: string;
  github: string;
  other_link: string;
  experience: string;
  employer: string;
  salary: string;
  available_from: string;
  cv_filename: string;
  cover_letter: string;
  heard_from: string;
  status: string;
  match_score: number;
  screen_decision: string;
  screen_message: string;
  matched_skills: string[];
  missing_skills: string[];
  created_at: string;
}
export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role_title: string;
  status: string;
}
export interface Stats {
  open_roles: number;
  applications: number;
  employees: number;
  new_applications: number;
}
export interface Settings {
  company_name: string;
  accent: string;
  contact_email: string;
  careers_open: boolean;
}
export interface AboutStep {
  n: string;
  title: string;
  text: string;
}
export interface AboutPage {
  kicker: string;
  title: string;
  intro: string;
  detail: string;
  work_title: string;
  steps: AboutStep[];
}
export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}
export interface ReviewItem {
  id: number;
  quote: string;
  role: string;
  place: string;
  stars: number;
}
