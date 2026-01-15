import axios, { AxiosResponse } from 'axios';
import {
  SkillMatrix,
  CreateSkillMatrixRequest,
  UpdateSkillMatrixRequest,
  SkillAssignmentRequest,
  SkillSuggestionRequest,
  Badge,
  GenerateBadgeRequest,
  StudentProgress,
  UpdateProgressRequest,
  GraphData,
  CourseData,
  ImportCourseDataRequest,
  CanvasCourse,
  CanvasQuiz,
  CanvasQuestion,
  User,
  SignupRequest,
  ProfileUpdateRequest,
  CanvasTokenValidationRequest,
  QuestionAnalysisRequest,
  QuestionAnalysis,
  QuestionSuggestion,
  InstructorCourseAnalytics,
  InstructorSkillMatrixRequest,
  QuestionSkillAssignment
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 errors, not network errors
    if (error.response?.status === 401 && !error.code) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Skill Matrix Management
export const skillMatrixAPI = {
  create: (data: CreateSkillMatrixRequest): Promise<AxiosResponse<SkillMatrix>> =>
    api.post('/achieveup/matrix/create', data),
  get: (courseId: string): Promise<AxiosResponse<SkillMatrix>> =>
    api.get(`/achieveup/matrix/${courseId}`),
  // Get all skill matrices for a course (supports multiple matrices per course)
  getAllByCourse: (courseId: string): Promise<AxiosResponse<SkillMatrix[]>> =>
    api.get(`/achieveup/matrix/course/${courseId}`),
  update: (matrixId: string, data: UpdateSkillMatrixRequest): Promise<AxiosResponse<SkillMatrix>> =>
    api.put(`/achieveup/matrix/${matrixId}`, data),
  delete: (matrixId: string): Promise<AxiosResponse<void>> =>
    api.delete(`/achieveup/matrix/${matrixId}`),
  getSkillSuggestions: (data: { courseId: string; courseName: string; courseCode: string; courseDescription?: string }): Promise<AxiosResponse<any[]>> =>
    api.post('/achieveup/ai/suggest-skills', data),
};

// Skill Assignment
export const skillAssignmentAPI = {
  assign: (data: SkillAssignmentRequest): Promise<AxiosResponse<void>> =>
    api.post('/achieveup/skills/assign', data),
  suggest: (data: SkillSuggestionRequest): Promise<AxiosResponse<string[]>> =>
    api.post('/achieveup/skills/suggest', data),
  analyzeQuestions: (data: { courseId: string; quizId: string; matrixId?: string; questions: any[] }): Promise<AxiosResponse<any[]>> =>
    api.post('/achieveup/ai/analyze-questions', { courseId: data.courseId, quizId: data.quizId, matrixId: data.matrixId, questions: data.questions }),
  bulkAssignWithAI: (data: { courseId: string; quizId: string }): Promise<AxiosResponse<any>> =>
    api.post('/achieveup/ai/bulk-assign', data),
  getAssignments: (courseId: string, questionIds: string[]): Promise<AxiosResponse<{ question_skills: Record<string, string[]> }>> => {
    const params = new URLSearchParams({ course_id: courseId });
    questionIds.forEach(id => params.append('question_id', id));
    return api.get(`/achieveup/skills/assignments?${params.toString()}`);
  },
};

// Badge Management
export const badgeAPI = {
  generate: (data: GenerateBadgeRequest): Promise<AxiosResponse<Badge[]>> =>
    api.post('/achieveup/badges/generate', data),
  getStudentBadges: (studentId: string): Promise<AxiosResponse<Badge[]>> =>
    api.get(`/achieveup/badges/${studentId}`),
  getCourseBadges: (courseId: string): Promise<AxiosResponse<any>> =>
    api.get(`/achieveup/badges/course/${courseId}`),
  getStudentEarnedBadges: (studentId: string): Promise<AxiosResponse<{
    student_id: string;
    total_badges: number;
    badges: Array<{
      badge_id: string;
      badge_name: string;
      skill_name: string;
      badge_level: string;
      progress_percentage: number;
      earned_at: string;
      course_id: string;
      course_name: string;
    }>;
  }>> =>
    api.get(`/achieveup/badges/student/${studentId}/earned`),
};

// Progress Tracking
export const progressAPI = {
  getSkillProgress: (studentId: string, courseId: string): Promise<AxiosResponse<StudentProgress>> =>
    api.get(`/achieveup/progress/${studentId}/${courseId}`),
  updateSkillProgress: (data: UpdateProgressRequest): Promise<AxiosResponse<void>> =>
    api.post('/achieveup/progress/update', data),
};

// Analytics and Visualization
export const analyticsAPI = {
  getIndividualGraphs: (studentId: string): Promise<AxiosResponse<GraphData>> =>
    api.get(`/achieveup/graphs/individual/${studentId}`),
  exportCourseData: (courseId: string): Promise<AxiosResponse<CourseData>> =>
    api.get(`/achieveup/export/${courseId}`),
  importCourseData: (data: ImportCourseDataRequest): Promise<AxiosResponse<void>> =>
    api.post('/achieveup/import', data),
};

// Canvas Integration
export const canvasAPI = {
  getCourses: (): Promise<AxiosResponse<CanvasCourse[]>> =>
    api.get('/canvas/courses'),
  getQuizzes: (courseId: string): Promise<AxiosResponse<CanvasQuiz[]>> =>
    api.get(`/canvas/courses/${courseId}/quizzes`),
  getQuestions: (quizId: string): Promise<AxiosResponse<CanvasQuestion[]>> =>
    api.get(`/canvas/quizzes/${quizId}/questions`),
  testConnection: (): Promise<AxiosResponse<{ connected: boolean; message?: string; user_info?: object }>> =>
    api.get('/canvas/test-connection'),
  // Instructor-specific endpoints
  getInstructorCourses: (): Promise<AxiosResponse<CanvasCourse[]>> =>
    api.get('/canvas/instructor/courses'),
  getInstructorQuizzes: (courseId: string): Promise<AxiosResponse<CanvasQuiz[]>> =>
    api.get(`/canvas/instructor/courses/${courseId}/quizzes`),
  getInstructorQuestions: (quizId: string, courseId: string): Promise<AxiosResponse<CanvasQuestion[]>> =>
    api.get(`/canvas/instructor/courses/${courseId}/quizzes/${quizId}/questions`),
};

// Authentication
export const authAPI = {
  login: (data: { email: string; password: string }): Promise<AxiosResponse<{ token: string; user: User }>> =>
    api.post('/auth/login', data),
  signup: (data: SignupRequest): Promise<AxiosResponse<{ token: string; user: User }>> =>
    api.post('/auth/signup', data),
  verify: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/verify'),
  me: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/me'),
  updateProfile: (data: ProfileUpdateRequest): Promise<AxiosResponse<{ user: User }>> =>
    api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<void>> =>
    api.put('/auth/password', data),
  validateCanvasToken: (data: CanvasTokenValidationRequest): Promise<AxiosResponse<{ valid: boolean; message?: string; user_info?: object }>> =>
    api.post('/auth/validate-canvas-token', data),
};

// Question Analysis API
export const questionAnalysisAPI = {
  analyzeQuestions: (data: QuestionAnalysisRequest): Promise<AxiosResponse<QuestionAnalysis[]>> =>
    api.post('/achieveup/questions/analyze', data),
  getQuestionSuggestions: (questionId: string): Promise<AxiosResponse<QuestionSuggestion>> =>
    api.get(`/achieveup/questions/${questionId}/suggestions`),
};

// Instructor-specific AchieveUp API
export const instructorAPI = {
  createSkillMatrix: (data: InstructorSkillMatrixRequest): Promise<AxiosResponse<SkillMatrix>> =>
    api.post('/achieveup/instructor/skill-matrix/create', data),
  getCourseAnalytics: (courseId: string): Promise<AxiosResponse<InstructorCourseAnalytics>> =>
    api.get(`/achieveup/instructor/courses/${courseId}/analytics`),

  // AI-powered skill suggestions for course context
  suggestSkillsForCourse: (courseId: string, courseTitle: string): Promise<AxiosResponse<string[]>> =>
    api.post('/achieveup/instructor/courses/suggest-skills', { courseId, courseTitle }),

  // AI-powered question analysis and auto-tagging
  analyzeQuestionsWithAI: (questions: Array<{ id: string; text: string }>, courseContext: string): Promise<AxiosResponse<QuestionAnalysis[]>> =>
    api.post('/achieveup/instructor/questions/analyze-ai', { questions, courseContext }),

  // Bulk skill assignment with AI suggestions
  bulkAssignSkillsWithAI: (courseId: string, quizId: string): Promise<AxiosResponse<QuestionSkillAssignment>> =>
    api.post('/achieveup/instructor/skills/bulk-assign-ai', { courseId, quizId }),

  // Student skill assessment (copying original algorithm)
  assessStudentSkills: (studentId: string, courseId: string, quizResponses: any[]): Promise<AxiosResponse<StudentProgress>> =>
    api.post('/achieveup/instructor/assessment/evaluate', { studentId, courseId, quizResponses }),

  // Generate web-linked badges
  generateWebLinkedBadges: (studentId: string, courseId: string, skillLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'>): Promise<AxiosResponse<Badge[]>> =>
    api.post('/achieveup/instructor/badges/generate-web-linked', { studentId, courseId, skillLevels }),

  // Get instructor dashboard data
  getInstructorDashboard: (): Promise<AxiosResponse<{
    totalCourses: number;
    students: number;
    averageProgress: number;
    recentActivity: any[];
  }>> =>
    api.get('/achieveup/instructor/dashboard'),

  // Get course-specific student analytics
  getCourseStudentAnalytics: (courseId: string): Promise<AxiosResponse<{
    students: Array<{
      id: string;
      name: string;
      progress: number;
      skillsMastered: number;
      badgesEarned: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    skillDistribution: Record<string, number>;
    averageScores: Record<string, number>;
  }>> =>
    api.get(`/achieveup/instructor/courses/${courseId}/student-analytics`),
};

// Enhanced Canvas API for instructor functionality
export const canvasInstructorAPI = {
  // Get all courses the instructor teaches
  getInstructorCourses: (): Promise<AxiosResponse<CanvasCourse[]>> =>
    api.get('/canvas/instructor/courses'),

  // Get quizzes for a specific course (instructor view)
  getInstructorQuizzes: (courseId: string): Promise<AxiosResponse<CanvasQuiz[]>> =>
    api.get(`/canvas/instructor/courses/${courseId}/quizzes`),

  // Get questions for a specific quiz (instructor view)
  getInstructorQuestions: (quizId: string): Promise<AxiosResponse<CanvasQuestion[]>> =>
    api.get(`/canvas/instructor/quizzes/${quizId}/questions`),

  // Get student submissions for a quiz
  getQuizSubmissions: (quizId: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/canvas/instructor/quizzes/${quizId}/submissions`),

  // Get course enrollment (students)
  getCourseEnrollment: (courseId: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/canvas/instructor/courses/${courseId}/enrollment`),

  // Validate instructor token specifically
  validateInstructorToken: (): Promise<AxiosResponse<{ valid: boolean; user_info?: any }>> =>
    api.get('/canvas/instructor/validate-token'),
};

export default api;

