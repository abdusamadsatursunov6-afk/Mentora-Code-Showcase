import type {
  AISuggestion,
  AdminStats,
  AnalyticsOverview,
  ApiResponse,
  AssessmentData,
  AuthResult,
  DashboardData,
  ExportJobData,
  FeedbackData,
  FeedbackInput,
  FeedbackListResponse,
  HealthData,
  HomeworkAssignmentData,
  HomeworkAssignmentInput,
  HomeworkAssignmentList,
  InviteCode,
  InviteListResponse,
  LessonCreateInput,
  LessonDetail,
  HomeworkData,
  LessonListResponse,
  LessonUpdateInput,
  LoginRequest,
  OnboardingRequest,
  OnboardingStatus,
  PilotFunnel,
  PresentationData,
  QuestionInput,
  RegisterRequest,
  SlideInput,
  TokenPair,
  UserAccount,
  ClassroomData,
  ClassroomInput,
  ClassroomListResponse,
  LanguageCode,
  StudentData,
  StudentInput,
  StudentListResponse,
  StudentProfileData,
  HomeworkJoinData,
  HomeworkStudentData,
  PublicHomeworkInfo,
  VersionListResponse,
  VersionSummary,
  PublicQuizInfo,
  QuizJoinData,
  QuizResultsData,
  QuizSessionData,
  StudentQuizResult,
  CurriculumCountry,
  CurriculumProgram,
  CurriculumNode,
  ClassPerformanceData,
  MaterialData,
} from "@mentora/shared-types";
import { isErrorResponse } from "@mentora/shared-types";

import { accessTokenForRequest, recoverFromUnauthorized } from "@/lib/auth-session";

/**
 * Base URL of the Mentora API. Configured via NEXT_PUBLIC_API_URL so the same
 * build works across environments. Defaults to the local backend.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Error carrying the API's machine-readable code and localized message. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

const NON_REFRESHABLE_PATHS = new Set(["/api/v1/auth/login", "/api/v1/auth/refresh"]);

async function parsePayload<T>(res: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

/**
 * Perform an API request and unwrap the standard response envelope.
 * Returns `data` on success; throws {@link ApiError} on an error envelope or a
 * non-2xx response.
 */
async function request<T>(
  path: string,
  options: RequestOptions = {},
  allowRefreshRetry = true,
): Promise<T> {
  const { method = "GET", body, token, signal } = options;

  const canRefresh = Boolean(token) && !NON_REFRESHABLE_PATHS.has(path);
  const requestToken =
    canRefresh && token ? await accessTokenForRequest(token) : (token ?? undefined);

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (requestToken) headers["Authorization"] = `Bearer ${requestToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });

  if (res.status === 401 && canRefresh && allowRefreshRetry && requestToken) {
    const recoveredToken = await recoverFromUnauthorized(requestToken);
    return request<T>(path, { ...options, token: recoveredToken }, false);
  }

  const payload = await parsePayload<T>(res);

  if (!res.ok || (payload !== null && isErrorResponse(payload))) {
    if (payload !== null && isErrorResponse(payload)) {
      throw new ApiError(payload.error.message, payload.error.code, res.status);
    }
    throw new ApiError(`Request failed with status ${res.status}`, "INTERNAL_ERROR", res.status);
  }

  if (payload === null || !("data" in payload)) {
    throw new ApiError("API returned an invalid response", "INTERNAL_ERROR", res.status);
  }
  return payload.data;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthData> {
  return request<HealthData>("/api/v1/health", { signal });
}

export async function registerUser(body: RegisterRequest): Promise<AuthResult> {
  return request<AuthResult>("/api/v1/auth/register", { method: "POST", body });
}

export async function loginUser(body: LoginRequest): Promise<AuthResult> {
  return request<AuthResult>("/api/v1/auth/login", { method: "POST", body });
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return request<TokenPair>("/api/v1/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export async function fetchMe(token: string): Promise<UserAccount> {
  return request<UserAccount>("/api/v1/me", { token });
}

export async function updateMeLanguage(
  token: string,
  interfaceLanguage: LanguageCode,
): Promise<UserAccount> {
  return request<UserAccount>("/api/v1/me", {
    method: "PATCH",
    body: { interface_language: interfaceLanguage },
    token,
  });
}

export async function listClassrooms(token: string): Promise<ClassroomListResponse> {
  return request<ClassroomListResponse>("/api/v1/classes", { token });
}

export async function getClassroom(token: string, id: string): Promise<ClassroomData> {
  return request<ClassroomData>(`/api/v1/classes/${id}`, { token });
}

export async function createClassroom(token: string, body: ClassroomInput): Promise<ClassroomData> {
  return request<ClassroomData>("/api/v1/classes", { method: "POST", body, token });
}

export async function updateClassroom(
  token: string,
  id: string,
  body: Partial<ClassroomInput>,
): Promise<ClassroomData> {
  return request<ClassroomData>(`/api/v1/classes/${id}`, { method: "PATCH", body, token });
}

export async function archiveClassroom(token: string, id: string): Promise<void> {
  await request<{ detail: string }>(`/api/v1/classes/${id}`, { method: "DELETE", token });
}

export async function listStudents(
  token: string,
  classroomId: string,
): Promise<StudentListResponse> {
  return request<StudentListResponse>(`/api/v1/classes/${classroomId}/students`, { token });
}

export async function addStudent(
  token: string,
  classroomId: string,
  body: StudentInput,
): Promise<StudentData> {
  return request<StudentData>(`/api/v1/classes/${classroomId}/students`, {
    method: "POST",
    body,
    token,
  });
}

export async function importStudents(
  token: string,
  classroomId: string,
  students: StudentInput[],
): Promise<StudentListResponse> {
  return request<StudentListResponse>(`/api/v1/classes/${classroomId}/students/import`, {
    method: "POST",
    body: { students },
    token,
  });
}

export async function getStudentProfile(
  token: string,
  classroomId: string,
  studentId: string,
): Promise<StudentProfileData> {
  return request<StudentProfileData>(`/api/v1/classes/${classroomId}/students/${studentId}`, {
    token,
  });
}

export async function updateStudent(
  token: string,
  classroomId: string,
  studentId: string,
  body: Partial<StudentInput>,
): Promise<StudentData> {
  return request<StudentData>(`/api/v1/classes/${classroomId}/students/${studentId}`, {
    method: "PATCH",
    body,
    token,
  });
}

export async function archiveStudent(
  token: string,
  classroomId: string,
  studentId: string,
): Promise<void> {
  await request<{ detail: string }>(`/api/v1/classes/${classroomId}/students/${studentId}`, {
    method: "DELETE",
    token,
  });
}

export async function logoutUser(token: string, refreshToken?: string): Promise<void> {
  await request<{ detail: string }>("/api/v1/auth/logout", {
    method: "POST",
    body: refreshToken ? { refresh_token: refreshToken } : undefined,
    token,
  });
}

export async function fetchOnboardingStatus(token: string): Promise<OnboardingStatus> {
  return request<OnboardingStatus>("/api/v1/onboarding/status", { token });
}

export async function submitOnboarding(
  token: string,
  body: OnboardingRequest,
): Promise<OnboardingStatus> {
  return request<OnboardingStatus>("/api/v1/onboarding", {
    method: "POST",
    body,
    token,
  });
}

export async function fetchDashboard(token: string): Promise<DashboardData> {
  return request<DashboardData>("/api/v1/dashboard", { token });
}

export async function createLesson(token: string, body: LessonCreateInput): Promise<LessonDetail> {
  return request<LessonDetail>("/api/v1/lessons", {
    method: "POST",
    body,
    token,
  });
}

export async function listCurriculumCountries(
  token: string,
  language: LanguageCode,
): Promise<{ items: CurriculumCountry[] }> {
  return request(`/api/v1/curriculum/countries?language=${language}`, { token });
}

export async function listCurriculumPrograms(
  token: string,
  countryId: string,
): Promise<{ items: CurriculumProgram[]; filling_message: string | null }> {
  return request(`/api/v1/curriculum/programs?country_id=${countryId}`, { token });
}

export async function listCurriculumNodes(
  token: string,
  path: string,
): Promise<{ items: CurriculumNode[] }> {
  return request(`/api/v1/curriculum/${path}`, { token });
}

export async function uploadMaterial(
  token: string,
  file: File,
  title?: string,
): Promise<MaterialData> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  const requestToken = await accessTokenForRequest(token);
  const response = await fetch(`${API_BASE_URL}/api/v1/materials/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requestToken}` },
    body: form,
  });
  const payload = await parsePayload<MaterialData>(response);
  if (!response.ok || payload === null || isErrorResponse(payload)) {
    const message = payload && isErrorResponse(payload) ? payload.error.message : "Upload failed";
    throw new ApiError(message, "MATERIAL_UPLOAD_FAILED", response.status);
  }
  return payload.data;
}

export async function ingestUrlMaterial(
  token: string,
  url: string,
  title?: string,
): Promise<MaterialData> {
  return request<MaterialData>("/api/v1/materials/url", {
    method: "POST",
    body: { url, title: title || null },
    token,
  });
}

export async function listLessons(
  token: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<LessonListResponse> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.offset !== undefined) params.set("offset", String(opts.offset));
  const query = params.toString();
  return request<LessonListResponse>(`/api/v1/lessons${query ? `?${query}` : ""}`, { token });
}

export async function getLesson(token: string, id: string): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/lessons/${id}`, { token });
}

export async function updateLesson(
  token: string,
  id: string,
  body: LessonUpdateInput,
): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/lessons/${id}`, {
    method: "PATCH",
    body,
    token,
  });
}

export async function deleteLesson(token: string, id: string): Promise<void> {
  await request<{ detail: string }>(`/api/v1/lessons/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function addBlock(
  token: string,
  lessonId: string,
  sectionId: string,
  text: string,
): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/lessons/${lessonId}/sections/${sectionId}/blocks`, {
    method: "POST",
    body: { kind: "TEXT", text },
    token,
  });
}

export async function updateBlock(
  token: string,
  lessonId: string,
  sectionId: string,
  blockId: string,
  text: string,
): Promise<LessonDetail> {
  return request<LessonDetail>(
    `/api/v1/lessons/${lessonId}/sections/${sectionId}/blocks/${blockId}`,
    { method: "PATCH", body: { text }, token },
  );
}

export async function deleteBlock(
  token: string,
  lessonId: string,
  sectionId: string,
  blockId: string,
): Promise<LessonDetail> {
  return request<LessonDetail>(
    `/api/v1/lessons/${lessonId}/sections/${sectionId}/blocks/${blockId}`,
    { method: "DELETE", token },
  );
}

export async function reorderBlocks(
  token: string,
  lessonId: string,
  sectionId: string,
  blockIds: string[],
): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/lessons/${lessonId}/sections/${sectionId}/blocks/reorder`, {
    method: "POST",
    body: { block_ids: blockIds },
    token,
  });
}

export async function createVersion(
  token: string,
  lessonId: string,
  label: string,
): Promise<VersionSummary> {
  return request<VersionSummary>(`/api/v1/lessons/${lessonId}/versions`, {
    method: "POST",
    body: { label },
    token,
  });
}

export async function listVersions(token: string, lessonId: string): Promise<VersionListResponse> {
  return request<VersionListResponse>(`/api/v1/lessons/${lessonId}/versions`, {
    token,
  });
}

export async function restoreVersion(
  token: string,
  lessonId: string,
  versionId: string,
): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/lessons/${lessonId}/versions/${versionId}/restore`, {
    method: "POST",
    token,
  });
}

export async function suggestGoals(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/suggest-goals`, {
    method: "POST",
    token,
  });
}

export async function applySuggestion(token: string, suggestionId: string): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/ai/suggestions/${suggestionId}/apply`, {
    method: "POST",
    token,
  });
}

export async function dismissSuggestion(
  token: string,
  suggestionId: string,
): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/suggestions/${suggestionId}/dismiss`, {
    method: "POST",
    token,
  });
}

export async function generatePlan(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/generate-plan`, {
    method: "POST",
    token,
  });
}

export async function generateContent(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/generate-content`, {
    method: "POST",
    token,
  });
}

export async function generateFullLesson(token: string, lessonId: string): Promise<LessonDetail> {
  return request<LessonDetail>(`/api/v1/ai/lessons/${lessonId}/generate-full`, {
    method: "POST",
    token,
  });
}

export async function suggestBlockEdit(
  token: string,
  blockId: string,
  instruction: string,
): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/blocks/${blockId}/suggest-edit`, {
    method: "POST",
    body: { instruction },
    token,
  });
}

export async function getAssessment(token: string, lessonId: string): Promise<AssessmentData> {
  return request<AssessmentData>(`/api/v1/lessons/${lessonId}/assessment`, {
    token,
  });
}

export async function addQuestion(
  token: string,
  lessonId: string,
  body: QuestionInput,
): Promise<AssessmentData> {
  return request<AssessmentData>(`/api/v1/lessons/${lessonId}/assessment/questions`, {
    method: "POST",
    body,
    token,
  });
}

export async function deleteQuestion(
  token: string,
  lessonId: string,
  questionId: string,
): Promise<AssessmentData> {
  return request<AssessmentData>(`/api/v1/lessons/${lessonId}/assessment/questions/${questionId}`, {
    method: "DELETE",
    token,
  });
}

export async function updateQuestion(
  token: string,
  lessonId: string,
  questionId: string,
  body: QuestionInput,
): Promise<AssessmentData> {
  return request<AssessmentData>(`/api/v1/lessons/${lessonId}/assessment/questions/${questionId}`, {
    method: "PUT",
    body,
    token,
  });
}

export async function createQuizSession(
  token: string,
  assessmentId: string,
  body: { classroom_id?: string | null; show_score: boolean; expires_minutes?: number },
): Promise<QuizSessionData> {
  return request<QuizSessionData>(`/api/v1/quizzes/${assessmentId}/sessions`, {
    method: "POST",
    body,
    token,
  });
}

export async function getQuizSession(token: string, sessionId: string): Promise<QuizSessionData> {
  return request<QuizSessionData>(`/api/v1/quiz-sessions/${sessionId}`, { token });
}

export async function closeQuizSession(token: string, sessionId: string): Promise<QuizSessionData> {
  return request<QuizSessionData>(`/api/v1/quiz-sessions/${sessionId}/close`, {
    method: "POST",
    token,
  });
}

export async function getQuizResults(token: string, sessionId: string): Promise<QuizResultsData> {
  return request<QuizResultsData>(`/api/v1/quiz-sessions/${sessionId}/results`, { token });
}

export async function allowQuizRetake(
  token: string,
  sessionId: string,
  studentId: string,
): Promise<QuizSessionData> {
  return request<QuizSessionData>(
    `/api/v1/quiz-sessions/${sessionId}/students/${studentId}/allow-retake`,
    { method: "POST", token },
  );
}

export async function getPublicQuiz(publicToken: string): Promise<PublicQuizInfo> {
  return request<PublicQuizInfo>(`/api/v1/quiz-sessions/public/${publicToken}`);
}

export async function joinPublicQuiz(
  publicToken: string,
  studentCode: string,
): Promise<QuizJoinData> {
  return request<QuizJoinData>(`/api/v1/quiz-sessions/public/${publicToken}/join`, {
    method: "POST",
    body: { student_code: studentCode },
  });
}

export async function answerPublicQuiz(
  publicToken: string,
  attemptToken: string,
  questionId: string,
  optionId: string,
): Promise<{ answered: number; total: number; submitted: boolean }> {
  return request(`/api/v1/quiz-sessions/public/${publicToken}/answer`, {
    method: "POST",
    body: { attempt_token: attemptToken, question_id: questionId, option_id: optionId },
  });
}

export async function submitPublicQuiz(
  publicToken: string,
  attemptToken: string,
): Promise<StudentQuizResult> {
  return request<StudentQuizResult>(`/api/v1/quiz-sessions/public/${publicToken}/submit`, {
    method: "POST",
    body: { attempt_token: attemptToken },
  });
}

export async function getStudentQuizResult(
  publicToken: string,
  attemptToken: string,
): Promise<StudentQuizResult> {
  const query = new URLSearchParams({ attempt_token: attemptToken });
  return request<StudentQuizResult>(
    `/api/v1/quiz-sessions/public/${publicToken}/my-result?${query.toString()}`,
  );
}

export async function getHomework(token: string, lessonId: string): Promise<HomeworkData> {
  return request<HomeworkData>(`/api/v1/lessons/${lessonId}/homework`, {
    token,
  });
}

export async function setHomework(
  token: string,
  lessonId: string,
  instructions: string,
): Promise<HomeworkData> {
  return request<HomeworkData>(`/api/v1/lessons/${lessonId}/homework`, {
    method: "PUT",
    body: { instructions },
    token,
  });
}

export async function generateAssessment(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/generate-assessment`, {
    method: "POST",
    token,
  });
}

export async function generateHomework(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/generate-homework`, {
    method: "POST",
    token,
  });
}

export async function getPresentation(token: string, lessonId: string): Promise<PresentationData> {
  return request<PresentationData>(`/api/v1/lessons/${lessonId}/presentation`, {
    token,
  });
}

export async function addSlide(
  token: string,
  lessonId: string,
  body: SlideInput,
): Promise<PresentationData> {
  return request<PresentationData>(`/api/v1/lessons/${lessonId}/presentation/slides`, {
    method: "POST",
    body,
    token,
  });
}

export async function deleteSlide(
  token: string,
  lessonId: string,
  slideId: string,
): Promise<PresentationData> {
  return request<PresentationData>(`/api/v1/lessons/${lessonId}/presentation/slides/${slideId}`, {
    method: "DELETE",
    token,
  });
}

export async function reorderSlides(
  token: string,
  lessonId: string,
  slideIds: string[],
): Promise<PresentationData> {
  return request<PresentationData>(`/api/v1/lessons/${lessonId}/presentation/slides/reorder`, {
    method: "POST",
    body: { slide_ids: slideIds },
    token,
  });
}

export async function generatePresentation(token: string, lessonId: string): Promise<AISuggestion> {
  return request<AISuggestion>(`/api/v1/ai/lessons/${lessonId}/generate-presentation`, {
    method: "POST",
    token,
  });
}

export async function createExport(
  token: string,
  lessonId: string,
  format: "markdown" | "docx" | "pptx" = "markdown",
): Promise<ExportJobData> {
  return request<ExportJobData>(`/api/v1/lessons/${lessonId}/exports`, {
    method: "POST",
    body: { format },
    token,
  });
}

/** Download an export file: fetches the raw bytes and triggers a browser save. */
export async function downloadExport(
  token: string,
  exportId: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/exports/${exportId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("lesson.exportError", "EXPORT_DOWNLOAD_FAILED", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchAnalytics(token: string): Promise<AnalyticsOverview> {
  return request<AnalyticsOverview>("/api/v1/analytics/overview", { token });
}

export async function getClassPerformance(
  token: string,
  classroomId: string,
): Promise<ClassPerformanceData> {
  return request<ClassPerformanceData>(`/api/v1/analytics/classes/${classroomId}`, { token });
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return request<AdminStats>("/api/v1/admin/stats", { token });
}

export async function submitFeedback(token: string, body: FeedbackInput): Promise<FeedbackData> {
  return request<FeedbackData>("/api/v1/feedback", { method: "POST", body, token });
}

export async function fetchMyFeedback(token: string): Promise<FeedbackListResponse> {
  return request<FeedbackListResponse>("/api/v1/feedback/me", { token });
}

export async function fetchPilotFunnel(token: string): Promise<PilotFunnel> {
  return request<PilotFunnel>("/api/v1/admin/pilot", { token });
}

export async function fetchInvites(
  token: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<InviteListResponse> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.offset !== undefined) params.set("offset", String(opts.offset));
  const query = params.toString();
  return request<InviteListResponse>(`/api/v1/admin/invites${query ? `?${query}` : ""}`, { token });
}

export async function createInvites(
  token: string,
  count: number,
  note?: string,
): Promise<InviteCode[]> {
  return request<InviteCode[]>("/api/v1/admin/invites", {
    method: "POST",
    body: { count, note: note || null },
    token,
  });
}

export async function createHomeworkAssignment(
  token: string,
  body: HomeworkAssignmentInput,
): Promise<HomeworkAssignmentData> {
  return request<HomeworkAssignmentData>("/api/v1/homework/assignments", {
    method: "POST",
    body,
    token,
  });
}

export async function listHomeworkAssignments(
  token: string,
  filters: { classroomId?: string; lessonId?: string } = {},
): Promise<HomeworkAssignmentList> {
  const params = new URLSearchParams();
  if (filters.classroomId) params.set("classroom_id", filters.classroomId);
  if (filters.lessonId) params.set("lesson_id", filters.lessonId);
  const query = params.toString();
  return request<HomeworkAssignmentList>(
    `/api/v1/homework/assignments${query ? `?${query}` : ""}`,
    { token },
  );
}

export async function getPublicHomework(publicToken: string): Promise<PublicHomeworkInfo> {
  return request<PublicHomeworkInfo>(`/api/v1/homework/public/${publicToken}`);
}

export async function joinHomework(
  publicToken: string,
  studentCode: string,
): Promise<HomeworkJoinData> {
  return request<HomeworkJoinData>(`/api/v1/homework/public/${publicToken}/join`, {
    method: "POST",
    body: { student_code: studentCode },
  });
}

export async function saveHomeworkProgress(
  publicToken: string,
  attemptToken: string,
  responseText: string,
  submit: boolean,
): Promise<HomeworkStudentData> {
  return request<HomeworkStudentData>(`/api/v1/homework/public/${publicToken}/progress`, {
    method: "PATCH",
    body: { attempt_token: attemptToken, response_text: responseText, submit },
  });
}

export async function reviewHomeworkSubmission(
  token: string,
  assignmentId: string,
  submissionId: string,
  resultPercentage: number,
  feedback?: string,
): Promise<HomeworkAssignmentData> {
  return request<HomeworkAssignmentData>(
    `/api/v1/homework/assignments/${assignmentId}/submissions/${submissionId}/review`,
    {
      method: "PATCH",
      body: { result_percentage: resultPercentage, feedback: feedback || null },
      token,
    },
  );
}
