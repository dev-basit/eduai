// ── Lesson Plans ──────────────────────────────────────────────

export interface PlannerQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'short';
  question: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
}

export interface PlannerQuiz {
  questions: PlannerQuestion[];
  total_points: number;
  instructions: string;
}

export interface DailyPlan {
  day: string;
  topics: string[];
  duration_minutes: number;
  activities: string[];
  resources: string[];
  learning_objectives: string[];
}

export interface LessonPlanContent {
  skill_summary?: string;
  week_overview: string;
  daily_plans: DailyPlan[];
  weekly_goals: string[];
  tips: string[];
}

export interface LessonPlan {
  id: string;
  grade: string;
  subject: string;
  topics?: string[];
  days: number;
  goal: string;
  study_hours_per_day: number;
  plan: LessonPlanContent;
  created_at: string;
}

export interface LessonPlanCreateDTO {
  subject: string;
  topics?: string[];
  days: number;
  goal: string;
  study_hours_per_day: number;
  quiz_questions?: PlannerQuestion[];
  quiz_answers?: Record<string, string>;
}

// ── Resources ─────────────────────────────────────────────────

export interface ResourceSection {
  title: string;
  topic: string;
  explanation: string;
  key_concepts: string[];
  examples: string[];
  quick_check: string;
}

export interface Resource {
  id: string;
  lesson_plan_id: string;
  subject: string;
  sections: ResourceSection[];
  created_at: string;
}

// ── Conversations ─────────────────────────────────────────────

export interface Message {
  id: string;
  conversation_id: string;
  role: 'human' | 'ai';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  subject: string | null;
  title: string;
  context_type?: string | null;
  context_id?: string | null;
  created_at: string;
  messages: Message[];
}

export interface ConversationCreateDTO {
  subject?: string;
  context_type?: string;
  context_id?: string;
}

export interface AskDTO {
  question: string;
}

// ── Assignments ───────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'short' | 'long';

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: string[] | null;
  marks: number;
  expected_answer: string;
  explanation: string;
}

export interface AssignmentContent {
  title: string;
  subject: string;
  topic: string;
  instructions: string;
  questions: Question[];
  total_marks: number;
}

export interface Assignment {
  id: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  num_questions: number;
  content: AssignmentContent;
  created_at: string;
}

export interface PlannerSubject {
  subject: string;
  skill_summary: string | null;
  suggested_difficulty: Difficulty;
}

export interface AssignmentCreateDTO {
  subject: string;
  topic: string;
  difficulty: Difficulty;
  num_questions: number;
  skill_level?: string;
}

export interface SubmitAnswersDTO {
  answers: Record<string, string>;
}

export interface QuestionResult {
  question_id: number;
  question: string;
  student_answer: string;
  correct_answer: string;
  score: number;
  max_score: number;
  is_correct: boolean;
  feedback: string;
  counter_question?: string | null;
}

export interface CounterResult {
  question_id: number;
  counter_question: string;
  student_answer: string;
  understood: boolean;
  feedback: string;
}

export interface CounterCheckResponse {
  results: CounterResult[];
  overall_understanding: string;
}

export interface AssignmentFeedback {
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  question_results: QuestionResult[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_topics: string[];
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  answers: Record<string, string>;
  score: number;
  max_score: number;
  feedback: AssignmentFeedback;
  created_at: string;
}
