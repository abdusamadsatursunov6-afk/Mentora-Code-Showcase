/**
 * Shared API contract types for Mentora.
 *
 * These mirror the backend response envelope defined in
 * `apps/api/app/core/responses.py`. Keeping them here lets both the web app and
 * any future TypeScript client depend on a single source of truth.
 */

/** Meta block attached to every successful response. */
export interface ResponseMeta {
  request_id: string;
}

/** Standard success envelope: `{ data, meta }`. */
export interface SuccessResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/** Machine-readable error codes returned by the API. */
export type ErrorCode =
  | "INTERNAL_ERROR"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "PAYLOAD_TOO_LARGE";

/** Error body inside the standard error envelope. */
export interface ApiErrorBody {
  code: ErrorCode | string;
  message: string;
  details: Record<string, unknown>;
  request_id: string;
}

/** Standard error envelope: `{ error }`. */
export interface ErrorResponse {
  error: ApiErrorBody;
}

/** Any API response is either a success or an error envelope. */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/** Payload of `GET /api/v1/health`. */
export interface HealthData {
  status: "healthy" | "degraded";
  service: string;
  database: "connected" | "disconnected";
}

/** Type guard narrowing an envelope to its error variant. */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
  return (response as ErrorResponse).error !== undefined;
}

// --- Identity / auth contract (mirrors app/modules/identity/schemas.py) ---

/** Payload of `POST /api/v1/auth/register`. */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  /** Required only when the closed-pilot invite gate is enabled. */
  invite_code?: string;
}

/** Payload of `POST /api/v1/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload of `POST /api/v1/auth/refresh`. */
export interface RefreshRequest {
  refresh_token: string;
}

/** Access/refresh token pair returned by auth endpoints. */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Authenticated user, as returned by `/api/v1/me` and auth endpoints. */
export interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin?: boolean;
  interface_language: "ru" | "uz" | "en";
}

/** Result of register/login: the user plus a fresh token pair. */
export interface AuthResult {
  user: UserAccount;
  tokens: TokenPair;
}

// --- Onboarding & dashboard contract (Sprint 2) ---

/** Payload of `POST /api/v1/onboarding`. */
export interface OnboardingRequest {
  subjects: string[];
  grade_levels: string[];
  preferred_language: string;
  default_lesson_duration_minutes: number;
}

/** Teacher teaching preferences. */
export interface TeacherPreferences {
  subjects: string[];
  grade_levels: string[];
  preferred_language: string;
  default_lesson_duration_minutes: number;
}

/** Response of `GET /api/v1/onboarding/status` and `POST /api/v1/onboarding`. */
export interface OnboardingStatus {
  completed: boolean;
  preferences: TeacherPreferences | null;
}

/** Lesson counts by status for the dashboard. */
export interface LessonStats {
  total: number;
  draft: number;
  ready: number;
  conducted: number;
}

/** Compact lesson row for dashboard lists. */
export interface LessonSummary {
  id: string;
  title: string;
  status: string;
}

export interface DashboardQuizSummary {
  id: string;
  classroom_id: string;
  classroom_name: string;
  lesson_title: string;
  status: string;
  participant_count: number;
  completed_count: number;
  average_percentage: number | null;
}

export interface DashboardHomeworkSummary {
  id: string;
  classroom_id: string;
  classroom_name: string;
  title: string;
  due_at: string;
  assigned_count: number;
  completed_count: number;
}

export interface DashboardAttentionItem {
  classroom_id: string;
  classroom_name: string;
  topic: string;
  mastery_percentage: number;
}

/** Response of `GET /api/v1/dashboard`. */
export interface DashboardData {
  teacher_name: string;
  onboarding_completed: boolean;
  stats: LessonStats;
  recent_lessons: LessonSummary[];
  active_quizzes: DashboardQuizSummary[];
  homework_assignments: DashboardHomeworkSummary[];
  recent_results: DashboardQuizSummary[];
  attention_items: DashboardAttentionItem[];
}

// --- Lesson domain contract (Sprint 3) ---

export type LessonStatus =
  "DRAFT" | "GENERATING" | "READY" | "CONDUCTED" | "ARCHIVED" | "GENERATION_FAILED";

/** Teacher intent captured by the Lesson Wizard. */
export interface LessonCreateInput {
  title: string;
  subject: string;
  topic?: string | null;
  grade_level: string;
  duration_minutes: number;
  goals: string[];
  classroom_id?: string | null;
  lesson_language: "ru" | "uz" | "en";
  presentation_language?: "ru" | "uz" | "en" | null;
  assignment_language?: "ru" | "uz" | "en" | null;
  curriculum_objective_id?: string | null;
  lesson_type?: string;
  generation_mode?:
    "STANDARD_AI" | "CURRICULUM_ALIGNED" | "SOURCE_GROUNDED" | "CURRICULUM_AND_SOURCE";
  source_documents?: Array<{ document_id: string; pages?: string | null }>;
}

export interface MaterialData {
  id: string;
  title: string;
  kind: string;
  original_filename: string | null;
  media_type: string;
  size_bytes: number;
  page_count: number;
  status: string;
  source_url: string | null;
  error: string | null;
  created_at: string;
}

export interface CurriculumCountry {
  id: string;
  code: string;
  name: string;
  program_count: number;
}

export interface CurriculumProgram {
  id: string;
  country_id: string;
  name: string;
  version: string;
  academic_year: string | null;
  status: string;
  content_status: string;
  source_title: string;
  source_url: string | null;
  verified_at: string | null;
  is_official: boolean;
}

export interface CurriculumNode {
  id: string;
  code: string;
  label: string;
  description: string | null;
  source_title: string;
  source_url: string | null;
  source_page: string | null;
  version: string;
  verified_at: string | null;
  is_official: boolean;
}

/** Compact lesson row for lists. */
export interface LessonListItem {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  status: LessonStatus;
  version: number;
  updated_at: string;
}

export interface LessonGoalItem {
  id: string;
  text: string;
  order_index: number;
}

export interface LessonBlockItem {
  id: string;
  kind: string;
  text: string;
  order_index: number;
}

export interface LessonSectionItem {
  id: string;
  kind: string;
  title: string;
  order_index: number;
  blocks: LessonBlockItem[];
}

export interface LessonSourceCitation {
  marker: number;
  page_number: number;
}

export interface LessonSourceReference {
  document_id: string;
  title: string;
  page_count: number;
  page_ranges: Array<{ from: number; to: number }>;
  status: string;
  citations: LessonSourceCitation[];
}

/** Full lesson with goals and sections. */
export interface LessonDetail extends LessonListItem {
  topic: string | null;
  duration_minutes: number;
  schema_version: string;
  classroom_id: string | null;
  lesson_language: "ru" | "uz" | "en";
  presentation_language: "ru" | "uz" | "en";
  assignment_language: "ru" | "uz" | "en";
  curriculum_alignment?: Record<string, string | boolean | null> | null;
  generation_mode?: string;
  sources?: LessonSourceReference[];
  goals: LessonGoalItem[];
  sections: LessonSectionItem[];
}

export interface LessonListResponse {
  items: LessonListItem[];
  total: number;
}

export interface LessonUpdateInput {
  title?: string;
  subject?: string;
  topic?: string | null;
  grade_level?: string;
  duration_minutes?: number;
  status?: LessonStatus;
  version?: number;
  classroom_id?: string | null;
  lesson_language?: "ru" | "uz" | "en";
  presentation_language?: "ru" | "uz" | "en";
  assignment_language?: "ru" | "uz" | "en";
}

// --- Homework assignment tracking ---

export type HomeworkSubmissionStatus =
  "ASSIGNED" | "OPENED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export interface HomeworkSubmissionRow {
  id: string;
  student_id: string;
  student_name: string;
  status: HomeworkSubmissionStatus;
  response_text: string;
  result_percentage: number | null;
  teacher_feedback: string | null;
  opened_at: string | null;
  submitted_at: string | null;
}

export interface HomeworkAssignmentData {
  id: string;
  lesson_id: string;
  classroom_id: string;
  lesson_title: string;
  classroom_name: string;
  title: string;
  instructions: string;
  status: "OPEN" | "CLOSED";
  public_token: string;
  due_at: string;
  published_at: string;
  assigned_count: number;
  completed_count: number;
  submissions: HomeworkSubmissionRow[];
}

export interface HomeworkAssignmentList {
  items: HomeworkAssignmentData[];
  total: number;
}

export interface HomeworkAssignmentInput {
  lesson_id: string;
  classroom_id?: string;
  due_at: string;
  student_ids?: string[];
}

export interface PublicHomeworkInfo {
  title: string;
  instructions: string;
  lesson_title: string;
  classroom_name: string;
  due_at: string;
  status: "OPEN" | "CLOSED";
}

export interface HomeworkJoinData {
  attempt_token: string;
  student_name: string;
  assignment: PublicHomeworkInfo;
  submission_status: HomeworkSubmissionStatus;
  response_text: string;
  result_percentage: number | null;
  teacher_feedback: string | null;
}

export interface HomeworkStudentData {
  status: HomeworkSubmissionStatus;
  response_text: string;
  submitted_at: string | null;
  result_percentage: number | null;
  teacher_feedback: string | null;
}

// --- Classrooms and students (Foundation) ---

export type LanguageCode = "ru" | "uz" | "en";

export interface ClassroomInput {
  name: string;
  academic_year: string;
  grade: string;
  subject_id?: string | null;
  subject_name?: string | null;
  instruction_language: LanguageCode;
  country: string;
  program_id?: string | null;
}

export interface ClassroomData extends ClassroomInput {
  id: string;
  is_archived: boolean;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassroomListResponse {
  items: ClassroomData[];
  total: number;
}

export interface StudentInput {
  first_name: string;
  last_name: string;
  preferred_language: LanguageCode;
  birth_date?: string | null;
  external_id?: string | null;
  notes?: string | null;
}

export interface StudentData extends StudentInput {
  id: string;
  full_name: string;
  student_code: string;
  is_archived: boolean;
  created_at: string;
}

export interface StudentListResponse {
  items: StudentData[];
  total: number;
}

export interface StudentProfileData extends StudentData {
  classroom_ids: string[];
  average_quiz_score: number | null;
  completed_quizzes: number;
  homework_assigned: number;
  homework_completed: number;
  recent_topics: string[];
  weak_topics: string[];
  topics: TopicPerformanceData[];
  recommendations: PerformanceRecommendationData[];
}

// --- Versioning (Sprint 5) ---

export interface VersionSummary {
  id: string;
  label: string | null;
  is_autosave: boolean;
  lesson_version_number: number;
  created_at: string;
}

export interface VersionListResponse {
  items: VersionSummary[];
}

// --- AI proposals (Sprint 6) ---

export type SuggestionStatus = "PROPOSED" | "APPLIED" | "DISMISSED";

export interface AIPlanSection {
  kind: string;
  title: string;
  blocks: string[];
}

export interface AISuggestion {
  id: string;
  lesson_id: string;
  kind: string;
  status: SuggestionStatus;
  payload: {
    goals?: string[];
    sections?: AIPlanSection[];
    block_id?: string;
    instruction?: string;
    before?: string;
    after?: string;
    questions?: {
      text: string;
      kind: string;
      options: { text: string; is_correct: boolean }[];
    }[];
    instructions?: string;
    slides?: { title: string; bullets: string[] }[];
  };
  created_at: string;
}

// --- Assessment & Homework (Sprint 10) ---

export interface AnswerOptionItem {
  id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuestionItem {
  id: string;
  text: string;
  kind: string;
  order_index: number;
  points: number;
  options: AnswerOptionItem[];
}

export interface AssessmentData {
  id: string;
  title: string;
  questions: QuestionItem[];
}

export interface QuestionInput {
  text: string;
  kind: string;
  points?: number;
  options: { text: string; is_correct: boolean }[];
}

// --- Live quizzes (Phase 2) ---

export interface PublicQuizOption {
  id: string;
  text: string;
}

export interface PublicQuizQuestion {
  id: string;
  text: string;
  order_index: number;
  points: number;
  options: PublicQuizOption[];
}

export interface PublicQuizInfo {
  title: string;
  lesson_title: string;
  classroom_name: string;
  question_count: number;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  expires_at: string;
}

export interface QuizSessionData extends PublicQuizInfo {
  id: string;
  assessment_id: string;
  classroom_id: string;
  public_token: string;
  short_code: string;
  show_score: boolean;
  participant_count: number;
  completed_count: number;
  average_percentage: number | null;
  created_at: string;
}

export interface QuizJoinData {
  attempt_token: string;
  student_name: string;
  quiz: PublicQuizInfo;
  questions: PublicQuizQuestion[];
  answered_question_ids: string[];
  submitted: boolean;
}

export interface StudentQuizResult {
  submitted: boolean;
  show_score: boolean;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
}

export interface QuizStudentResultRow {
  student_id: string;
  student_name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
  answered: number;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
}

export interface QuizQuestionResultRow {
  question_id: string;
  text: string;
  correct_count: number;
  answered_count: number;
  classroom_size: number;
  correct_percentage: number;
  needs_review: boolean;
}

export interface QuizResultsData {
  session: QuizSessionData;
  classroom_size: number;
  submitted_count: number;
  average_percentage: number | null;
  best_percentage: number | null;
  students: QuizStudentResultRow[];
  questions: QuizQuestionResultRow[];
  recommendation: string;
}

export interface HomeworkData {
  instructions: string;
}

// --- Presentation (Sprint 11) ---

export interface SlideItem {
  id: string;
  title: string;
  bullets: string[];
  order_index: number;
}

export interface PresentationData {
  id: string;
  title: string;
  slides: SlideItem[];
}

export interface SlideInput {
  title: string;
  bullets: string[];
}

// --- Export (Sprint 12) ---

export interface ExportJobData {
  id: string;
  lesson_id: string;
  format: string;
  status: "PENDING" | "READY" | "FAILED";
  filename: string | null;
  created_at: string;
}

// --- Analytics & admin (Sprint 13) ---

export interface AnalyticsOverview {
  lessons_total: number;
  lessons_ready: number;
  lessons_conducted: number;
  ai_generations: number;
  exports: number;
}

export interface TopicPerformanceData {
  topic: string;
  quiz_attempts: number;
  average_quiz_percentage: number | null;
  answered_questions: number;
  correct_answers: number;
  answer_accuracy_percentage: number | null;
  homework_assigned: number;
  homework_completed: number;
  homework_completion_percentage: number | null;
  mastery_percentage: number | null;
  needs_attention: boolean;
}

export interface DifficultQuestionData {
  question_id: string;
  text: string;
  topic: string;
  answered_count: number;
  correct_count: number;
  correct_percentage: number;
}

export type PerformanceRecommendationKind =
  "REVIEW_TOPIC" | "FOLLOW_UP_HOMEWORK" | "RETEACH_QUESTION" | "COLLECT_MORE_DATA" | "KEEP_GOING";

export interface PerformanceRecommendationData {
  kind: PerformanceRecommendationKind;
  topic: string | null;
  metric_percentage: number | null;
  evidence_count: number;
}

export interface ClassPerformanceData {
  classroom_id: string;
  student_count: number;
  completed_quizzes: number;
  average_quiz_score: number | null;
  homework_assigned: number;
  homework_completed: number;
  homework_completion_percentage: number | null;
  topics: TopicPerformanceData[];
  difficult_questions: DifficultQuestionData[];
  recommendations: PerformanceRecommendationData[];
}

export interface AdminStats {
  users: number;
  lessons: number;
  ai_requests: number;
  exports: number;
}

// --- Closed pilot (Sprint 15) ---

export interface FeedbackInput {
  usefulness_score: number;
  lesson_id?: string | null;
  prep_time_reduction_percent?: number | null;
  comment?: string | null;
}

export interface FeedbackData {
  id: string;
  usefulness_score: number;
  lesson_id: string | null;
  prep_time_reduction_percent: number | null;
  comment: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  note: string | null;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface InviteListResponse {
  items: InviteCode[];
  total: number;
}

export interface FeedbackListResponse {
  items: FeedbackData[];
  total: number;
}

export interface PilotFunnel {
  participants: number;
  onboarding_completed: number;
  first_lesson_created: number;
  lesson_conducted: number;
  onboarding_rate: number;
  first_lesson_rate: number;
  conducted_rate: number;
  feedback_count: number;
  avg_usefulness: number | null;
}
