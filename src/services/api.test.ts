import axios from 'axios';

// Jest hoists jest.mock() calls above all top-level statements, so the mock
// instance has to be defined inline inside the factory (referencing an outer
// const here would throw a temporal-dead-zone ReferenceError regardless of
// source order) -- a real handle to it is pulled back out below, after
// import, via axios.create's own recorded return value.
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

import {
  skillMatrixAPI,
  courseDescriptionAPI,
  skillAssignmentAPI,
  badgeAPI,
  progressAPI,
  analyticsAPI,
  canvasAPI,
  authAPI,
  questionAnalysisAPI,
  instructorAPI,
  canvasInstructorAPI,
} from './api';

// api.ts calls axios.create(...) and registers its interceptors once, at
// module-import time (above). react-scripts' Jest config runs with
// resetMocks: true, which wipes every mock's recorded calls before each
// test -- so these need to be captured now, at module scope, before any
// test's implicit beforeEach can erase them. The captured function
// references stay valid and callable regardless of later resets.
const axiosCreateConfig = jest.mocked(axios.create).mock.calls[0][0];
const mockAxiosInstance = jest.mocked(axios.create).mock.results[0].value as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
};
const [requestInterceptor, requestErrorInterceptor] =
  mockAxiosInstance.interceptors.request.use.mock.calls[0];
const [responseInterceptor, responseErrorInterceptor] =
  mockAxiosInstance.interceptors.response.use.mock.calls[0];

const originalLocation = window.location;

beforeAll(() => {
  // Swap in a minimal writable stub so the response interceptor's
  // `window.location.href = '/login'` can be asserted directly, instead of
  // triggering jsdom's noisy (and here, irrelevant) "not implemented:
  // navigation" real-navigation path.
  // @ts-expect-error -- deliberately replacing window.location for this file
  delete window.location;
  // @ts-expect-error
  window.location = { href: '' };
});

afterAll(() => {
  window.location = originalLocation;
});

beforeEach(() => {
  localStorage.clear();
  window.location.href = '';
});

describe('axios client configuration', () => {
  test('is created with the correct default base URL and JSON content type', () => {
    // api.ts falls back to localhost:5001 (not 5000) when
    // REACT_APP_API_URL isn't set -- the old test's own comment claimed
    // 5000 and never actually checked it.
    expect(axiosCreateConfig).toMatchObject({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('request interceptor', () => {
  test('adds an Authorization header when a token exists', () => {
    localStorage.setItem('token', 'abc123');
    const config = requestInterceptor({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  test('adds no Authorization header when there is no token', () => {
    const config = requestInterceptor({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('propagates request errors unchanged', async () => {
    const error = new Error('boom');
    await expect(requestErrorInterceptor(error)).rejects.toBe(error);
  });
});

describe('response interceptor', () => {
  test('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } };
    expect(responseInterceptor(response)).toBe(response);
  });

  test('a 401 with no error.code clears the token and redirects to /login', async () => {
    localStorage.setItem('token', 'abc123');
    const error = { response: { status: 401 } };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('a 401 that has error.code (a network-layer error, not a real 401) does not redirect', async () => {
    localStorage.setItem('token', 'abc123');
    const error = { response: { status: 401 }, code: 'ECONNABORTED' };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(window.location.href).toBe('');
  });

  test('non-401 errors do not clear the token or redirect', async () => {
    localStorage.setItem('token', 'abc123');
    const error = { response: { status: 500 } };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(window.location.href).toBe('');
  });
});

describe('skillMatrixAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    skillMatrixAPI.importMatricesFromCourse('courseA', 'courseB');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/matrix/import', {
      source_course_id: 'courseA',
      target_course_id: 'courseB',
    });

    const matrixData = { course_id: 'c1', matrix_name: 'Matrix', skills: ['Skill 1'] } as any;
    skillMatrixAPI.create(matrixData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/matrix/create', matrixData);

    skillMatrixAPI.get('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/matrix/c1');

    skillMatrixAPI.getAllByCourse('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/matrix/course/c1');

    const updateData = { matrix_name: 'Renamed' } as any;
    skillMatrixAPI.update('m1', updateData);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/achieveup/matrix/m1', updateData);

    skillMatrixAPI.delete('m1');
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/achieveup/matrix/delete/m1');

    const suggestionRequest = { courseId: 'c1', courseName: 'Course', courseCode: 'COP1' };
    skillMatrixAPI.getSkillSuggestions(suggestionRequest);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/ai/suggest-skills', suggestionRequest);

    skillMatrixAPI.getImportStatus('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/import-status/c1');
  });
});

describe('courseDescriptionAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    courseDescriptionAPI.get('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/course-description/c1');

    courseDescriptionAPI.update('c1', 'A new description');
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/achieveup/course-description/c1', {
      description: 'A new description',
    });
  });
});

describe('skillAssignmentAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    skillAssignmentAPI.importAssignmentsFromCourse('courseA', 'courseB');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/skills/import', {
      source_course_id: 'courseA',
      target_course_id: 'courseB',
    });

    const assignData = { course_id: 'c1', question_skills: {} } as any;
    skillAssignmentAPI.assign(assignData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/skills/assign', assignData);

    const suggestData = { question_text: 'What is a variable?' } as any;
    skillAssignmentAPI.suggest(suggestData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/skills/suggest', suggestData);

    skillAssignmentAPI.analyzeQuestions({
      courseId: 'c1',
      quizId: 'q1',
      matrixId: 'm1',
      questions: [{ id: 'q1' }],
    });
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/ai/analyze-questions', {
      courseId: 'c1',
      quizId: 'q1',
      matrixId: 'm1',
      questions: [{ id: 'q1' }],
    });

    skillAssignmentAPI.bulkAssignWithAI({ courseId: 'c1', quizId: 'q1' });
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/ai/bulk-assign', {
      courseId: 'c1',
      quizId: 'q1',
    });

    skillAssignmentAPI.getImportStatus('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/import-status/c1');
  });

  describe('getAssignments', () => {
    // Backend still expects the query param name "question_id"; the actual
    // value passed is question text, not an id -- and it appends one
    // question_id param per question rather than a single combined value.
    test('appends one question_id param per question, alongside course_id', () => {
      skillAssignmentAPI.getAssignments('c1', ['first question', 'second question']);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/achieveup/skills/assignments?course_id=c1&question_id=first+question&question_id=second+question'
      );
    });

    test('with a single question, includes just one question_id param', () => {
      skillAssignmentAPI.getAssignments('c1', ['only question']);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/achieveup/skills/assignments?course_id=c1&question_id=only+question'
      );
    });

    test('with zero questions, only course_id is present', () => {
      skillAssignmentAPI.getAssignments('c1', []);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/skills/assignments?course_id=c1');
    });
  });
});

describe('badgeAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    const generateData = { student_id: 's1', course_id: 'c1' } as any;
    badgeAPI.generate(generateData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/badges/generate', generateData);

    badgeAPI.getStudentBadges('s1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/badges/s1');

    badgeAPI.getCourseBadges('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/badges/course/c1');

    badgeAPI.getStudentEarnedBadges('s1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/badges/student/s1/earned');

    badgeAPI.getPublicStudentBadges('s1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/public/badges/student/s1/earned');
  });
});

describe('progressAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    progressAPI.getSkillProgress('s1', 'c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/progress/s1/c1');

    const updateData = { student_id: 's1', course_id: 'c1', skill_scores: {} } as any;
    progressAPI.updateSkillProgress(updateData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/progress/update', updateData);
  });
});

describe('analyticsAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    analyticsAPI.getIndividualGraphs('s1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/graphs/individual/s1');

    analyticsAPI.exportCourseData('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/export/c1');

    const importData = { course_id: 'c1' } as any;
    analyticsAPI.importCourseData(importData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/import', importData);
  });
});

describe('canvasAPI', () => {
  test('each method hits the right endpoint', () => {
    canvasAPI.getCourses();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/courses');

    canvasAPI.getQuizzes('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/courses/c1/quizzes');

    canvasAPI.getQuestions('q1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/quizzes/q1/questions');

    canvasAPI.testConnection();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/test-connection');

    canvasAPI.getInstructorCourses();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/courses');

    canvasAPI.getInstructorQuizzes('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/courses/c1/quizzes');

    canvasAPI.getInstructorQuestions('q1', 'c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/canvas/instructor/courses/c1/quizzes/q1/questions'
    );
  });
});

describe('authAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    authAPI.login({ email: 'a@b.com', password: 'pw' });
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'pw',
    });

    const signupData = { name: 'A', email: 'a@b.com', password: 'pw', canvasApiToken: 'tok' } as any;
    authAPI.signup(signupData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/signup', signupData);

    authAPI.verify();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/verify');

    authAPI.me();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me');

    const profileData = { name: 'New Name' };
    authAPI.updateProfile(profileData);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', profileData);

    const passwordData = { currentPassword: 'old', newPassword: 'new' };
    authAPI.changePassword(passwordData);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/password', passwordData);

    const tokenData = { canvasApiToken: 'tok', canvasTokenType: 'instructor' } as any;
    authAPI.validateCanvasToken(tokenData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/validate-canvas-token', tokenData);
  });
});

describe('questionAnalysisAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    const analyzeData = { questions: [] } as any;
    questionAnalysisAPI.analyzeQuestions(analyzeData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/questions/analyze', analyzeData);

    questionAnalysisAPI.getQuestionSuggestions('q1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/questions/q1/suggestions');
  });
});

describe('instructorAPI', () => {
  test('each method hits the right endpoint with the right payload', () => {
    const createData = { course_id: 'c1' } as any;
    instructorAPI.createSkillMatrix(createData);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/achieveup/instructor/skill-matrix/create',
      createData
    );

    instructorAPI.getCourseAnalytics('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/instructor/courses/c1/analytics');

    instructorAPI.suggestSkillsForCourse('c1', 'Intro to CS');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/instructor/courses/suggest-skills', {
      courseId: 'c1',
      courseTitle: 'Intro to CS',
    });

    const questions = [{ id: 'q1', text: 'What is a variable?' }];
    instructorAPI.analyzeQuestionsWithAI(questions, 'Intro to CS');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/instructor/questions/analyze-ai', {
      questions,
      courseContext: 'Intro to CS',
    });

    instructorAPI.bulkAssignSkillsWithAI('c1', 'q1');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/instructor/skills/bulk-assign-ai', {
      courseId: 'c1',
      quizId: 'q1',
    });

    const quizResponses = [{ questionId: 'q1', correct: true }];
    instructorAPI.assessStudentSkills('s1', 'c1', quizResponses);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/instructor/assessment/evaluate', {
      studentId: 's1',
      courseId: 'c1',
      quizResponses,
    });

    const skillLevels = { 'HTML Basics': 'beginner' } as any;
    instructorAPI.generateWebLinkedBadges('s1', 'c1', skillLevels);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/achieveup/instructor/badges/generate-web-linked',
      { studentId: 's1', courseId: 'c1', skillLevels }
    );

    instructorAPI.getInstructorDashboard();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/achieveup/instructor/dashboard');

    instructorAPI.getCourseStudentAnalytics('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/achieveup/instructor/courses/c1/student-analytics'
    );

    instructorAPI.forceSyncCourse('c1');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/achieveup/instructor/course/c1/force-sync');
  });
});

describe('canvasInstructorAPI', () => {
  test('each method hits the right endpoint', () => {
    canvasInstructorAPI.getInstructorCourses();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/courses');

    canvasInstructorAPI.getInstructorQuizzes('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/courses/c1/quizzes');

    canvasInstructorAPI.getInstructorQuestions('q1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/quizzes/q1/questions');

    canvasInstructorAPI.getQuizSubmissions('q1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/quizzes/q1/submissions');

    canvasInstructorAPI.getCourseEnrollment('c1');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/courses/c1/enrollment');

    canvasInstructorAPI.validateInstructorToken();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/canvas/instructor/validate-token');
  });
});
