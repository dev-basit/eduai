import { http } from "./http";
import type { LessonPlan, LessonPlanCreateDTO, PlannerQuiz } from "@/types";

const PATH = "/lesson-plans";

export const lessonPlanService = {
  /** Generate a diagnostic quiz to assess the student's knowledge before planning. */
  generateQuiz: (dto: { subject: string; topics?: string[]; goal: string }) =>
    http.post<PlannerQuiz>(`${PATH}/quiz`, dto).then((r) => r.data),

  /** Generate a new 7-day lesson plan via AI (optionally with quiz results for personalisation). */
  generate: (dto: LessonPlanCreateDTO) =>
    http.post<LessonPlan>(`${PATH}/generate`, dto).then((r) => r.data),

  /** List the most recent lesson plans (up to 20). */
  list: () =>
    http.get<LessonPlan[]>(`${PATH}/`).then((r) => r.data),

  /** Get a single lesson plan by id. */
  getById: (id: string) =>
    http.get<LessonPlan>(`${PATH}/${id}`).then((r) => r.data),

  /** Generate an improved plan for an existing plan using assignment submission data. */
  improve: (id: string) =>
    http.post<LessonPlan>(`${PATH}/${id}/improve`).then((r) => r.data),
};
