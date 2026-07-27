import { http } from "./http";
import type {
  Assignment,
  AssignmentCreateDTO,
  AssignmentSubmission,
  CounterCheckResponse,
  PlannerSubject,
  SubmitAnswersDTO,
} from "@/types";

const PATH = "/assignments";

export const assignmentService = {
  /** Subjects already in the lesson planner (with suggested difficulty). */
  getSubjects: () =>
    http.get<PlannerSubject[]>(`/lesson-plans/subjects`).then((r) => r.data),

  generate: (dto: AssignmentCreateDTO) =>
    http.post<Assignment>(`${PATH}/generate`, dto).then((r) => r.data),

  list: () =>
    http.get<Assignment[]>(`${PATH}/`).then((r) => r.data),

  getById: (id: string) =>
    http.get<Assignment>(`${PATH}/${id}`).then((r) => r.data),

  getLatestSubmission: (id: string) =>
    http.get<AssignmentSubmission>(`${PATH}/${id}/submission`).then((r) => r.data),

  submit: (id: string, dto: SubmitAnswersDTO) =>
    http.post<AssignmentSubmission>(`${PATH}/${id}/submit`, dto).then((r) => r.data),

  verifyUnderstanding: (assignmentId: string, submissionId: string, counterAnswers: Record<string, string>) =>
    http
      .post<CounterCheckResponse>(`${PATH}/${assignmentId}/submissions/${submissionId}/verify`, {
        counter_answers: counterAnswers,
      })
      .then((r) => r.data),
};
