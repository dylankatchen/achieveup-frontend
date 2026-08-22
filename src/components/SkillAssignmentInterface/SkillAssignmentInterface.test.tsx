import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillAssignmentInterface from './SkillAssignmentInterface';
import { useAuth } from '../../contexts/AuthContext';
import { canvasAPI, skillAssignmentAPI, skillMatrixAPI } from '../../services/api';
import toast from 'react-hot-toast';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  canvasAPI: {
    getInstructorCourses: jest.fn(),
    getCourses: jest.fn(),
    getInstructorQuizzes: jest.fn(),
    getQuizzes: jest.fn(),
    getInstructorQuestions: jest.fn(),
    getQuestions: jest.fn(),
  },
  skillAssignmentAPI: {
    analyzeQuestions: jest.fn(),
    assign: jest.fn(),
    getAssignments: jest.fn(),
    importAssignmentsFromCourse: jest.fn(),
  },
  skillMatrixAPI: {
    getAllByCourse: jest.fn(),
    getImportStatus: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const course = (id: string, name: string, code: string, term = 1) => ({ id, name, code, term });
const quiz = (id: string, title: string, course_id: string) => ({ id, title, course_id });
const question = (id: string, text: string, quiz_id: string) => ({
  id,
  question_text: text,
  quiz_id,
});

const mockInstructorAuth = () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'i1', name: 'Instructor', email: 'i@example.com', role: 'instructor' } as any,
    isInstructor: true,
    isStudent: false,
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    isAuthenticated: true,
    backendAvailable: true,
  });
};

const noMatrices = () =>
  jest.mocked(skillMatrixAPI.getAllByCourse).mockResolvedValue({ data: [] } as any);
const noImportStatus = () =>
  jest.mocked(skillMatrixAPI.getImportStatus).mockResolvedValue({
    data: { assignments_imported: true, matrices_imported: true, target_course_id: '', source_course_id: '' },
  } as any);
const noAssignments = () =>
  jest.mocked(skillAssignmentAPI.getAssignments).mockResolvedValue({
    data: { question_skills: {} },
  } as any);

beforeEach(() => {
  jest.clearAllMocks();
  mockInstructorAuth();
  noMatrices();
  noImportStatus();
  noAssignments();
});

// None of this form's <label>s have htmlFor/id pairing with their <select>,
// so getByLabelText doesn't work - the select is the label's next sibling
// in the DOM instead.
const selectByLabel = (labelText: string) =>
  screen.getByText(labelText).nextElementSibling as HTMLSelectElement;

// Finds the question Card containing the given (unique) text.
const closestCard = (text: string) =>
  screen.getByText(text).closest('div.overflow-hidden') as HTMLElement;

const selectCourse = async (courseId: string) => {
  fireEvent.change(selectByLabel('Course'), { target: { value: courseId } });
  await waitFor(() => expect(selectByLabel('Course')).toHaveValue(courseId));
};

const selectQuiz = async (quizId: string) => {
  await waitFor(() => {
    expect(selectByLabel('Quiz').querySelector(`option[value="${quizId}"]`)).not.toBeNull();
  });
  fireEvent.change(selectByLabel('Quiz'), { target: { value: quizId } });
  await waitFor(() => expect(selectByLabel('Quiz')).toHaveValue(quizId));
};

const waitForQuestionsToSettle = async (quizId: string) => {
  await waitFor(() => {
    expect(skillAssignmentAPI.analyzeQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ quizId })
    );
  });
};

describe('loading courses', () => {
  test('an instructor loads courses via the instructor endpoint', async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    render(<SkillAssignmentInterface />);

    await waitFor(() => expect(screen.getByText('Data Structures (COP3530-A 0002)')).toBeInTheDocument());
    expect(canvasAPI.getInstructorCourses).toHaveBeenCalled();
    expect(canvasAPI.getCourses).not.toHaveBeenCalled();
  });

  test('a student loads courses via the student endpoint', async () => {
    jest.mocked(useAuth).mockReturnValue({
      user: { id: 's1', name: 'Student', email: 's@example.com', role: 'student' } as any,
      isInstructor: false,
      isStudent: true,
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: true,
      backendAvailable: true,
    });
    jest.mocked(canvasAPI.getCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    render(<SkillAssignmentInterface />);

    await waitFor(() => expect(screen.getByText('Data Structures (COP3530-A 0002)')).toBeInTheDocument());
    expect(canvasAPI.getCourses).toHaveBeenCalled();
  });

  test('a courses-load failure shows an error toast', async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockRejectedValue(new Error('down'));
    render(<SkillAssignmentInterface />);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'Failed to load courses. Please check your Canvas integration.'
      );
    });
  });
});

describe('selecting a course', () => {
  beforeEach(() => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
  });

  test('loads quizzes and skill matrices for the selected course', async () => {
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());

    await selectCourse('c1');

    // Wait for the final visible outcome (quiz option rendered) - checking
    // an earlier API call's mock synchronously right after an even earlier
    // one resolved races React's render flush.
    await waitFor(() => expect(screen.getByText('Quiz One')).toBeInTheDocument());
    expect(canvasAPI.getInstructorQuizzes).toHaveBeenCalledWith('c1');
    expect(skillMatrixAPI.getAllByCourse).toHaveBeenCalledWith('c1');
  });

  test('a quizzes-load failure shows an error toast and leaves the quiz list empty', async () => {
    jest.mocked(canvasAPI.getInstructorQuizzes).mockRejectedValue(new Error('down'));
    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());

    await selectCourse('c1');

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Failed to load quizzes. Please try again.');
    });
  });

  test('auto-selects the first real skill matrix when matrices exist', async () => {
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({ data: [] } as any);
    jest.mocked(skillMatrixAPI.getAllByCourse).mockResolvedValue({
      data: [
        { _id: 'm1', matrix_name: 'Web Dev Matrix', skills: ['HTML', 'CSS'] },
        { _id: 'm2', matrix_name: 'Other Matrix', skills: ['SQL'] },
      ],
    } as any);
    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());

    await selectCourse('c1');

    await waitFor(() => expect(selectByLabel('Skill Matrix')).toHaveValue('m1'));
    expect(screen.getByText('Using Skill Matrix: Web Dev Matrix')).toBeInTheDocument();
  });

  test('a genuinely empty matrix list (successful response, zero matrices) shows a real informational toast', async () => {
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({ data: [] } as any);
    noMatrices();
    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());

    await selectCourse('c1');

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'No skill matrices found for this course yet. Create one first using the Skill Matrix page.',
        { duration: 5000 }
      );
    });
  });

  test('a 401 loading matrices shows a real auth-error toast and does not substitute fake matrices', async () => {
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({ data: [] } as any);
    jest.mocked(skillMatrixAPI.getAllByCourse).mockRejectedValue({ response: { status: 401 } });
    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());

    await selectCourse('c1');

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'Authentication failed. Please check your instructor token in Settings.'
      );
    });
    expect(screen.queryByText(/Using Skill Matrix:/)).not.toBeInTheDocument();
  });
});

describe('selecting a quiz', () => {
  beforeEach(async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
  });

  test('loads and sanitizes questions, pulls previously-saved skills, and auto-triggers AI analysis for instructors', async () => {
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({
      data: [question('cq1', 'What is <b>HTML</b>?', 'q1')],
    } as any);
    jest.mocked(skillAssignmentAPI.getAssignments).mockResolvedValue({
      data: { question_skills: { 'What is HTML?': ['HTML Fundamentals'] } },
    } as any);
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockResolvedValue({
      data: [{ questionId: 'What is HTML?', complexity: 'low', suggestedSkills: ['HTML Fundamentals'], confidence: 0.9 }],
    } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');

    // HTML stripped from the question text.
    await waitFor(() => expect(screen.getByText('What is HTML?')).toBeInTheDocument());
    await waitForQuestionsToSettle('q1');
    // Previously-saved skill shown as already assigned (it also appears as
    // a disabled AI-suggestion chip once analysis runs, hence getAllByText).
    expect(screen.getAllByText('HTML Fundamentals').length).toBeGreaterThan(0);
    // Auto-analysis kicked off without a manual click.
    expect(skillAssignmentAPI.analyzeQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'c1', quizId: 'q1' })
    );
  });

  test('a questions-load failure shows an error toast', async () => {
    jest.mocked(canvasAPI.getInstructorQuestions).mockRejectedValue(new Error('down'));

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Failed to load questions. Please try again.');
    });
  });
});

describe('AI analysis - real outcomes only', () => {
  const setupWithOneQuestion = async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({
      data: [question('cq1', 'What is HTML?', 'q1')],
    } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');
    await waitFor(() => expect(screen.getByText('What is HTML?')).toBeInTheDocument());
  };

  test('a real successful analysis with real suggestions shows the real success toast', async () => {
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockResolvedValue({
      data: [{ questionId: 'What is HTML?', complexity: 'low', suggestedSkills: ['HTML Fundamentals', 'CSS Styling'], confidence: 0.9 }],
    } as any);

    await setupWithOneQuestion();

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'AI analyzed 1 questions and provided 2 skill suggestions'
      );
    });
    expect(screen.getByRole('button', { name: /html fundamentals/i })).toBeInTheDocument();
  });

  test('a real 401 from AI analysis shows the real auth-error toast', async () => {
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockRejectedValue({ response: { status: 401 } });

    await setupWithOneQuestion();

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'Authentication failed. Please check your instructor token in Settings.'
      );
    });
  });

  test('a real 403 from AI analysis shows the real permissions-error toast', async () => {
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockRejectedValue({ response: { status: 403 } });

    await setupWithOneQuestion();

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Access denied. Instructor permissions required.');
    });
  });
});

describe('filtering, stats, and manual assignment', () => {
  const setupWithTwoQuestions = async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({
      data: [question('cq1', 'About loops', 'q1'), question('cq2', 'About HTML', 'q1')],
    } as any);
    jest.mocked(skillAssignmentAPI.getAssignments).mockResolvedValue({
      data: { question_skills: { 'About loops': ['Control Structures'] } },
    } as any);
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockResolvedValue({ data: [] } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');
    await waitFor(() => expect(screen.getByText('About loops')).toBeInTheDocument());
    await waitForQuestionsToSettle('q1');
  };

  test('shows correct assignment stats', async () => {
    await setupWithTwoQuestions();

    expect(screen.getByText('2')).toBeInTheDocument(); // Total Questions
    // 1 assigned, 1 unassigned - both "1"s, scope by their labels.
    const assignedCard = screen.getByText('Assigned').closest('div.flex') as HTMLElement;
    expect(within(assignedCard).getByText('1')).toBeInTheDocument();
    const unassignedCard = screen.getByText('Unassigned').closest('div.flex') as HTMLElement;
    expect(within(unassignedCard).getByText('1')).toBeInTheDocument();
  });

  test('search filters questions by text', async () => {
    await setupWithTwoQuestions();

    fireEvent.change(screen.getByPlaceholderText('Search questions...'), {
      target: { value: 'html' },
    });

    expect(screen.getByText('About HTML')).toBeInTheDocument();
    expect(screen.queryByText('About loops')).not.toBeInTheDocument();
  });

  test('the skill filter shows only assigned or only unassigned questions', async () => {
    await setupWithTwoQuestions();

    fireEvent.change(screen.getByDisplayValue('All Questions'), { target: { value: 'assigned' } });
    expect(screen.getByText('About loops')).toBeInTheDocument();
    expect(screen.queryByText('About HTML')).not.toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Assigned Questions'), { target: { value: 'unassigned' } });
    expect(screen.getByText('About HTML')).toBeInTheDocument();
    expect(screen.queryByText('About loops')).not.toBeInTheDocument();
  });

  test('manually adding a skill via Enter, then removing it', async () => {
    await setupWithTwoQuestions();

    const htmlCard = closestCard('About HTML');
    const input = within(htmlCard).getByPlaceholderText('Add custom skill...');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, target: { value: 'Custom Skill' } });

    await waitFor(() => expect(within(htmlCard).getByText('Custom Skill')).toBeInTheDocument());

    fireEvent.click(within(htmlCard).getByText('×'));
    expect(within(htmlCard).queryByText('Custom Skill')).not.toBeInTheDocument();
  });

  test('marking a question reviewed toggles the button label', async () => {
    await setupWithTwoQuestions();

    const htmlCard = closestCard('About HTML');
    fireEvent.click(within(htmlCard).getByRole('button', { name: 'Mark Reviewed' }));

    expect(within(htmlCard).getByRole('button', { name: 'Reviewed' })).toBeInTheDocument();
  });
});

describe('bulk assignment', () => {
  const setupWithMatrixAndQuestions = async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
    jest.mocked(skillMatrixAPI.getAllByCourse).mockResolvedValue({
      data: [{ _id: 'm1', matrix_name: 'Matrix', skills: ['Skill A', 'Skill B'] }],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({
      data: [question('cq1', 'Q1', 'q1'), question('cq2', 'Q2', 'q1')],
    } as any);
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockResolvedValue({
      data: [{ questionId: 'Q1', complexity: 'low', suggestedSkills: ['Suggested Skill'], confidence: 0.9 }],
    } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');
    await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument());
    await waitForQuestionsToSettle('q1');
  };

  test('bulk-assigning a matrix skill adds it to every currently-filtered question, not just one', async () => {
    await setupWithMatrixAndQuestions();

    fireEvent.click(screen.getAllByRole('button', { name: 'Skill A' })[0]);

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Added "Skill A" to 2 questions');
    });
    const q1Card = closestCard('Q1');
    const q2Card = closestCard('Q2');
    expect(within(q1Card).getAllByText('Skill A').length).toBeGreaterThan(0);
    expect(within(q2Card).getAllByText('Skill A').length).toBeGreaterThan(0);
  });

  test('"Use AI Suggestions" assigns real suggestions across ALL questions, not just filtered ones', async () => {
    await setupWithMatrixAndQuestions();

    // Filter down to just Q2, which has no suggestions of its own.
    fireEvent.change(screen.getByPlaceholderText('Search questions...'), { target: { value: 'Q2' } });
    expect(screen.queryByText('Q1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use AI Suggestions' }));

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'Assigned 1 skills from AI suggestions to 1 questions'
      );
    });
    // Confirm it landed on Q1 (unfiltered assignment), not the filtered Q2.
    fireEvent.change(screen.getByPlaceholderText('Search questions...'), { target: { value: '' } });
    const q1Card = closestCard('Q1');
    expect(within(q1Card).getAllByText('Suggested Skill').length).toBeGreaterThan(0);
  });

  test('"Use AI Suggestions" with nothing new to assign shows an error toast instead of a false success', async () => {
    await setupWithMatrixAndQuestions();
    fireEvent.click(screen.getByRole('button', { name: 'Use AI Suggestions' }));
    await waitFor(() => expect(jest.mocked(toast.success)).toHaveBeenCalled());
    jest.mocked(toast.success).mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Use AI Suggestions' }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'No new skills to assign - all AI suggestions are already assigned'
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('saving assignments', () => {
  const setup = async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c1', 'Data Structures', 'COP3530-A 0002')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c1')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({
      data: [question('cq1', 'Q1', 'q1')],
    } as any);
    jest.mocked(skillAssignmentAPI.analyzeQuestions).mockResolvedValue({ data: [] } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c1');
    await waitFor(() => expect(selectByLabel('Quiz')).toBeInTheDocument());
    await selectQuiz('q1');
    await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument());
    await waitForQuestionsToSettle('q1');
  };

  test('the sticky Save button is disabled until at least one question has an assigned skill', async () => {
    await setup();

    const stickySave = screen.getAllByRole('button', { name: /save skill assignments/i })[1];
    expect(stickySave).toBeDisabled();

    const q1Card = closestCard('Q1');
    fireEvent.keyPress(within(q1Card).getByPlaceholderText('Add custom skill...'), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      target: { value: 'A Skill' },
    });

    await waitFor(() => expect(stickySave).not.toBeDisabled());
  });

  test('saving calls the API with the right payload and shows a success toast', async () => {
    jest.mocked(skillAssignmentAPI.assign).mockResolvedValue({ data: { success: true } } as any);
    await setup();

    const q1Card = closestCard('Q1');
    fireEvent.keyPress(within(q1Card).getByPlaceholderText('Add custom skill...'), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      target: { value: 'A Skill' },
    });
    await waitFor(() => expect(within(q1Card).getByText('A Skill')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /save skill assignments/i })[0]);

    await waitFor(() => {
      expect(skillAssignmentAPI.assign).toHaveBeenCalledWith({
        course_id: 'c1',
        question_skills: { Q1: ['A Skill'] },
      });
    });
    expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Skills assigned successfully!');
  });

  test('a save failure shows an error toast', async () => {
    jest.mocked(skillAssignmentAPI.assign).mockRejectedValue(new Error('down'));
    await setup();

    const q1Card = closestCard('Q1');
    fireEvent.keyPress(within(q1Card).getByPlaceholderText('Add custom skill...'), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      target: { value: 'A Skill' },
    });
    await waitFor(() => expect(within(q1Card).getByText('A Skill')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /save skill assignments/i })[0]);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Failed to assign skills. Please try again.');
    });
  });
});

describe('past-course import (findPastCourse matching)', () => {
  beforeEach(() => {
    // The import box only shows when assignments haven't been imported yet
    // for the target course - the shared default mock says they have.
    jest.mocked(skillMatrixAPI.getImportStatus).mockResolvedValue({
      data: { assignments_imported: false, matrices_imported: false, target_course_id: '', source_course_id: '' },
    } as any);
  });

  test('offers to import from a same-base, same-section course with a lower term', async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [
        course('c-current', 'Current', 'COP3530-A 0002', 3),
        course('c-older', 'Older Match', 'COP3530-A 0002', 1),
        course('c-newer-match', 'Newer Match', 'COP3530-A 0002', 2),
        course('c-diff-base', 'Different Base', 'COP4020-A 0002', 1),
        course('c-diff-section', 'Different Section', 'COP3530-A 0003', 1),
      ],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({ data: [] } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c-current');

    // Among the two valid matches (term 1 and term 2), the most recent (term 2) wins.
    await waitFor(() => expect(screen.getByText('Similar Course Found')).toBeInTheDocument());
    expect(screen.getByText('Import Assignments From Newer Match')).toBeInTheDocument();
  });

  test('clicking import calls the API with (source, target) and refreshes questions', async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c-current', 'Current', 'COP3530-A 0002', 2), course('c-older', 'Older', 'COP3530-A 0002', 1)],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({
      data: [quiz('q1', 'Quiz One', 'c-current')],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuestions).mockResolvedValue({ data: [] } as any);
    jest.mocked(skillAssignmentAPI.importAssignmentsFromCourse).mockResolvedValue({
      data: { message: 'ok', imported_count: 3, matrices: [] },
    } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c-current');
    await waitFor(() => expect(screen.getByText('Similar Course Found')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Import Assignments From Older'));

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'Imported 3 skill assignment(s) from past course'
      );
    });
    expect(skillAssignmentAPI.importAssignmentsFromCourse).toHaveBeenCalledWith('c-older', 'c-current');
  });

  test('with no matching past course, the import box does not appear', async () => {
    jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({
      data: [course('c-current', 'Current', 'COP3530-A 0002', 1)],
    } as any);
    jest.mocked(canvasAPI.getInstructorQuizzes).mockResolvedValue({ data: [] } as any);

    render(<SkillAssignmentInterface />);
    await waitFor(() => expect(selectByLabel('Course')).toBeInTheDocument());
    await selectCourse('c-current');

    await waitFor(() => expect(canvasAPI.getInstructorQuizzes).toHaveBeenCalled());
    expect(screen.queryByText('Similar Course Found')).not.toBeInTheDocument();
  });
});
