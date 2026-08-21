import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { canvasAPI } from '../../../services/api';
import { CanvasCourse } from '../../../types';

interface CourseSearchProps {
  variant: 'desktop' | 'mobile';
  displayAsInstructor: boolean;
  onNavigate?: () => void;
}

const CourseSearch: React.FC<CourseSearchProps> = ({ variant, displayAsInstructor, onNavigate }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasFetchedRef = useRef(false);

  const loadCourses = async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoading(true);
    try {
      const response = await canvasAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses for search:', error);
      hasFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const trimmedQuery = query.trim().toLowerCase();
  const results =
    trimmedQuery.length > 0
      ? courses.filter(
          (course) =>
            course.name.toLowerCase().includes(trimmedQuery) ||
            course.code.toLowerCase().includes(trimmedQuery)
        )
      : [];

  const handleSelect = (): void => {
    setQuery('');
    setIsOpen(false);
    navigate(displayAsInstructor ? '/skill-matrix' : '/student-dashboard');
    onNavigate?.();
  };

  const closeDropdown = (): void => setIsOpen(false);

  const isDesktop = variant === 'desktop';

  return (
    <div className={isDesktop ? 'relative w-full max-w-[500px]' : 'relative min-w-0 flex-1'}>
      <Search
        className={
          isDesktop
            ? 'pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400'
            : 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
        }
      />

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          setIsOpen(true);
          loadCourses();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeDropdown();
            event.currentTarget.blur();
          }
        }}
        placeholder="Search courses..."
        className={
          isDesktop
            ? 'h-[42px] w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-au-gold focus:ring-1 focus:ring-au-gold'
            : 'h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-au-gold focus:bg-white focus:ring-1 focus:ring-au-gold'
        }
      />

      {isOpen && trimmedQuery.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeDropdown} />

          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
            {loading ? (
              <p className="px-4 py-3 text-sm text-gray-500">Loading courses…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">No courses found</p>
            ) : (
              results.slice(0, 8).map((course) => (
                <button
                  key={course.id}
                  onClick={handleSelect}
                  className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-900">{course.name}</span>
                  <span className="text-xs text-gray-400">{course.code}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseSearch;
