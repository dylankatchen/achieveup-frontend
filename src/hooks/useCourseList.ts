import { useCallback, useEffect, useRef, useState } from 'react';
import { canvasAPI } from '../services/api';
import { CanvasCourse } from '../types';

interface UseCourseListOptions {
  // When true (default), fetches on mount. When false, nothing is fetched
  // until ensureLoaded() is called — for callers like a search box that
  // shouldn't hit the API until the user actually interacts with it.
  eager?: boolean;
}

interface UseCourseListResult<T> {
  courses: T[];
  loading: boolean;
  error: boolean;
  reload: () => void;
  // No-op if a load already succeeded or is in flight — safe to call
  // repeatedly (e.g. on every focus event) without refetching each time.
  ensureLoaded: () => void;
}

// Role-aware Canvas course list, shared by every place that needs "the
// courses this user can act on": instructors get only courses they teach
// (enrollment_type=teacher, via getInstructorCourses), everyone else gets
// every active enrollment (getCourses). Keeping this in one place means a
// course search result and a course-scoped page (e.g. the skill matrix
// creator) can never disagree about which courses exist for the user.
export function useCourseList<T extends CanvasCourse = CanvasCourse>(
  isInstructor: boolean,
  options: UseCourseListOptions = {}
): UseCourseListResult<T> {
  const { eager = true } = options;

  const [courses, setCourses] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = isInstructor
        ? await canvasAPI.getInstructorCourses()
        : await canvasAPI.getCourses();
      setCourses(response.data as T[]);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(true);
      hasLoadedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [isInstructor]);

  const ensureLoaded = useCallback(() => {
    if (!hasLoadedRef.current && !loading) load();
  }, [load, loading]);

  useEffect(() => {
    if (eager) load();
    // Only re-run when the role changes or eager mode is toggled — `load`
    // itself is stable per isInstructor value, re-including it here would
    // just be redundant with the isInstructor dependency it already carries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, eager]);

  return { courses, loading, error, reload: load, ensureLoaded };
}
