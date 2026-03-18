// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'admin';
  hasCanvasToken?: boolean;
  canvasTokenType: 'instructor';
  canvas_token_created_at?: string;
  canvas_token_last_validated?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  canvasApiToken: string;
  canvasTokenType: 'instructor';
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  canvasApiToken?: string;
  canvasTokenType?: 'instructor';
}

export interface CanvasTokenValidationRequest {
  canvasApiToken: string;
  canvasTokenType: 'instructor';
}

// Skill Matrix Types
export interface SkillMatrix {
  _id: string;
  course_id: string;
  matrix_name: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateSkillMatrixRequest {
  course_id: string;
  matrix_name: string;
  skills: string[];
}

export interface UpdateSkillMatrixRequest {
  skills: string[];
}

// Skill Assignment Types
export interface QuestionSkillAssignment {
  [questionId: string]: string[];
}

export interface SkillAssignmentRequest {
  course_id: string;
  question_skills: QuestionSkillAssignment;
}

export interface SkillSuggestionRequest {
  question_text: string;
  course_context?: string;
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description?: string;
  skill_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  earned?: boolean;
  earned_at?: string;
  progress?: number; // 0-1 progress towards earning the badge
  badge_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateBadgeRequest {
  student_id: string;
  course_id: string;
  skill_levels: {
    [skillName: string]: 'beginner' | 'intermediate' | 'advanced';
  };
}

// Progress Types
export interface SkillProgress {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  total_questions: number;
  correct_answers: number;
}

export interface StudentProgress {
  student_id: string;
  course_id: string;
  skill_progress: {
    [skillName: string]: SkillProgress;
  };
  last_updated: string;
}

export interface UpdateProgressRequest {
  student_id: string;
  course_id: string;
  skill_updates: {
    [skillName: string]: {
      score: number;
      notes?: string;
    };
  };
}

// Analytics Types
export interface GraphData {
  timeSeriesData?: Array<{
    date: string;
    [skillName: string]: number | string;
  }>;
  performance?: PerformanceData[];
  distribution?: SkillDistributionData[];
  trends?: TrendData[];
  radar?: RadarData[];
  summary?: {
    totalStudents: number;
    averageScore: number;
    badgesEarned: number;
    skillsTracked: number;
  };
}

export interface CourseData {
  skill_matrices: SkillMatrix[];
  badges: Badge[];
  skill_progress: StudentProgress[];
}

export interface ImportCourseDataRequest {
  course_id: string;
  data: CourseData;
}

// Canvas Types
export interface CanvasCourse {
  id: string;
  name: string;
  code: string;
  term: number;
}

export interface CanvasQuiz {
  id: string;
  title: string;
  course_id: string;
}

export interface CanvasQuestion {
  id: string;
  question_text: string;
  quiz_id: string;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export interface BadgeCardProps {
  badge: Badge;
  onViewDetails: (badge: Badge) => void;
  onShare: (badge: Badge) => void;
}

export interface BadgeDisplaySystemProps {
  studentId: string;
}

export interface ProgressDashboardProps {
  studentId: string;
  courseId: string;
}

export interface AnalyticsDashboardProps {
  courseId: string;
}

// Form Types
export interface SkillMatrixFormData {
  courseId: string;
  matrixName: string;
}

export interface SkillAssignmentFormData {
  courseId: string;
  quizId: string;
}

// Filter Types
export interface BadgeFilters {
  skill: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  earned: 'all' | 'earned' | 'unearned';
}

export interface AnalyticsFilters {
  skillLevel: string;
  performanceRange: string;
  dateRange: string;
}

// Chart Data Types
export interface PerformanceData {
  studentId: string;
  averageScore: number;
  totalSkills: number;
  masteredSkills: number;
  needsImprovement: number;
}

export interface SkillDistributionData {
  skill: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  skill: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

export interface RadarData {
  subject: string;
  A: number;
  fullMark: number;
}

// Question Analysis Types
export interface QuestionAnalysisRequest {
  questions: Array<{
    id: string;
    text: string;
  }>;
}

export interface QuestionAnalysis {
  questionId: string;
  complexity: 'low' | 'medium' | 'high';
  suggestedSkills: string[];
  confidence: number;
}

export interface QuestionSuggestion {
  questionId: string;
  complexity: 'low' | 'medium' | 'high';
  suggestedSkills: string[];
  confidence: number;
}

// Instructor-specific Types
export interface InstructorCourseAnalytics {
  course_id: string;
  total_students: number;
  average_progress: number;
  skill_distribution: {
    [skillName: string]: number;
  };
  risk_students: string[];
  top_performers: string[];
}

export interface InstructorSkillMatrixRequest {
  course_id: string;
  matrix_name: string;
  skills: string[];
  quiz_questions: {
    [questionId: string]: string[];
  };
} 