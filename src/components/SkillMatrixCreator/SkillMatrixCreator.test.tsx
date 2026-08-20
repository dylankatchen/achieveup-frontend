import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import SkillMatrixCreator from './SkillMatrixCreator';

// Mock AuthContext - every test here renders as an instructor, since the
// component gates course-loading, AI suggestions, and skill-suggestion
// requests behind isInstructor.
const mockAuthContext = {
  user: {
    id: 'instructor-1',
    name: 'Dr. Jane Smith',
    email: 'jane@example.com',
    role: 'instructor',
    canvasTokenType: 'instructor',
  },
  loading: false,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  isAuthenticated: true,
  backendAvailable: true,
  isInstructor: true,
  isStudent: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock API calls. The component only ever calls canvasAPI (never
// canvasInstructorAPI, which is a separate, unrelated export in api.ts).
const mockGetInstructorCourses = jest.fn();
const mockGetSkillSuggestions = jest.fn();
const mockCreateMatrix = jest.fn();
const mockGetAllByCourse = jest.fn();
const mockGetImportStatus = jest.fn();
const mockImportMatricesFromCourse = jest.fn();
const mockUpdateMatrix = jest.fn();
const mockDeleteMatrix = jest.fn();
const mockGetCourseDescription = jest.fn();
const mockUpdateCourseDescription = jest.fn();

jest.mock('../../services/api', () => ({
  canvasAPI: {
    getInstructorCourses: (...args: unknown[]) => mockGetInstructorCourses(...args),
    getCourses: (...args: unknown[]) => mockGetInstructorCourses(...args),
  },
  skillMatrixAPI: {
    getSkillSuggestions: (...args: unknown[]) => mockGetSkillSuggestions(...args),
    create: (...args: unknown[]) => mockCreateMatrix(...args),
    getAllByCourse: (...args: unknown[]) => mockGetAllByCourse(...args),
    getImportStatus: (...args: unknown[]) => mockGetImportStatus(...args),
    importMatricesFromCourse: (...args: unknown[]) => mockImportMatricesFromCourse(...args),
    update: (...args: unknown[]) => mockUpdateMatrix(...args),
    delete: (...args: unknown[]) => mockDeleteMatrix(...args),
  },
  courseDescriptionAPI: {
    get: (...args: unknown[]) => mockGetCourseDescription(...args),
    update: (...args: unknown[]) => mockUpdateCourseDescription(...args),
  },
}));

// Mock react-hot-toast (SkillMatrixCreator.tsx uses the default export)
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Minimal working react-hook-form mock. The real library reads current field
// values off the DOM via refs when the form submits. The previous mock's
// handleSubmit just returned onSubmit unwrapped, so onSubmit received the raw
// DOM submit event instead of {matrixName, description} - data.matrixName was
// always undefined, which broke every test that actually submits the form.
// This tracks values through register()'s onChange and setValue() instead, so
// handleSubmit(onSubmit) calls onSubmit with real tracked data.
jest.mock('react-hook-form', () => {
  const formValues: Record<string, string> = {};
  return {
    useForm: () => ({
      register: (name: string) => ({
        name,
        onChange: (e: any) => {
          formValues[name] = e.target.value;
        },
        onBlur: jest.fn(),
        ref: jest.fn(),
      }),
      handleSubmit: (fn: (data: any) => void | Promise<void>) => (e?: any) => {
        e?.preventDefault?.();
        return fn({ ...formValues });
      },
      setValue: (name: string, value: string) => {
        formValues[name] = value;
      },
      formState: { errors: {} },
    }),
  };
});

describe('SkillMatrixCreator Component', () => {
  const mockCourses = [
    {
      id: 'course1',
      name: 'Introduction to Web Development',
      code: 'COP3530',
      term: 1,
      description: 'Learn HTML, CSS, and JavaScript fundamentals',
    },
    {
      id: 'course2',
      name: 'Advanced Database Systems',
      code: 'CDA4010',
      term: 1,
      description: 'Advanced concepts in database design and optimization',
    },
  ];

  const mockSkillSuggestions = [
    {
      skill: 'HTML/CSS Fundamentals',
      relevance: 0.95,
      description: 'Core web markup and styling skills',
    },
    {
      skill: 'JavaScript Programming',
      relevance: 0.9,
      description: 'Client-side scripting and DOM manipulation',
    },
    {
      skill: 'Responsive Design',
      relevance: 0.85,
      description: 'Mobile-first design principles',
    },
  ];

  // Helpers shared across tests to cut down on repetition. Each waits for its
  // target to appear, then acts on it exactly once outside the waitFor - a
  // click *inside* a waitFor callback gets re-fired on every retry until the
  // callback stops throwing, which silently double- or triple-applies the
  // action (this caused real, hard-to-diagnose failures below).
  const selectCourse = async (courseName: string) => {
    const courseText = await screen.findByText(courseName);
    fireEvent.click(courseText.closest('div')!);
  };

  const clickGetSuggestions = async () => {
    const button = await screen.findByText('Get AI Skill Suggestions');
    fireEvent.click(button);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGetInstructorCourses.mockResolvedValue({ data: mockCourses });
    mockGetSkillSuggestions.mockResolvedValue({ data: mockSkillSuggestions });
    mockCreateMatrix.mockResolvedValue({
      data: { _id: 'matrix1', course_id: 'course1', matrix_name: 'Test Matrix', skills: [], created_at: '', updated_at: '' },
    });
    mockGetAllByCourse.mockResolvedValue({ data: [] });
    mockGetImportStatus.mockResolvedValue({
      data: { target_course_id: '', source_course_id: '', matrices_imported: false, assignments_imported: false },
    });
    mockGetCourseDescription.mockResolvedValue({ data: { course_id: '', description: '', updated_at: null } });
    mockUpdateCourseDescription.mockResolvedValue({ data: { course_id: '', description: '', updated_at: null } });
  });

  test('renders initial course selection step', async () => {
    render(<SkillMatrixCreator />);

    await waitFor(() => {
      expect(screen.getByText('Skill Matrix Creator')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Select Course')).toBeInTheDocument();
      expect(mockGetInstructorCourses).toHaveBeenCalled();
    });
  });

  test('displays courses from API', async () => {
    render(<SkillMatrixCreator />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Web Development')).toBeInTheDocument();
      expect(screen.getByText('COP3530')).toBeInTheDocument();
      expect(screen.getByText('Advanced Database Systems')).toBeInTheDocument();
      expect(screen.getByText('CDA4010')).toBeInTheDocument();
    });
  });

  test('handles course selection and moves to skill suggestions step', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');

    await waitFor(() => {
      expect(screen.getByText('Step 2: Get Skill Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Selected Course')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Web Development')).toBeInTheDocument();
    });
  });

  test('handles AI skill suggestion process', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    await waitFor(() => {
      expect(mockGetSkillSuggestions).toHaveBeenCalledWith({
        courseId: 'course1',
        courseName: 'Introduction to Web Development',
        courseCode: 'COP3530',
        courseDescription: 'Learn HTML, CSS, and JavaScript fundamentals',
      });
    });
  });

  test('displays AI-suggested skills with relevance scores', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    await waitFor(() => {
      expect(screen.getByText('Step 3: Review and Customize Skills')).toBeInTheDocument();
      expect(screen.getByText('AI Suggested Skills (3 skills)')).toBeInTheDocument();
    });

    // Each suggestion's skill name also appears a second time in the Final
    // Skills List below (it's auto-selected), so scope to the suggestions
    // section specifically rather than asserting on the page as a whole.
    const aiSection = screen.getByText(/AI Suggested Skills/).closest('div')!;
    expect(within(aiSection).getByText('HTML/CSS Fundamentals')).toBeInTheDocument();
    expect(within(aiSection).getByText('JavaScript Programming')).toBeInTheDocument();
    expect(within(aiSection).getByText('Responsive Design')).toBeInTheDocument();
    expect(within(aiSection).getByText('Relevance: 95%')).toBeInTheDocument();
  });

  test('allows toggling of suggested skills', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const aiSection = await screen.findByText(/AI Suggested Skills/).then((el) => el.closest('div')!);
    // The skill name's nearest ancestor <div> is an inner layout wrapper with
    // no state classes; the actual styled/clickable card is its parent.
    const skillCard = within(aiSection).getByText('HTML/CSS Fundamentals').closest('div')!.parentElement;
    expect(skillCard).toHaveClass('border-green-300', 'bg-green-50'); // Should be selected by default

    fireEvent.click(skillCard!);
    expect(skillCard).toHaveClass('border-gray-200'); // Should be deselected
  });

  test('allows adding custom skills', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const customSkillInput = await screen.findByPlaceholderText('Add custom skill...');
    fireEvent.change(customSkillInput, { target: { value: 'Custom Skill' } });

    const addButton = screen.getByRole('button', { name: '' }); // Plus icon button
    fireEvent.click(addButton);

    expect(screen.getByText('Custom Skill')).toBeInTheDocument();
  });

  test('allows editing existing skills', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    // The Edit and Remove buttons both contain an svg icon, so picking "the
    // first button with an svg" is ambiguous - target by their title (which
    // becomes the accessible name) instead.
    const editButton = (await screen.findAllByTitle('Edit skill'))[0];
    fireEvent.click(editButton);

    const editInput = screen.getByDisplayValue('HTML/CSS Fundamentals');
    fireEvent.change(editInput, { target: { value: 'Updated HTML/CSS Skills' } });
    fireEvent.blur(editInput);

    expect(screen.getByText('Updated HTML/CSS Skills')).toBeInTheDocument();
  });

  test('allows removing skills', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const removeButton = (await screen.findAllByTitle('Remove skill'))[0];
    fireEvent.click(removeButton);

    // Removing only affects the Final Skills List - the AI suggestion card
    // for this skill is separate state and still shows the skill as an
    // available (now unselected) suggestion, so scope the check accordingly.
    const finalSkillsSection = screen.getByText(/Skills List \(/).closest('div')!;
    expect(within(finalSkillsSection).queryByText('HTML/CSS Fundamentals')).not.toBeInTheDocument();
  });

  test('handles matrix creation with valid data', async () => {
    const onMatrixCreated = jest.fn();
    render(<SkillMatrixCreator onMatrixCreated={onMatrixCreated} />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const createButton = await screen.findByText('Create Skill Matrix');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateMatrix).toHaveBeenCalledWith({
        course_id: 'course1',
        matrix_name: 'Introduction to Web Development - Skills Matrix',
        skills: ['HTML/CSS Fundamentals', 'JavaScript Programming', 'Responsive Design'],
        description: undefined,
      });
      expect(onMatrixCreated).toHaveBeenCalled();
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Skill matrix created successfully!');
    });
  });

  test('prevents creation with no skills selected', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    // Deselect all skills - scoped to the AI Suggested Skills section
    // specifically, since each skill's name also appears a second time in
    // the Final Skills List below, which isn't clickable the same way.
    const aiSection = await screen.findByText(/AI Suggested Skills/).then((el) => el.closest('div')!);
    const skillCards = within(aiSection)
      .getAllByText(/HTML\/CSS|JavaScript|Responsive/)
      .map((text) => text.closest('div'));
    skillCards.forEach((card) => card && fireEvent.click(card));

    const createButton = screen.getByText('Create Skill Matrix');
    expect(createButton).toBeDisabled();
  });

  test('handles API error for course loading', async () => {
    mockGetInstructorCourses.mockRejectedValue(new Error('Network error'));

    render(<SkillMatrixCreator />);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'Failed to load courses. Please check your Canvas integration.'
      );
    });
  });

  test('handles API error for skill suggestions', async () => {
    mockGetSkillSuggestions.mockRejectedValue(new Error('AI service unavailable'));

    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get skill suggestions: AI service unavailable')
      );
      expect(screen.getByText('Step 3: Review and Customize Skills')).toBeInTheDocument();
    });
  });

  test('handles matrix creation failure', async () => {
    mockCreateMatrix.mockRejectedValue(new Error('Database error'));

    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const createButton = await screen.findByText('Create Skill Matrix');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create skill matrix: Database error')
      );
    });
  });

  test('allows skipping AI suggestions and manual entry', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');

    const skipButton = await screen.findByText('Skip and Add Skills Manually');
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(screen.getByText('Step 3: Review and Customize Skills')).toBeInTheDocument();
      expect(screen.queryByText('AI Suggested Skills')).not.toBeInTheDocument();
      expect(screen.getByText('No skills added yet. Add skills below.')).toBeInTheDocument();
    });
  });

  test('shows loading state during skill suggestions', async () => {
    let resolvePromise: (value: any) => void;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockGetSkillSuggestions.mockReturnValue(loadingPromise);

    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');

    const suggestionsButton = await screen.findByText('Get AI Skill Suggestions');
    fireEvent.click(suggestionsButton);

    // Should show loading state
    expect(screen.getByText('Getting Skill Suggestions...')).toBeInTheDocument();
    expect(suggestionsButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ data: mockSkillSuggestions });

    await waitFor(() => {
      expect(screen.queryByText('Getting Skill Suggestions...')).not.toBeInTheDocument();
    });
  });

  test('shows loading state during matrix creation', async () => {
    let resolvePromise: (value: any) => void;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockCreateMatrix.mockReturnValue(loadingPromise);

    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const createButton = await screen.findByText('Create Skill Matrix');
    fireEvent.click(createButton);

    // Should show loading state
    expect(createButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      data: { _id: 'matrix1', course_id: 'course1', matrix_name: 'x', skills: [], created_at: '', updated_at: '' },
    });

    // A successful creation resets finalSkills to [] for the next matrix, so
    // the button goes right back to disabled for a different reason
    // (finalSkills.length === 0) - the thing that actually proves loading
    // cleared is that the success flow completed and returned to Step 2.
    await waitFor(() => {
      expect(screen.getByText('Step 2: Get Skill Suggestions')).toBeInTheDocument();
    });
  });

  test('handles keyboard navigation for custom skill input', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');

    const skipButton = await screen.findByText('Skip and Add Skills Manually');
    fireEvent.click(skipButton);

    const customSkillInput = await screen.findByPlaceholderText('Add custom skill...');
    fireEvent.change(customSkillInput, { target: { value: 'Keyboard Skill' } });
    await waitFor(() => expect(customSkillInput).toHaveValue('Keyboard Skill'));
    fireEvent.keyPress(customSkillInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Skill')).toBeInTheDocument();
    });
  });

  test('prevents duplicate custom skills', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const customSkillInput = await screen.findByPlaceholderText('Add custom skill...');
    fireEvent.change(customSkillInput, { target: { value: 'HTML/CSS Fundamentals' } }); // Duplicate

    const addButton = screen.getByRole('button', { name: '' });
    fireEvent.click(addButton);

    // "HTML/CSS Fundamentals" legitimately appears twice at once - once in
    // the AI Suggested Skills card, once in the Final Skills List (it's an
    // auto-selected suggestion) - so what actually proves the duplicate
    // wasn't added is that the Final Skills List still shows it only once.
    const finalSkillsSection = screen.getByText(/Skills List \(/).closest('div')!;
    expect(within(finalSkillsSection).getAllByText('HTML/CSS Fundamentals')).toHaveLength(1);
  });

  test('handles back navigation between steps', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    await waitFor(() => {
      expect(screen.getByText('Step 3: Review and Customize Skills')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back'));

    expect(screen.getByText('Step 2: Get Skill Suggestions')).toBeInTheDocument();
  });

  test('resets form state to step 2 on successful creation', async () => {
    render(<SkillMatrixCreator />);

    await selectCourse('Introduction to Web Development');
    await clickGetSuggestions();

    const createButton = await screen.findByText('Create Skill Matrix');
    fireEvent.click(createButton);

    await waitFor(() => {
      // The component intentionally stays on Step 2 (not back to Step 1)
      // after a successful creation, so an instructor can immediately build
      // another matrix for the same course - the UI copy says as much
      // ("You can create multiple skill matrices for the same course...").
      expect(screen.getByText('Step 2: Get Skill Suggestions')).toBeInTheDocument();
    });
  });

  describe('Existing skill matrices panel', () => {
    const mockExistingMatrix = {
      _id: 'matrix-existing-1',
      course_id: 'course1',
      matrix_name: 'Midterm Skills',
      skills: ['HTML Basics', 'CSS Basics'],
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    };

    beforeEach(() => {
      mockGetAllByCourse.mockResolvedValue({ data: [mockExistingMatrix] });
    });

    test('shows existing matrices for the selected course, already expanded', async () => {
      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');

      await waitFor(() => {
        expect(screen.getByText('Existing Skill Matrices for Introduction to Web Development')).toBeInTheDocument();
        expect(screen.getByText('Hide (1)')).toBeInTheDocument(); // auto-expanded since matrices exist
        expect(screen.getByText('Midterm Skills')).toBeInTheDocument();
        expect(screen.getByText('HTML Basics')).toBeInTheDocument();
        expect(screen.getByText('CSS Basics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Hide (1)'));
      expect(screen.queryByText('Midterm Skills')).not.toBeInTheDocument();
      expect(screen.getByText('Show (1)')).toBeInTheDocument();
    });

    test('"Use as Template" loads an existing matrix into the review step', async () => {
      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      await waitFor(() => expect(screen.getByText('Midterm Skills')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Use as Template'));

      await waitFor(() => {
        expect(screen.getByText('Step 3: Review and Customize Skills')).toBeInTheDocument();
        const finalSkillsSection = screen.getByText(/Skills List \(/).closest('div')!;
        expect(within(finalSkillsSection).getByText('HTML Basics')).toBeInTheDocument();
        expect(within(finalSkillsSection).getByText('CSS Basics')).toBeInTheDocument();
      });
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'Matrix skills loaded for reference. You can modify and create a new matrix.'
      );
    });

    test('inline edit adds a skill and saves via skillMatrixAPI.update', async () => {
      mockUpdateMatrix.mockResolvedValue({
        data: { ...mockExistingMatrix, skills: ['HTML Basics', 'CSS Basics', 'Flexbox'] },
      });

      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      await waitFor(() => expect(screen.getByText('Midterm Skills')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Edit'));

      const newSkillInput = screen.getByPlaceholderText('Add a skill...');
      fireEvent.change(newSkillInput, { target: { value: 'Flexbox' } });
      fireEvent.click(screen.getByText('Add'));

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateMatrix).toHaveBeenCalledWith('matrix-existing-1', {
          skills: ['HTML Basics', 'CSS Basics', 'Flexbox'],
          matrix_name: 'Midterm Skills',
        });
        expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Matrix updated');
        // Back to view mode
        expect(screen.getByText('Use as Template')).toBeInTheDocument();
      });
    });

    test('deletes a matrix after confirmation', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteMatrix.mockResolvedValue({ data: undefined });

      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      await waitFor(() => expect(screen.getByText('Midterm Skills')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockDeleteMatrix).toHaveBeenCalledWith('matrix-existing-1');
        expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Skill matrix deleted');
        expect(screen.queryByText('Midterm Skills')).not.toBeInTheDocument();
      });

      jest.spyOn(window, 'confirm').mockRestore();
    });

    test('does not delete a matrix when confirmation is declined', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      await waitFor(() => expect(screen.getByText('Midterm Skills')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Delete'));

      expect(mockDeleteMatrix).not.toHaveBeenCalled();
      expect(screen.getByText('Midterm Skills')).toBeInTheDocument();

      jest.spyOn(window, 'confirm').mockRestore();
    });
  });

  describe('Past-course auto-import', () => {
    // Same base course code + section, offered in different terms - the
    // shape findPastCourse is designed to match.
    const currentCourse = {
      id: 'course-current',
      name: 'Data Structures (Fall)',
      code: 'COP3530 0001',
      term: 3,
      description: 'DS Fall term',
    };
    const pastCourse = {
      id: 'course-past',
      name: 'Data Structures (Spring)',
      code: 'COP3530 0001',
      term: 1,
      description: 'DS Spring term',
    };

    beforeEach(() => {
      mockGetInstructorCourses.mockResolvedValue({ data: [currentCourse, pastCourse] });
    });

    test('shows an import banner when a past offering of the same course exists', async () => {
      render(<SkillMatrixCreator />);

      await selectCourse('Data Structures (Fall)');

      await waitFor(() => {
        expect(screen.getByText('Similar Course Found')).toBeInTheDocument();
        expect(screen.getByText('Import Matrices From Data Structures (Spring)')).toBeInTheDocument();
      });
    });

    test('importing from the past course calls the API and hides the banner', async () => {
      mockImportMatricesFromCourse.mockResolvedValue({
        data: { message: 'ok', imported_count: 2, matrices: [] },
      });
      // First call (on course select): not yet imported, banner should show.
      // Every call after (the refresh handleImportFromPastCourse triggers):
      // reflects the import that just happened, same as a real backend would.
      mockGetImportStatus
        .mockResolvedValueOnce({
          data: { target_course_id: '', source_course_id: '', matrices_imported: false, assignments_imported: false },
        })
        .mockResolvedValue({
          data: { target_course_id: '', source_course_id: '', matrices_imported: true, assignments_imported: false },
        });

      render(<SkillMatrixCreator />);

      await selectCourse('Data Structures (Fall)');
      await waitFor(() => expect(screen.getByText('Similar Course Found')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Import Matrices From Data Structures (Spring)'));

      await waitFor(() => {
        expect(mockImportMatricesFromCourse).toHaveBeenCalledWith('course-past', 'course-current');
        expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
          'Imported 2 skill matrix(s) from past course'
        );
        expect(screen.queryByText('Similar Course Found')).not.toBeInTheDocument();
      });
    });
  });

  describe('Course description modal', () => {
    test('loads a persisted description and saves an edit', async () => {
      mockGetCourseDescription.mockResolvedValue({
        data: { course_id: 'course1', description: 'Existing persisted description', updated_at: '2026-01-01' },
      });

      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      fireEvent.click(screen.getByText('Edit Course Description'));

      const textarea = await screen.findByDisplayValue('Existing persisted description');
      fireEvent.change(textarea, { target: { value: 'Updated description text' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateCourseDescription).toHaveBeenCalledWith('course1', 'Updated description text');
        expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Course description saved');
        expect(screen.queryByText('Course Description')).not.toBeInTheDocument();
      });
    });

    test('cancel closes the modal without saving', async () => {
      render(<SkillMatrixCreator />);

      await selectCourse('Introduction to Web Development');
      fireEvent.click(screen.getByText('Edit Course Description'));

      await waitFor(() => expect(screen.getByText('Course Description')).toBeInTheDocument());

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Course Description')).not.toBeInTheDocument();
      expect(mockUpdateCourseDescription).not.toHaveBeenCalled();
    });
  });
});
