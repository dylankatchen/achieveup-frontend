import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { BookOpen, Brain, Save, Edit2, Trash2, Plus, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { skillMatrixAPI, canvasAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SkillMatrix } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';

interface SkillMatrixCreatorProps {
  courseId?: string;
  onMatrixCreated?: (matrix: SkillMatrix) => void;
}

interface CanvasCourse {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface SkillSuggestion {
  skill: string;
  relevance: number;
  description: string;
}

const SkillMatrixCreator: React.FC<SkillMatrixCreatorProps> = ({ 
  courseId, 
  onMatrixCreated 
}) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId || '');
  const [selectedCourseData, setSelectedCourseData] = useState<CanvasCourse | null>(null);
  const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestion[]>([]);
  const [finalSkills, setFinalSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [step, setStep] = useState<'select-course' | 'get-suggestions' | 'review-skills'>('select-course');
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState('');
  
  // New state for handling existing matrices
  const [existingMatrices, setExistingMatrices] = useState<SkillMatrix[]>([]);
  const [showExistingMatrices, setShowExistingMatrices] = useState(false);
  const [loadingExistingMatrices, setLoadingExistingMatrices] = useState(false);

  const isInstructor = user?.canvasTokenType === 'instructor';

  // inline edit state
  const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editNewSkill, setEditNewSkill] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);


  const startInlineEdit = (matrix: SkillMatrix) => {
  setEditingMatrixId(matrix._id);
  setEditName(matrix.matrix_name);
  setEditSkills([...matrix.skills]);
  setEditNewSkill('');
};

const cancelInlineEdit = () => {
  setEditingMatrixId(null);
  setEditName('');
  setEditSkills([]);
  setEditNewSkill('');
};

const addEditSkill = () => {
  const s = editNewSkill.trim();
  if (!s) return;

  if (editSkills.includes(s)) {
    toast.error('That skill is already in the list');
    return;
  }

  setEditSkills(prev => [...prev, s]);
  setEditNewSkill('');
};

const removeEditSkill = (idx: number) => {
  setEditSkills(prev => prev.filter((_, i) => i !== idx));
};

const saveInlineEdit = async (matrixId: string) => {
  if (!editName.trim()) {
    toast.error('Matrix name is required');
    return;
  }
  if (editSkills.length === 0) {
    toast.error('Add at least one skill');
    return;
  }

  try {
    setSavingEdit(true);

    // backend expects PUT /achieveup/matrix/<matrix_id> with { skills: [...] }
    // If your backend also supports updating name, include it — otherwise remove matrix_name.
    const payload: any = { skills: editSkills };

    // OPTIONAL: only include this if your backend update route supports it
    payload.matrix_name = editName.trim();

    const res = await skillMatrixAPI.update(matrixId, payload);

    // update the list locally
    setExistingMatrices(prev =>
      prev.map(m => (m._id === matrixId ? { ...m, ...res.data } : m))
    );

    toast.success('Matrix updated');
    cancelInlineEdit();
  } catch (error: any) {
    console.error('Save edit error:', error);
    toast.error(error.response?.data?.message || 'Failed to update matrix');
  } finally {
    setSavingEdit(false);
  }
};


  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<{ matrixName: string; description?: string }>();

  const loadCourses = useCallback(async () => {
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

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(courseId);
    setSelectedCourseData(course || null);
    
    if (course) {
      // Generate initial matrix name that doesn't conflict with existing ones
      const baseName = course.name;
      let initialMatrixName: string;
      
      // We'll check against existing matrices once they're loaded
      // For now, start with the base name
      initialMatrixName = `${baseName} - Skills Matrix`;
      setValue('matrixName', initialMatrixName);
      setStep('get-suggestions');
      // Load existing matrices for this course
      loadExistingMatrices(courseId);
    }
  };

  const loadExistingMatrices = async (courseId: string) => {
    try {
      setLoadingExistingMatrices(true);
      console.log(`Loading existing skill matrices for course: ${courseId}`);
      
      const response = await skillMatrixAPI.getAllByCourse(courseId);
      console.log(`Existing matrices API response for course ${courseId}:`, response.data);
      
      setExistingMatrices(response.data);
      
      // Show existing matrices section if any exist
      if (response.data.length > 0) {
        console.log(`Found ${response.data.length} existing matrices`);
        setShowExistingMatrices(true);
        
        // Auto-adjust matrix name if it conflicts with existing ones
        if (selectedCourseData) {
          const baseName = selectedCourseData.name;
          const existingNames = response.data.map(m => m.matrix_name);
          let newMatrixName: string;
          let counter = 1;
          
          do {
            if (counter === 1) {
              newMatrixName = `${baseName} - Skills Matrix`;
            } else {
              newMatrixName = `${baseName} - Skills Matrix (${counter})`;
            }
            counter++;
          } while (existingNames.includes(newMatrixName) && counter < 50);
          
          console.log(`Auto-generated unique matrix name: ${newMatrixName}`);
          setValue('matrixName', newMatrixName);
        }
      } else {
        console.log(`No existing matrices found for course ${courseId}`);
        setShowExistingMatrices(false);
      }
    } catch (error: any) {
      console.error('Error loading existing matrices:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.response?.config?.url,
        courseId: courseId
      });
      
      // Provide more specific error messages based on status
      if (error.response?.status === 404) {
        console.log(`404 - No existing matrices found for course ${courseId} (this is normal for new courses)`);
        // Don't show error toast for 404 - this is expected for courses without matrices
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your instructor token in Settings.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You may not have permission to view matrices for this course.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error while loading existing matrices. Please try again later.');
      } else {
        console.warn('Failed to load existing matrices:', error.message);
        toast.error(`Failed to load existing matrices: ${error.message}`);
      }
      
      setExistingMatrices([]);
      setShowExistingMatrices(false);
    } finally {
      setLoadingExistingMatrices(false);
    }
  };

  const getSkillSuggestions = async () => {
    if (!selectedCourseData) {
      toast.error('Please select a course first');
      return;
    }

    if (!isInstructor) {
      toast.error('Instructor access required for AI skill suggestions');
      return;
    }

    setSuggestionsLoading(true);
    try {
      // Handle potential missing or differently named courseCode field
      // Backend has now fixed this, but keep fallbacks for robustness
      let courseCode = selectedCourseData.code || 
                      (selectedCourseData as any).course_code || 
                      (selectedCourseData as any).courseCode || 
                      (selectedCourseData as any).sis_course_id ||
                      'UNKNOWN';
      
      // If still no course code, try to extract from course name or use a default
      if (courseCode === 'UNKNOWN' || !courseCode) {
        console.warn('No course code found, attempting to generate one from course name');
        // Try to create a reasonable course code from the course name
        const courseName = selectedCourseData.name || '';
        courseCode = courseName.replace(/\s+/g, '').substring(0, 8).toUpperCase() || 'COURSE';
        console.log('Generated course code:', courseCode);
      }
      
      // Prepare and validate request data
      const requestData = {
        courseId: selectedCourse,
        courseName: selectedCourseData.name,
        courseCode: courseCode,
        courseDescription: selectedCourseData.description || `Course: ${selectedCourseData.name}`
      };

      console.log('Sending skill suggestions request:', requestData);

      // Call backend for AI skill suggestions
      const response = await skillMatrixAPI.getSkillSuggestions(requestData);
      
      console.log('AI skill suggestions response:', response.data);
      
      // Handle different possible response formats with enhanced parsing
      let suggestions: SkillSuggestion[] = [];
      
      if (Array.isArray(response.data)) {
        suggestions = response.data;
      } else if (response.data && Array.isArray((response.data as any).suggestedSkills)) {
        suggestions = (response.data as any).suggestedSkills;
      } else if (response.data && (response.data as any).data && Array.isArray((response.data as any).data)) {
        suggestions = (response.data as any).data;
      }
      
      // Ensure suggestions have the right format
      suggestions = suggestions.map((item: any) => {
        if (typeof item === 'string') {
          return {
            skill: item,
            relevance: 0.8,
            description: `Suggested skill for ${selectedCourseData.name}`
          };
        } else if (item && typeof item === 'object') {
          return {
            skill: item.skill || item.name || 'Unknown Skill',
            relevance: item.relevance || item.confidence || 0.8,
            description: item.description || `Suggested skill for ${selectedCourseData.name}`
          };
        }
        return item;
      }).filter(item => item && item.skill);
      
      // If no suggestions returned, provide course-specific mock suggestions
      if (suggestions.length === 0) {
        console.log('No AI suggestions returned, providing mock suggestions based on course');
        suggestions = generateMockSkillSuggestions(selectedCourseData.name, courseCode);
        toast.success(`Generated ${suggestions.length} skill suggestions for ${selectedCourseData.name} (using intelligent defaults)`);
      } else {
        toast.success(`Got ${suggestions.length} skill suggestions for ${selectedCourseData.name}`);
      }
      
      setSkillSuggestions(suggestions);
      
      // Auto-select all suggestions as starting point
      const suggestedSkills = suggestions.map((s: SkillSuggestion) => s.skill);
      setFinalSkills(suggestedSkills);
      
      setStep('review-skills');
      
    } catch (error: any) {
      console.error('Error getting skill suggestions:', error);
      
      // Provide mock suggestions on any error
      if (selectedCourseData) {
        console.log('API failed, providing mock suggestions based on course');
        const mockSuggestions = generateMockSkillSuggestions(selectedCourseData.name, selectedCourseData.code || 'COURSE');
        setSkillSuggestions(mockSuggestions);
        setFinalSkills(mockSuggestions.map(s => s.skill));
        setStep('review-skills');
        toast.success(`Generated ${mockSuggestions.length} skill suggestions for ${selectedCourseData.name} (backup mode)`);
      } else {
        // Detailed error handling based on status code
        if (error.response?.status === 400) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Bad request format';
          toast.error(`Skill suggestions failed (400): ${errorMsg}. Using backup suggestions.`);
        } else if (error.response?.status === 401) {
          toast.error('Authentication failed. Please check your instructor token in Settings.');
        } else if (error.response?.status === 403) {
          toast.error('Access denied. Instructor permissions required.');
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to get skill suggestions: ${errorMessage}. Using backup suggestions.`);
        }
        
        setStep('review-skills');
      }
      
      // Always provide some suggestions so users can continue when there's an error
      if (!selectedCourseData && (error as any)?.response) {
        const fallbackSuggestions = generateMockSkillSuggestions('Unknown Course', 'FALLBACK');
        setSkillSuggestions(fallbackSuggestions);
        setFinalSkills(fallbackSuggestions.map(s => s.skill));
      }
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Generate intelligent mock skill suggestions based on course name and code
  const generateMockSkillSuggestions = (courseName: string, courseCode: string): SkillSuggestion[] => {
    const name = (courseName || '').toLowerCase();
    const code = (courseCode || '').toLowerCase();
    
    // Course-specific skill mappings
    if (name.includes('web') || name.includes('html') || name.includes('css') || name.includes('javascript') || code.includes('web')) {
      return [
        { skill: 'HTML Fundamentals', relevance: 0.95, description: 'Basic HTML structure and elements' },
        { skill: 'CSS Styling', relevance: 0.90, description: 'Cascading stylesheets and design' },
        { skill: 'JavaScript Programming', relevance: 0.85, description: 'Client-side scripting and DOM manipulation' },
        { skill: 'Responsive Design', relevance: 0.80, description: 'Mobile-first design principles' },
        { skill: 'Web Accessibility', relevance: 0.75, description: 'Creating inclusive web experiences' },
        { skill: 'Version Control (Git)', relevance: 0.70, description: 'Source code management' },
        { skill: 'Browser Developer Tools', relevance: 0.65, description: 'Debugging and optimization' },
        { skill: 'Web Performance', relevance: 0.60, description: 'Optimization and best practices' }
      ];
    }
    
    if (name.includes('data') || name.includes('database') || name.includes('sql') || code.includes('data') || code.includes('db')) {
      return [
        { skill: 'SQL Fundamentals', relevance: 0.95, description: 'Structured query language basics' },
        { skill: 'Database Design', relevance: 0.90, description: 'Relational database modeling' },
        { skill: 'Data Analysis', relevance: 0.85, description: 'Statistical analysis and interpretation' },
        { skill: 'Data Visualization', relevance: 0.80, description: 'Charts, graphs, and dashboards' },
        { skill: 'ETL Processes', relevance: 0.75, description: 'Extract, transform, load operations' },
        { skill: 'Data Cleaning', relevance: 0.70, description: 'Data quality and preprocessing' },
        { skill: 'Database Administration', relevance: 0.65, description: 'Database management and optimization' },
        { skill: 'Business Intelligence', relevance: 0.60, description: 'Strategic data insights' }
      ];
    }
    
    if (name.includes('python') || name.includes('programming') || code.includes('cop') || code.includes('cs') || code.includes('cot')) {
      return [
        { skill: 'Python Syntax', relevance: 0.95, description: 'Basic Python language constructs' },
        { skill: 'Object-Oriented Programming', relevance: 0.90, description: 'Classes, objects, and inheritance' },
        { skill: 'Data Structures', relevance: 0.85, description: 'Lists, dictionaries, sets, and tuples' },
        { skill: 'Algorithm Design', relevance: 0.80, description: 'Problem-solving and efficiency' },
        { skill: 'Error Handling', relevance: 0.75, description: 'Exception handling and debugging' },
        { skill: 'File I/O Operations', relevance: 0.70, description: 'Reading and writing files' },
        { skill: 'Libraries and Modules', relevance: 0.65, description: 'Using external packages' },
        { skill: 'Testing and Debugging', relevance: 0.60, description: 'Unit testing and code quality' }
      ];
    }
    
    if (name.includes('network') || name.includes('security') || name.includes('cyber') || code.includes('cnt') || code.includes('cci')) {
      return [
        { skill: 'Network Protocols', relevance: 0.95, description: 'TCP/IP, HTTP, and network fundamentals' },
        { skill: 'Network Security', relevance: 0.90, description: 'Firewalls, VPNs, and encryption' },
        { skill: 'Network Troubleshooting', relevance: 0.85, description: 'Diagnostic tools and techniques' },
        { skill: 'Network Configuration', relevance: 0.80, description: 'Router and switch setup' },
        { skill: 'Wireless Technologies', relevance: 0.75, description: 'WiFi, Bluetooth, and mobile networks' },
        { skill: 'Network Monitoring', relevance: 0.70, description: 'Performance analysis and optimization' },
        { skill: 'Cloud Networking', relevance: 0.65, description: 'Virtual networks and cloud infrastructure' },
        { skill: 'Network Documentation', relevance: 0.60, description: 'Network mapping and documentation' }
      ];
    }
    
    if (name.includes('business') || name.includes('management') || name.includes('project') || code.includes('man') || code.includes('bus')) {
      return [
        { skill: 'Project Planning', relevance: 0.95, description: 'Scope definition and timeline management' },
        { skill: 'Leadership Skills', relevance: 0.90, description: 'Team management and motivation' },
        { skill: 'Business Analysis', relevance: 0.85, description: 'Requirements gathering and analysis' },
        { skill: 'Communication Skills', relevance: 0.80, description: 'Written and verbal communication' },
        { skill: 'Risk Management', relevance: 0.75, description: 'Identifying and mitigating risks' },
        { skill: 'Stakeholder Management', relevance: 0.70, description: 'Managing relationships and expectations' },
        { skill: 'Budget Management', relevance: 0.65, description: 'Financial planning and control' },
        { skill: 'Quality Assurance', relevance: 0.60, description: 'Process improvement and standards' }
      ];
    }
    
    // Generic academic skills for any course
    return [
      { skill: 'Critical Thinking', relevance: 0.90, description: 'Analytical reasoning and problem solving' },
      { skill: 'Research Skills', relevance: 0.85, description: 'Information gathering and evaluation' },
      { skill: 'Written Communication', relevance: 0.80, description: 'Clear and effective writing' },
      { skill: 'Presentation Skills', relevance: 0.75, description: 'Oral communication and delivery' },
      { skill: 'Time Management', relevance: 0.70, description: 'Planning and organizing tasks' },
      { skill: 'Collaboration', relevance: 0.65, description: 'Working effectively in teams' },
      { skill: 'Information Literacy', relevance: 0.60, description: 'Evaluating and using information sources' },
      { skill: 'Adaptability', relevance: 0.55, description: 'Flexibility and continuous learning' }
    ];
  };

  const toggleSkill = (skill: string) => {
    setFinalSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleDeleteMatrix = async (matrixId: string) => {
  try {
    // optional confirm
    const ok = window.confirm("Delete this skill matrix? This can't be undone.");
    if (!ok) return;

    await skillMatrixAPI.delete(matrixId);

    // remove from UI immediately
    setExistingMatrices((prev) => prev.filter((m) => m._id !== matrixId));

    toast.success("Skill matrix deleted");
  } catch (error: any) {
    console.error("Delete matrix error:", error);
    toast.error(
      error.response?.data?.message || "Failed to delete matrix. Please try again."
    );
  }
};


  const editSkill = (index: number, newValue: string) => {
    if (newValue.trim()) {
      setFinalSkills(prev => 
        prev.map((skill, i) => i === index ? newValue.trim() : skill)
      );
    }
    setEditingSkill(null);
  };

  const removeSkill = (index: number) => {
    setFinalSkills(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomSkill = () => {
    if (newSkill.trim() && !finalSkills.includes(newSkill.trim())) {
      setFinalSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      toast.success(`Added "${newSkill.trim()}" to skills list`);
    } else if (finalSkills.includes(newSkill.trim())) {
      toast.error('This skill is already in the list');
    }
  };

  const onSubmit = async (data: { matrixName: string; description?: string }) => {
    if (finalSkills.length === 0) {
      toast.error('Please add at least one skill to the matrix');
      return;
    }

    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }

    setLoading(true);
    try {
      const matrixData = {
        course_id: selectedCourse,
        matrix_name: data.matrixName,
        skills: finalSkills,
        description: data.description
      };

      // Log the exact request being sent
      console.log('Creating skill matrix with data:', matrixData);

      // Validate request data structure
      if (!matrixData.course_id) {
        throw new Error('Missing course_id in request');
      }
      if (!matrixData.matrix_name || matrixData.matrix_name.trim() === '') {
        throw new Error('Missing or empty matrix_name in request');
      }
      if (!matrixData.skills || matrixData.skills.length === 0) {
        throw new Error('Missing or empty skills array in request');
      }

      const response = await skillMatrixAPI.create(matrixData);
      
      console.log('Skill matrix creation response:', response.data);
      
      onMatrixCreated?.(response.data);
      toast.success('Skill matrix created successfully!');
      
      // Refresh existing matrices list
      loadExistingMatrices(selectedCourse);
      
      // Reset form for creating another matrix
      setStep('get-suggestions');
      setFinalSkills([]);
      setSkillSuggestions([]);
      if (selectedCourseData) {
        // Generate a better auto-incremented name
        const baseName = selectedCourseData.name;
        const existingNames = existingMatrices.map(m => m.matrix_name);
        let newMatrixName: string;
        let counter = 1;
        
        do {
          if (counter === 1) {
            newMatrixName = `${baseName} - Skills Matrix`;
          } else {
            newMatrixName = `${baseName} - Skills Matrix (${counter})`;
          }
          counter++;
        } while (existingNames.includes(newMatrixName) && counter < 50);
        
        setValue('matrixName', newMatrixName);
      }
      setValue('description', '');
    } catch (error: any) {
      console.error('Error creating skill matrix:', error);
      
      // Detailed error handling based on status code
      if (error.response?.status === 409) {
        // Generate a better unique name suggestion
        const baseName = data.matrixName.replace(/\s*\(\d+\/\d+\/\d+\).*$/, ''); // Remove any existing date suffix
        const existingNames = existingMatrices.map(m => m.matrix_name);
        
        let suggestedName: string;
        let counter = 1;
        
        // Try different naming strategies
        do {
          if (counter === 1) {
            // First try: add current date
            suggestedName = `${baseName} (${new Date().toLocaleDateString()})`;
          } else if (counter === 2) {
            // Second try: add timestamp
            suggestedName = `${baseName} (${new Date().toLocaleString()})`;
          } else {
            // Subsequent tries: add incremental number
            suggestedName = `${baseName} (Version ${counter - 1})`;
          }
          counter++;
        } while (existingNames.includes(suggestedName) && counter < 20);
        
        // Fallback: add random suffix if all else fails
        if (existingNames.includes(suggestedName)) {
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          suggestedName = `${baseName} (${randomSuffix})`;
        }
        
        toast.error(
          <div>
            <p><strong>Matrix name already exists!</strong></p>
            <p className="text-sm mt-1">A skill matrix with the name "{data.matrixName}" already exists for this course.</p>
            <p className="text-sm mt-1">Suggestion: Try "{suggestedName}" or choose a different name.</p>
            {existingMatrices.length === 0 && (
              <p className="text-xs text-gray-600 mt-2 bg-yellow-50 p-2 rounded">
                ⚠️ <strong>Backend Issue:</strong> The frontend cannot see existing matrices because 
                GET /achieveup/matrix/course/{selectedCourse} returns 404. The backend team needs to implement this endpoint.
              </p>
            )}
          </div>,
          { duration: 8000 }
        );
        
        console.error('409 Conflict details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          existingMatrices: existingNames,
          suggestedName,
          config: {
            url: error.response.config?.url,
            method: error.response.config?.method,
            data: error.response.config?.data
          },
          possibleCauses: [
            'A skill matrix with this name already exists for this course',
            'Duplicate course_id + matrix_name combination',
            'Backend validation rules preventing duplicate entries'
          ],
          debugInfo: {
            frontendKnowsAbout: existingNames.length,
            frontendMatrices: existingNames,
            backendRejectsName: data.matrixName,
            courseId: selectedCourse,
            missingEndpoint: existingNames.length === 0 ? 'GET /achieveup/matrix/course/{courseId} likely returns 404' : 'Endpoint working'
          }
        });
        
        // Update the form with suggested name
        setValue('matrixName', suggestedName);
        
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Bad request format';
        toast.error(`Skill matrix creation failed (400): ${errorMsg}. Check console for request details.`);
        console.error('400 Error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          config: {
            url: error.response.config?.url,
            method: error.response.config?.method,
            data: error.response.config?.data
          }
        });
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your instructor token in Settings.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Instructor permissions required.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to create skill matrix: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state for initial course load
  if (loading && courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card
        title="Skill Matrix Creator"
        subtitle="Select a course and get AI-powered skill suggestions, then customize as needed"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Course Selection */}
          {step === 'select-course' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Course</h3>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h4>
                  <p className="text-gray-600 mb-4">
                    Make sure your Canvas instructor token is set up correctly.
                  </p>
                  <a
                    href="/settings"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ucf-gold hover:bg-yellow-600"
                  >
                    Configure Canvas Token
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseSelect(course.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-ucf-gold hover:bg-ucf-gold hover:bg-opacity-5 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.code}</p>
                      {course.description && (
                        <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Existing Matrices Section */}
          {showExistingMatrices && selectedCourseData && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-blue-900">
                  Existing Skill Matrices for {selectedCourseData.name}
                </h4>
                <button
                  onClick={() => setShowExistingMatrices(!showExistingMatrices)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showExistingMatrices ? 'Hide' : 'Show'} ({existingMatrices.length})
                </button>
              </div>
              
              {loadingExistingMatrices ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : existingMatrices.length > 0 ? (
                <div className="space-y-3">
                  {existingMatrices.map((matrix) => {
                    const isEditingThis = editingMatrixId === matrix._id;

                    return (
                      <div
                        key={matrix._id}
                        className="bg-white rounded-lg p-4 border border-blue-200 relative"
                      >
                        {!isEditingThis ? (
                          // ===================== VIEW MODE =====================
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{matrix.matrix_name}</h5>
                              <p className="text-sm text-gray-600 mt-1">
                                {matrix.skills.length} skills • Created{' '}
                                {new Date(matrix.created_at).toLocaleDateString()}
                              </p>

                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {matrix.skills.slice(0, 5).map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {matrix.skills.length > 5 && (
                                    <span className="text-xs text-gray-500">
                                      +{matrix.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="ml-4 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFinalSkills([...matrix.skills]);
                                  setValue('matrixName', `${matrix.matrix_name} (Copy)`);
                                  setStep('review-skills');
                                  toast.success(
                                    'Matrix skills loaded for reference. You can modify and create a new matrix.'
                                  );
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Use as Template
                              </button>

                              {/* bottom-right actions */}
                              <div className="absolute bottom-3 right-4 flex space-x-3">
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(matrix)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMatrix(matrix._id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // ===================== EDIT MODE (INLINE) =====================
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">Editing Matrix</h5>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={cancelInlineEdit}
                                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingEdit}
                                  onClick={() => saveInlineEdit(matrix._id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                                >
                                  {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>

                            {/* name */}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Matrix Name</label>
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>

                            {/* skills chips */}
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Skills</label>
                              <div className="flex flex-wrap gap-2">
                                {editSkills.map((skill, i) => (
                                  <span
                                    key={`${skill}-${i}`}
                                    className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeEditSkill(i)}
                                      className="text-blue-900 hover:text-blue-950"
                                      title="Remove"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>

                              {/* add new skill */}
                              <div className="flex gap-2 mt-3">
                                <input
                                  value={editNewSkill}
                                  onChange={(e) => setEditNewSkill(e.target.value)}
                                  placeholder="Add a skill..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addEditSkill();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={addEditSkill}
                                  disabled={!editNewSkill.trim()}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-blue-700 text-sm">No existing matrices found for this course.</p>
              )}

              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Multiple matrices per course:</strong> You can create multiple skill matrices for the same course 
                  with different focuses (e.g., "Midterm Skills", "Final Project Skills", "Lab Skills").
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Get Skill Suggestions */}
          {step === 'get-suggestions' && selectedCourseData && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Step 2: Get Skill Suggestions
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Selected Course</h4>
                <p className="text-blue-800">{selectedCourseData.name}</p>
                <p className="text-sm text-blue-600">{selectedCourseData.code}</p>
                {selectedCourseData.description && (
                  <p className="text-xs text-blue-600 mt-2">{selectedCourseData.description}</p>
                )}
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Our AI will analyze "{selectedCourseData.name}" and suggest relevant skills 
                  that students should develop in this course.
                </p>
                
                {isInstructor ? (
                  <Button
                    type="button"
                    onClick={getSkillSuggestions}
                    loading={suggestionsLoading}
                    disabled={suggestionsLoading}
                    className="flex items-center"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {suggestionsLoading ? 'Getting Skill Suggestions...' : 'Get AI Skill Suggestions'}
                  </Button>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        <strong>Instructor access required</strong> for AI skill suggestions.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSkillSuggestions([]);
                      setFinalSkills([]);
                      setStep('review-skills');
                    }}
                  >
                    Skip and Add Skills Manually
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review and Edit Skills */}
          {step === 'review-skills' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-green-600" />
                Step 3: Review and Customize Skills
              </h3>

              {/* Matrix Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matrix Name
                </label>
                <input
                  {...register('matrixName', { required: 'Matrix name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                  placeholder="e.g., Web Development - Skills Matrix"
                />
                {errors.matrixName && (
                  <p className="text-red-600 text-sm mt-1">{errors.matrixName.message}</p>
                )}
              </div>

              {/* Matrix Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                  placeholder="Describe what skills this matrix covers..."
                />
              </div>

              {/* AI Suggested Skills */}
              {skillSuggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                    AI Suggested Skills ({skillSuggestions.length} skills)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skillSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => toggleSkill(suggestion.skill)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          finalSkills.includes(suggestion.skill)
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{suggestion.skill}</span>
                          <CheckCircle className={`w-4 h-4 ${
                            finalSkills.includes(suggestion.skill)
                              ? 'text-green-600'
                              : 'text-gray-300'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full"
                              style={{ width: `${suggestion.relevance * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Relevance: {Math.round(suggestion.relevance * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No AI Suggestions Message */}
              {step === 'review-skills' && skillSuggestions.length === 0 && isInstructor && (
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">No AI Suggestions Available</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          The AI service didn't return any skill suggestions. This appears to be a backend issue. 
                          You can add skills manually using the input below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Skills List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Skills List ({finalSkills.length} skills)
                </h4>
                
                {finalSkills.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No skills added yet. Add skills below.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {finalSkills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {editingSkill === index ? (
                          <input
                            type="text"
                            defaultValue={skill}
                            autoFocus
                            onBlur={(e) => editSkill(index, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                editSkill(index, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <span 
                            className="flex-1 cursor-pointer hover:text-blue-600"
                            onClick={() => setEditingSkill(index)}
                          >
                            {skill}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingSkill(index)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit skill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Skill */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add custom skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addCustomSkill}
                    disabled={!newSkill.trim()}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('get-suggestions')}
                >
                  Back
                </Button>
                
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || finalSkills.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Skill Matrix
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default SkillMatrixCreator;