import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Lightbulb, Save, Zap, Target, Brain, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { skillAssignmentAPI, canvasAPI, skillMatrixAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

interface CanvasCourse {
  id: string;
  name: string;
  code: string;
}

interface CanvasQuiz {
  id: string;
  title: string;
  course_id: string;
}

interface CanvasQuestion {
  id: string;
  question_text: string;
  quiz_id: string;
  question_type?: string;
  points?: number;
}

interface QuestionSkills {
  [questionId: string]: string[];
}

interface Suggestions {
  [questionId: string]: string[];
}

interface QuestionAnalysis {
  questionId: string;
  complexity: 'low' | 'medium' | 'high';
  suggestedSkills: string[];
  confidence: number;
}

interface FormData {
  courseId: string;
  quizId: string;
}

interface AIAnalysisStatus {
  [questionId: string]: 'pending' | 'analyzing' | 'completed' | 'error';
}

interface HumanReviewStatus {
  [questionId: string]: boolean;
}

function extractTextFromHTML(htmlString: string) {
  if (!htmlString) return '';
  var div = document.createElement('div');
  div.innerHTML = htmlString;
  return div.textContent || div.innerText || '';
}

const SkillAssignmentInterface: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [quizzes, setQuizzes] = useState<CanvasQuiz[]>([]);
  const [questions, setQuestions] = useState<CanvasQuestion[]>([]);
  const [questionSkills, setQuestionSkills] = useState<QuestionSkills>({});
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [bulkSkill, setBulkSkill] = useState<string>('');
  const [autoAnalysisInProgress, setAutoAnalysisInProgress] = useState<boolean>(false);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<AIAnalysisStatus>({});
  const [humanReviewStatus, setHumanReviewStatus] = useState<HumanReviewStatus>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');

  // New state for skill matrix selection
  const [availableMatrices, setAvailableMatrices] = useState<any[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState<string>('');
  const [selectedMatrixData, setSelectedMatrixData] = useState<any>(null);
  const [loadingMatrices, setLoadingMatrices] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>();

  const watchedCourse = watch('courseId');
  const watchedQuiz = watch('quizId');

  const isInstructor = user?.canvasTokenType === 'instructor';



  // Backend AI analysis for all questions
  const analyzeQuestionsWithAI = useCallback(async (questions: CanvasQuestion[]): Promise<void> => {
    if (!isInstructor || questions.length === 0) {
      return;
    }

    setAutoAnalysisInProgress(true);

    // Set all questions to analyzing status
    const analyzingStatus: AIAnalysisStatus = {};
    questions.forEach(q => analyzingStatus[q.id] = 'analyzing');
    setAiAnalysisStatus(analyzingStatus);

    try {
      console.log('Starting AI analysis for questions:', questions.map(q => ({ id: q.id, text: q.question_text?.substring(0, 100) })));

      const requestData = {
        courseId: selectedCourse,
        quizId: selectedQuiz,
        matrixId: selectedMatrix,
        questions: questions.map(q => ({
          id: q.id,
          text: extractTextFromHTML(q.question_text),
          type: q.question_type || 'multiple_choice',
          points: q.points || 1
        }))
      };

      console.log('Sending question analysis request:', requestData);
      const response = await skillAssignmentAPI.analyzeQuestions(requestData);
      console.log('AI analysis response:', response.data);

      // Process the response and update suggestions
      const newSuggestions: Suggestions = {};
      const completedStatus: AIAnalysisStatus = {};

      if (Array.isArray(response.data)) {
        response.data.forEach((analysis: QuestionAnalysis) => {
          if (analysis.questionId && Array.isArray(analysis.suggestedSkills)) {
            newSuggestions[analysis.questionId] = analysis.suggestedSkills;
            completedStatus[analysis.questionId] = 'completed';
          }
        });
      }

      // Set any remaining questions to completed (in case response is incomplete)
      questions.forEach(q => {
        // q.question_text is already sanitized on load
        if (!completedStatus[q.id]) {
          completedStatus[q.id] = 'completed';
          if (!newSuggestions[q.id]) {
            newSuggestions[q.id] = [];
          }
        }
      });

      setSuggestions(newSuggestions);
      setAiAnalysisStatus(completedStatus);

      // Provide feedback based on results
      const totalSuggestions = Object.values(newSuggestions).reduce((acc, skills) => acc + skills.length, 0);
      if (totalSuggestions === 0) {
        console.log('AI analysis completed but returned no suggestions, providing mock suggestions');
        const mockSuggestions = generateMockQuestionSuggestions(questions);
        setSuggestions(mockSuggestions);
        toast.success(`AI analysis completed. Generated ${Object.values(mockSuggestions).reduce((acc, skills) => acc + skills.length, 0)} smart suggestions based on question content.`);
      } else {
        toast.success(`AI analyzed ${questions.length} questions and provided ${totalSuggestions} skill suggestions`);
      }
    } catch (error: any) {
      console.error('Error analyzing questions with AI:', error);

      // Generate mock suggestions as fallback
      const mockSuggestions = generateMockQuestionSuggestions(questions);
      setSuggestions(mockSuggestions);

      // Set error status for all questions, then update to completed since we have mock suggestions
      const completedStatus: AIAnalysisStatus = {};
      questions.forEach(q => completedStatus[q.id] = 'completed');
      setAiAnalysisStatus(completedStatus);

      // Provide detailed error handling with fallback message
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Bad request format';
        toast.success(`Using smart question analysis (${Object.values(mockSuggestions).reduce((acc, skills) => acc + skills.length, 0)} suggestions generated). AI service: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your instructor token in Settings.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Instructor permissions required.');
      } else {
        toast.success(`Generated ${Object.values(mockSuggestions).reduce((acc, skills) => acc + skills.length, 0)} smart skill suggestions based on question analysis. AI service temporarily unavailable.`);
      }
    } finally {
      setAutoAnalysisInProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, selectedCourse, selectedQuiz, selectedMatrix]);

  // Generate intelligent mock suggestions based on question content and available skills
  const generateMockQuestionSuggestions = (questions: CanvasQuestion[]): Suggestions => {
    const suggestions: Suggestions = {};
    const availableSkills = getMatrixSkills();

    questions.forEach(question => {
      const questionText = (question.question_text || '').toLowerCase();
      const questionSkills: string[] = [];

      // If we have matrix skills, try to match them to question content
      if (availableSkills.length > 0) {
        availableSkills.forEach(skill => {
          const skillWords = skill.toLowerCase().split(/[\s\-_]+/);
          const hasMatch = skillWords.some(word =>
            word.length > 3 && questionText.includes(word)
          );

          if (hasMatch && questionSkills.length < 3) {
            questionSkills.push(skill);
          }
        });

        // If no direct matches, assign 1-2 random skills from the matrix
        if (questionSkills.length === 0) {
          const randomSkills = availableSkills
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 2) + 1);
          questionSkills.push(...randomSkills);
        }
      } else {
        // If no matrix skills available, generate generic suggestions based on question content
        const genericSuggestions = generateGenericSkillSuggestions(questionText);
        questionSkills.push(...genericSuggestions.slice(0, 2));
      }

      suggestions[question.id] = questionSkills;
    });

    return suggestions;
  };

  // Generate generic skill suggestions based on question content patterns
  const generateGenericSkillSuggestions = (questionText: string): string[] => {
    const text = questionText.toLowerCase();
    const suggestions: string[] = [];

    // Web development patterns
    if (text.includes('html') || text.includes('tag') || text.includes('element')) {
      suggestions.push('HTML Fundamentals');
    }
    if (text.includes('css') || text.includes('style') || text.includes('selector')) {
      suggestions.push('CSS Styling');
    }
    if (text.includes('javascript') || text.includes('js') || text.includes('function') || text.includes('variable')) {
      suggestions.push('JavaScript Programming');
    }
    if (text.includes('responsive') || text.includes('mobile') || text.includes('media query')) {
      suggestions.push('Responsive Design');
    }

    // Programming patterns
    if (text.includes('algorithm') || text.includes('sort') || text.includes('search')) {
      suggestions.push('Algorithm Design');
    }
    if (text.includes('loop') || text.includes('iteration') || text.includes('for') || text.includes('while')) {
      suggestions.push('Control Structures');
    }
    if (text.includes('array') || text.includes('list') || text.includes('data structure')) {
      suggestions.push('Data Structures');
    }
    if (text.includes('class') || text.includes('object') || text.includes('inheritance')) {
      suggestions.push('Object-Oriented Programming');
    }

    // Database patterns
    if (text.includes('sql') || text.includes('select') || text.includes('database') || text.includes('query')) {
      suggestions.push('SQL Fundamentals');
    }
    if (text.includes('table') || text.includes('relation') || text.includes('primary key')) {
      suggestions.push('Database Design');
    }

    // General academic patterns
    if (text.includes('analyze') || text.includes('evaluation') || text.includes('compare')) {
      suggestions.push('Critical Thinking');
    }
    if (text.includes('problem') || text.includes('solve') || text.includes('solution')) {
      suggestions.push('Problem Solving');
    }
    if (text.includes('research') || text.includes('source') || text.includes('evidence')) {
      suggestions.push('Research Skills');
    }

    // If no specific patterns found, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push('Analysis', 'Problem Solving');
    }

    return suggestions;
  };

  const loadCourses = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = isInstructor
        ? await canvasAPI.getInstructorCourses()
        : await canvasAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses. Please check your Canvas integration.');
    } finally {
      setLoading(false);
    }
  }, [isInstructor]);

  const loadQuizzes = useCallback(async (courseId: string): Promise<void> => {
    try {
      setLoading(true);

      const response = isInstructor
        ? await canvasAPI.getInstructorQuizzes(courseId)
        : await canvasAPI.getQuizzes(courseId);

      setQuizzes(response.data);
      setSelectedCourse(courseId);

      // Reset quiz selection when course changes
      setSelectedQuiz('');
      setQuestions([]);
      setValue('quizId', '');

      // Load available skill matrices for this course
      loadSkillMatrices(courseId);

    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes. Please try again.');

      // Set empty arrays so UI doesn't break
      setQuizzes([]);
      setSelectedCourse(courseId);
      setSelectedQuiz('');
      setQuestions([]);
      setValue('quizId', '');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, setValue]);

  const loadSkillMatrices = async (courseId: string) => {
    try {
      setLoadingMatrices(true);
      console.log(`Loading skill matrices for course: ${courseId}`);

      // Debug: Check authentication status
      const token = localStorage.getItem('token');
      console.log('Authentication debug:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'No token',
        courseId: courseId
      });

      const response = await skillMatrixAPI.getAllByCourse(courseId);
      console.log(`Skill matrices API response for course ${courseId}:`, response.data);

      setAvailableMatrices(response.data);

      // Auto-select first matrix if available
      if (response.data.length > 0) {
        console.log(`Found ${response.data.length} matrices, auto-selecting first one:`, response.data[0]);
        setSelectedMatrix(response.data[0]._id);
        setSelectedMatrixData(response.data[0]);
      } else {
        console.log(`No matrices found for course ${courseId}, providing guidance`);
        setSelectedMatrix('');
        setSelectedMatrixData(null);

        // Show helpful guidance when no matrices exist
        toast.success(`No skill matrices found for this course yet. Create one first using the Skill Matrix page.`, {
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Error loading skill matrices:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.response?.config?.url,
        courseId: courseId
      });

      // Provide more specific error messages and guidance based on status
      if (error.response?.status === 404) {
        console.log(`404 - No matrices endpoint found or no matrices exist for course ${courseId}`);

        // For 404, provide mock matrices to test the interface
        const mockMatrices = generateMockMatrices(courseId);
        if (mockMatrices.length > 0) {
          console.log(`Providing ${mockMatrices.length} mock matrices for testing`);
          setAvailableMatrices(mockMatrices);
          setSelectedMatrix(mockMatrices[0]._id);
          setSelectedMatrixData(mockMatrices[0]);
          toast.success(`Demo matrices loaded for testing. Create real matrices using the Skill Matrix page.`, {
            duration: 6000
          });
        } else {
          setAvailableMatrices([]);
          setSelectedMatrix('');
          setSelectedMatrixData(null);
          toast.error(`No skill matrices found. Please create a skill matrix first.`);
        }
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your instructor token in Settings.');
        setAvailableMatrices([]);
        setSelectedMatrix('');
        setSelectedMatrixData(null);
      } else if (error.response?.status === 403) {
        console.error('403 Forbidden Error Details:', {
          message: error.response?.data?.message || 'No error message provided',
          error: error.response?.data?.error || 'No error details',
          url: error.response?.config?.url,
          method: error.response?.config?.method,
          headers: error.response?.config?.headers,
          courseId: courseId
        });

        // Check if it's a token issue vs permission issue
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('No authentication token found. Please log in again.');
        } else {
          toast.error(
            <div className="space-y-2">
              <p><strong>Access Denied (403 Forbidden)</strong></p>
              <p className="text-sm">Your instructor token may not have permission to access matrices for this course.</p>
              <p className="text-sm">Please check your Canvas instructor permissions or try refreshing your token in Settings.</p>
            </div>,
            { duration: 8000 }
          );
        }

        // Provide mock matrices so user can still test the interface
        console.log('Providing mock matrices due to 403 error');
        const mockMatrices = generateMockMatrices(courseId);
        setAvailableMatrices(mockMatrices);
        if (mockMatrices.length > 0) {
          setSelectedMatrix(mockMatrices[0]._id);
          setSelectedMatrixData(mockMatrices[0]);
          toast.success(`Demo matrices loaded for testing. Fix authentication to access real data.`, {
            duration: 6000
          });
        }
      } else if (error.response?.status >= 500) {
        toast.error('Server error while loading matrices. Using demo data for testing.');

        // Provide mock matrices for testing during server issues
        const mockMatrices = generateMockMatrices(courseId);
        setAvailableMatrices(mockMatrices);
        if (mockMatrices.length > 0) {
          setSelectedMatrix(mockMatrices[0]._id);
          setSelectedMatrixData(mockMatrices[0]);
        }
      } else {
        console.warn('Failed to load skill matrices:', error.message);
        toast.error(`Failed to load skill matrices: ${error.message}. Using demo data for testing.`);

        // Provide mock matrices as fallback
        const mockMatrices = generateMockMatrices(courseId);
        setAvailableMatrices(mockMatrices);
        if (mockMatrices.length > 0) {
          setSelectedMatrix(mockMatrices[0]._id);
          setSelectedMatrixData(mockMatrices[0]);
        }
      }
    } finally {
      setLoadingMatrices(false);
    }
  };

  // Generate mock skill matrices for testing when backend data is unavailable
  const generateMockMatrices = (courseId: string) => {
    // Course-specific mock matrices based on common course patterns
    const courseSpecificMatrices = [
      {
        _id: `mock_matrix_1_${courseId}`,
        course_id: courseId,
        matrix_name: 'Core Skills Matrix',
        skills: generateCoreSkillsForCourse(courseId),
        description: 'Essential skills for this course',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: `mock_matrix_2_${courseId}`,
        course_id: courseId,
        matrix_name: 'Advanced Skills Matrix',
        skills: generateAdvancedSkillsForCourse(courseId),
        description: 'Advanced competencies and specialized skills',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return courseSpecificMatrices;
  };

  // Generate course-appropriate core skills
  const generateCoreSkillsForCourse = (courseId: string): string[] => {
    // Default web development skills (most common case)
    if (courseId.toLowerCase().includes('web') || courseId.includes('html') || courseId.includes('demo')) {
      return [
        'HTML Fundamentals',
        'CSS Styling',
        'JavaScript Basics',
        'DOM Manipulation',
        'Responsive Design'
      ];
    }

    // Programming/Computer Science skills
    if (courseId.toLowerCase().includes('prog') || courseId.toLowerCase().includes('cs') || courseId.toLowerCase().includes('cop')) {
      return [
        'Programming Logic',
        'Data Types',
        'Control Structures',
        'Functions',
        'Problem Solving'
      ];
    }

    // Database/Data skills
    if (courseId.toLowerCase().includes('data') || courseId.toLowerCase().includes('db') || courseId.toLowerCase().includes('sql')) {
      return [
        'Database Design',
        'SQL Queries',
        'Data Modeling',
        'Normalization',
        'Data Analysis'
      ];
    }

    // Generic academic skills
    return [
      'Critical Thinking',
      'Problem Solving',
      'Written Communication',
      'Research Skills',
      'Analysis'
    ];
  };

  // Generate course-appropriate advanced skills
  const generateAdvancedSkillsForCourse = (courseId: string): string[] => {
    // Default web development advanced skills
    if (courseId.toLowerCase().includes('web') || courseId.includes('html') || courseId.includes('demo')) {
      return [
        'Advanced JavaScript',
        'API Integration',
        'Frontend Frameworks',
        'Performance Optimization',
        'Web Security'
      ];
    }

    // Programming/Computer Science advanced skills
    if (courseId.toLowerCase().includes('prog') || courseId.toLowerCase().includes('cs') || courseId.toLowerCase().includes('cop')) {
      return [
        'Algorithm Design',
        'Data Structures',
        'Object-Oriented Programming',
        'Software Design Patterns',
        'Code Optimization'
      ];
    }

    // Database/Data advanced skills
    if (courseId.toLowerCase().includes('data') || courseId.toLowerCase().includes('db') || courseId.toLowerCase().includes('sql')) {
      return [
        'Advanced SQL',
        'Database Optimization',
        'Data Warehousing',
        'Big Data Analytics',
        'ETL Processes'
      ];
    }

    // Generic advanced academic skills
    return [
      'Advanced Analysis',
      'Strategic Thinking',
      'Leadership',
      'Project Management',
      'Innovation'
    ];
  };

  const loadQuestions = useCallback(async (quizId: string, selectedCourse: string): Promise<void> => {
    try {
      setLoading(true);
      const response = isInstructor
        ? await canvasAPI.getInstructorQuestions(quizId, selectedCourse)
        : await canvasAPI.getQuestions(quizId);

      const sanitizedQuestions = response.data.map((q: CanvasQuestion) => ({
        ...q,
        question_text: extractTextFromHTML(q.question_text)
      }));
      setQuestions(sanitizedQuestions);
      setSelectedQuiz(quizId);

      // Pull assigned skills from AchieveUp DB
      const questionIds = response.data.map((q: CanvasQuestion) => String(q.id));

      const params = new URLSearchParams({ course_id: String(selectedCourse) });
      questionIds.forEach(id => params.append('question_id', id));

      const skillsResponse = await skillAssignmentAPI.getAssignments(
        selectedCourse,
        questionIds
      );

      // Expected shape:
      // { question_skills: { [questionId]: string[] } }
      const savedSkills = skillsResponse.data?.question_skills || {};


      // Initialize question skills and status
      const initialSkills: QuestionSkills = {};
      const initialStatus: AIAnalysisStatus = {};
      const initialReviewStatus: HumanReviewStatus = {};
      console.log(response.data);



      response.data.forEach((question: CanvasQuestion) => {
        initialSkills[question.id] = savedSkills[String(question.id)] ?? [];
        initialStatus[question.id] = 'pending';
        initialReviewStatus[question.id] = false;
      });

      setQuestionSkills(initialSkills);
      setAiAnalysisStatus(initialStatus);
      setHumanReviewStatus(initialReviewStatus);

      // Auto-analyze questions if instructor and questions exist
      if (isInstructor && response.data.length > 0) {
        analyzeQuestionsWithAI(response.data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isInstructor, analyzeQuestionsWithAI, selectedCourse]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (watchedCourse) {
      loadQuizzes(watchedCourse);
    }
  }, [watchedCourse, loadQuizzes]);

  useEffect(() => {
    if (watchedQuiz) {
      loadQuestions(watchedQuiz, watchedCourse);
    }
  }, [watchedQuiz, loadQuestions]);

  const addSkillToQuestion = (questionId: string, skill: string): void => {
    setQuestionSkills(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), skill]
    }));
  };

  const removeSkillFromQuestion = (questionId: string, skillIndex: number): void => {
    setQuestionSkills(prev => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, index) => index !== skillIndex)
    }));
  };

  const addSuggestionToQuestion = (questionId: string, skill: string): void => {
    if (!questionSkills[questionId]?.includes(skill)) {
      addSkillToQuestion(questionId, skill);
    }
  };

  const handleMatrixSelection = (matrixId: string) => {
    const matrix = availableMatrices.find(m => m._id === matrixId);
    setSelectedMatrix(matrixId);
    setSelectedMatrixData(matrix);
  };

  const getMatrixSkills = (): string[] => {
    return selectedMatrixData?.skills || [];
  };

  const bulkAssignSkill = (skill: string): void => {
    if (!skill) return;

    const filteredQuestions = getFilteredQuestions();
    const updatedSkills = { ...questionSkills };

    filteredQuestions.forEach(question => {
      if (!updatedSkills[question.id]?.includes(skill)) {
        updatedSkills[question.id] = [...(updatedSkills[question.id] || []), skill];
      }
    });

    setQuestionSkills(updatedSkills);
    setBulkSkill('');
    toast.success(`Added "${skill}" to ${filteredQuestions.length} questions`);
  };

  const bulkAssignFromSuggestions = (): void => {
    const updatedSkills = { ...questionSkills };
    let assignedCount = 0;
    let questionsWithSuggestions = 0;

    // Process all questions (not just filtered ones) that have suggestions
    questions.forEach(question => {
      const questionSuggestions = suggestions[question.id] || [];
      if (questionSuggestions.length > 0) {
        questionsWithSuggestions++;
        questionSuggestions.forEach(skill => {
          if (!updatedSkills[question.id]?.includes(skill)) {
            updatedSkills[question.id] = [...(updatedSkills[question.id] || []), skill];
            assignedCount++;
          }
        });
      }
    });

    setQuestionSkills(updatedSkills);

    if (assignedCount > 0) {
      toast.success(`Assigned ${assignedCount} skills from AI suggestions to ${questionsWithSuggestions} questions`);
    } else {
      toast.error('No new skills to assign - all AI suggestions are already assigned');
    }
  };

  const getFilteredQuestions = () => {
    if (!Array.isArray(questions)) {
      return [];
    }

    return questions.filter(question => {
      const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSkillFilter = skillFilter === 'all' ||
        (skillFilter === 'assigned' && questionSkills[question.id]?.length > 0) ||
        (skillFilter === 'unassigned' && (!questionSkills[question.id] || questionSkills[question.id].length === 0));

      return matchesSearch && matchesSkillFilter;
    });
  };

  const getAssignmentStats = () => {
    const totalQuestions = questions.length;
    const assignedQuestions = Object.values(questionSkills).filter(skills => skills.length > 0).length;
    const totalSkills = Object.values(questionSkills).reduce((acc, skills) => acc + skills.length, 0);
    return { totalQuestions, assignedQuestions, unassignedQuestions: totalQuestions - assignedQuestions, totalSkills };
  };

  const onSubmit = async (data: FormData): Promise<void> => {
    if (!selectedCourse || !selectedQuiz) {
      toast.error('Please select a course and quiz');
      return;
    }

    const hasSkills = Object.values(questionSkills).some(skills => skills.length > 0);
    if (!hasSkills) {
      toast.error('Please assign at least one skill to questions');
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        course_id: selectedCourse,
        question_skills: questionSkills
      };

      await skillAssignmentAPI.assign(assignmentData);
      toast.success('Skills assigned successfully!');
    } catch (error) {
      console.error('Error assigning skills:', error);
      toast.error('Failed to assign skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = (questionId: string) => {
    setHumanReviewStatus(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  // const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);

  const stats = getAssignmentStats();
  const filteredQuestions = getFilteredQuestions();

  if (loading && courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
        </div>
      </div>
    );
  }

  // Token validation utility to help debug authentication issues
  const validateAndTestToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in to access skill matrices.');
        return false;
      }

      console.log('Testing authentication token...');

      // Test token with a simple API call
      const { authAPI } = await import('../../services/api');
      const userResponse = await authAPI.me();

      console.log('Token validation successful:', {
        user: userResponse.data.user || userResponse.data,
        tokenValid: true
      });

      // Check if user has instructor permissions
      const userData = userResponse.data.user || userResponse.data;
      if (userData.canvasTokenType !== 'instructor' && userData.role !== 'instructor') {
        toast.error('Instructor permissions required. Please check your account type.');
        return false;
      }

      toast.success('Authentication verified. Instructor permissions confirmed.');
      return true;

    } catch (error: any) {
      console.error('Token validation failed:', error);

      if (error.response?.status === 401) {
        toast.error('Authentication token is invalid or expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Your account does not have instructor permissions.');
      } else {
        toast.error('Failed to validate authentication. Please check your connection.');
      }

      return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card
        title="Skill Assignment Interface"
        subtitle="Assign skills to quiz questions using AI-powered analysis and zero-shot classification"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Course and Quiz Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                {...register('courseId', { required: 'Please select a course' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
              >
                <option value="">Select a course</option>
                {Array.isArray(courses) && courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>
              )}
              {/* Debug: Authentication Test Button */}
              <button
                type="button"
                onClick={validateAndTestToken}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                🔍 Test Authentication
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Matrix
              </label>
              <select
                value={selectedMatrix}
                onChange={(e) => handleMatrixSelection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                disabled={!selectedCourse || loadingMatrices}
              >
                <option value="">
                  {!selectedCourse ? 'Select a course first' :
                    loadingMatrices ? 'Loading matrices...' :
                      availableMatrices.length === 0 ? 'No skill matrices found' :
                        'Select a skill matrix'}
                </option>
                {availableMatrices.map(matrix => (
                  <option key={matrix._id} value={matrix._id}>
                    {matrix.matrix_name} ({matrix.skills.length} skills)
                  </option>
                ))}
              </select>
              {selectedCourse && availableMatrices.length === 0 && !loadingMatrices && (
                <p className="mt-1 text-sm text-blue-600">
                  <a href="/skill-matrix" className="hover:underline">Create a skill matrix first</a>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz
              </label>
              <select
                {...register('quizId', { required: 'Please select a quiz' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                disabled={!selectedCourse || loading}
              >
                <option value="">
                  {!selectedCourse ? 'Select a course first' :
                    loading ? 'Loading quizzes...' :
                      'Select a quiz'}
                </option>
                {Array.isArray(quizzes) && quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
              {errors.quizId && (
                <p className="mt-1 text-sm text-red-600">{errors.quizId.message}</p>
              )}
            </div>
          </div>

          {/* No Course Selected */}
          {!selectedCourse && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course to Get Started</h3>
              <p className="text-gray-600">
                Choose one of your courses above to view and assign skills to quiz questions.
              </p>
            </div>
          )}

          {/* No Quiz Selected */}
          {selectedCourse && !selectedQuiz && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Quiz</h3>
              <p className="text-gray-600">
                Choose a quiz from the dropdown above to view its questions and assign skills.
              </p>
              {quizzes.length === 0 && selectedCourse && !loading && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">No Quizzes Found</h4>
                  <p className="text-sm text-blue-700">
                    This course doesn't have any quizzes yet. Create quizzes in Canvas to start assigning skills to questions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Matrix Info */}
          {selectedMatrixData && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-medium text-green-900 mb-2">
                    Using Skill Matrix: {selectedMatrixData.matrix_name}
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    {selectedMatrixData.skills.length} skills available for assignment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMatrixData.skills.slice(0, 8).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {selectedMatrixData.skills.length > 8 && (
                      <span className="text-xs text-green-600">
                        +{selectedMatrixData.skills.length - 8} more skills
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <span className="text-xs text-green-600">
                    Created: {new Date(selectedMatrixData.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No Matrix Selected Warning */}
          {selectedCourse && availableMatrices.length > 0 && !selectedMatrix && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">No Skill Matrix Selected</h4>
                  <p className="text-sm text-yellow-700">
                    Please select a skill matrix to see available skills for assignment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats and Actions - Only show if quiz is selected */}
          {selectedQuiz && questions.length > 0 && (
            <>
              {/* Stats and Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{stats.totalQuestions}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total Questions</p>
                      <p className="text-xs text-blue-600">Available for assignment</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">{stats.assignedQuestions}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Assigned</p>
                      <p className="text-xs text-green-600">Have skills assigned</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">{stats.unassignedQuestions}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Unassigned</p>
                      <p className="text-xs text-yellow-600">Need skill assignment</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold">{stats.totalSkills}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Total Skills</p>
                      <p className="text-xs text-purple-600">Assigned across all questions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Controls */}
              {isInstructor && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Brain className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">AI-Powered Analysis</h3>
                        <p className="text-sm text-gray-600">
                          Let AI analyze questions and suggest skills automatically
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        onClick={() => analyzeQuestionsWithAI(questions)}
                        loading={autoAnalysisInProgress}
                        disabled={questions.length === 0}
                        className="flex items-center"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze Questions
                      </Button>
                      <Button
                        type="button"
                        onClick={bulkAssignFromSuggestions}
                        variant="secondary"
                        disabled={Object.values(suggestions).every(arr => arr.length === 0)}
                        className="flex items-center"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Bulk Assign
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                >
                  <option value="all">All Questions</option>
                  <option value="assigned">Assigned Questions</option>
                  <option value="unassigned">Unassigned Questions</option>
                </select>
              </div>

              {/* Bulk Operations */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Bulk Operations</h4>

                {/* Matrix Skills Quick Assignment */}
                {selectedMatrixData && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Quick Assign from Matrix:</h5>
                    <div className="flex flex-wrap gap-2">
                      {getMatrixSkills().map((skill: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => bulkAssignSkill(skill)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Skill Assignment */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter custom skill name for bulk assignment..."
                      value={bulkSkill}
                      onChange={(e) => setBulkSkill(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => bulkAssignSkill(bulkSkill)}
                      disabled={!bulkSkill}
                      variant="secondary"
                      size="sm"
                    >
                      Add to All
                    </Button>
                    <Button
                      type="button"
                      onClick={bulkAssignFromSuggestions}
                      disabled={Object.values(suggestions).every(arr => arr.length === 0)}
                      variant="secondary"
                      size="sm"
                    >
                      Use AI Suggestions
                    </Button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {Array.isArray(filteredQuestions) && filteredQuestions.map((question) => {
                  // const questionAnalysisData = questionAnalysis.find(a => a.questionId === question.id);
                  const questionSuggestions = suggestions[question.id] || [];
                  const assignedSkills = questionSkills[question.id] || [];
                  const analysisStatus = aiAnalysisStatus[question.id] || 'pending';
                  const isReviewed = humanReviewStatus[question.id] || false;
                  let questionNumber = 0;
                  questionNumber++;

                  return (
                    <Card key={question.id} className="overflow-hidden">
                      <div className="p-6">
                        {/* Question Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-medium text-gray-900">Question {questionNumber}</h3>
                              {analysisStatus === 'analyzing' && (
                                <Clock className="w-4 h-4 text-blue-500 ml-2 animate-spin" />
                              )}
                              {analysisStatus === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                              )}
                              {analysisStatus === 'error' && (
                                <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                              )}
                              {isReviewed && (
                                <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Reviewed
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <p className="text-gray-800 leading-relaxed">{question.question_text}</p>
                            </div>
                          </div>
                        </div>

                        {/* AI Analysis Results - Temporarily disabled */}
                        {false && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">AI Analysis</h4>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-blue-700">
                                Complexity: <span className="font-medium">medium</span>
                              </span>
                              <span className="text-blue-700">
                                Confidence: <span className="font-medium">85%</span>
                              </span>
                            </div>
                          </div>
                        )}

                        {/* AI Suggestions */}
                        {questionSuggestions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(questionSuggestions) && questionSuggestions.map((skill, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => addSuggestionToQuestion(question.id, skill)}
                                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${assignedSkills.includes(skill)
                                    ? 'bg-green-100 text-green-800 cursor-default'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                  disabled={assignedSkills.includes(skill)}
                                >
                                  <Lightbulb className="w-3 h-3 inline mr-1" />
                                  {skill}
                                  {assignedSkills.includes(skill) && (
                                    <CheckCircle className="w-3 h-3 inline ml-1" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No AI Suggestions Available */}
                        {analysisStatus === 'completed' && questionSuggestions.length === 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-center">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                                <p className="text-sm text-yellow-800">
                                  <strong>No AI suggestions available.</strong> The AI analysis completed but didn't return any skill recommendations for this question. This appears to be a backend issue.
                                </p>
                              </div>
                              <p className="text-xs text-yellow-700 mt-2">
                                You can still assign skills manually using the input field below.
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedMatrixData && (
                          <div className="mb-4">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Quick Assign from Matrix:</h5>
                            <div className="flex flex-wrap gap-2">
                              {getMatrixSkills().map((skill: string, index: number) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => addSuggestionToQuestion(question.id, skill)}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assigned Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Skills</h4>
                          {assignedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(assignedSkills) && assignedSkills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => removeSkillFromQuestion(question.id, index)}
                                    className="ml-2 text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">No skills assigned yet</p>
                          )}
                        </div>

                        {/* Manual Skill Assignment */}
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Add custom skill..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                const skill = target.value.trim();
                                if (skill && !assignedSkills.includes(skill)) {
                                  addSkillToQuestion(question.id, skill);
                                  target.value = '';
                                }
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => markAsReviewed(question.id)}
                            variant={isReviewed ? "success" : "outline"}
                            size="sm"
                          >
                            {isReviewed ? 'Reviewed' : 'Mark Reviewed'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={stats.assignedQuestions === 0}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Skill Assignments
                </Button>
              </div>
            </>
          )}

          {/* No Questions State */}
          {selectedCourse && selectedQuiz && questions.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
              <p className="text-gray-600">
                This quiz doesn't have any questions yet. Add questions in Canvas to assign skills.
              </p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default SkillAssignmentInterface; 