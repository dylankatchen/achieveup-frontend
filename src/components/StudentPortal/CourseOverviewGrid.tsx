import React from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';

export interface CourseOverviewSummary {
  id: string;
  name: string;
  code: string;
  averageScore: number | null; // null = no attempted skills yet
  nextHint: string;
}

interface CourseOverviewGridProps {
  courses: CourseOverviewSummary[];
}

const hintIcon = (course: CourseOverviewSummary) => {
  if (course.averageScore === null) return Circle;
  if (course.nextHint === 'On track') return CheckCircle2;
  return AlertTriangle;
};

const CourseOverviewGrid: React.FC<CourseOverviewGridProps> = ({ courses }) => {
  if (courses.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No Canvas courses found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {courses.map((course) => {
        const Icon = hintIcon(course);
        return (
          <div
            key={course.id}
            className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 transition-colors hover:border-au-gold-dark"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-au-gold-light text-au-gold-dark">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-gray-900">{course.name}</div>
                <div className="truncate text-xs text-gray-400">{course.code}</div>
              </div>
              <div className="flex-shrink-0 text-base font-bold text-gray-900">
                {course.averageScore === null ? '—' : `${course.averageScore}%`}
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${course.averageScore === null ? 'bg-gray-200' : 'bg-au-gold'}`}
                style={{ width: `${course.averageScore ?? 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{course.nextHint}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseOverviewGrid;
