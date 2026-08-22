import React from 'react';
import { X } from 'lucide-react';

interface HowItWorksModalProps {
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Modal Header */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">How AchieveUp Works</h2>

          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}

        <div className="p-6">
          <div className="space-y-8">
            {/* Overview */}

            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">Overview</h3>

              <p className="leading-relaxed text-gray-600">
                AchieveUp transforms traditional assessment into a comprehensive skill tracking
                system. Instead of just seeing grades, you get detailed insights into what
                specific skills each student has mastered and where they need support.
              </p>
            </div>

            {/* Process */}

            <div>
              <h3 className="mb-6 text-lg font-medium text-gray-900">The Process</h3>

              <div className="space-y-6">
                {/* Step 1 */}

                <div className="flex items-start">
                  <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="font-bold text-blue-600">1</span>
                  </div>

                  <div>
                    <h4 className="mb-2 text-md font-medium text-gray-900">
                      Define Skills for Your Course
                    </h4>

                    <p className="mb-3 text-gray-600">
                      Start by creating a Skill Matrix that defines what specific skills
                      students should learn in your course.
                    </p>

                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-800">
                        <strong>AI-Powered:</strong> Our system can automatically suggest
                        relevant skills based on your course name and description, saving you
                        time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}

                <div className="flex items-start">
                  <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <span className="font-bold text-green-600">2</span>
                  </div>

                  <div>
                    <h4 className="mb-2 text-md font-medium text-gray-900">
                      Assign Skills to Quiz Questions
                    </h4>

                    <p className="mb-3 text-gray-600">
                      Next, you map your existing Canvas quiz questions to specific skills.
                    </p>

                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-sm text-green-800">
                        <strong>Smart Assignment:</strong> Our AI analyzes your questions and
                        suggests which skills they're testing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}

                <div className="flex items-start">
                  <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <span className="font-bold text-purple-600">3</span>
                  </div>

                  <div>
                    <h4 className="mb-2 text-md font-medium text-gray-900">
                      Students Take Assessments
                    </h4>

                    <p className="mb-3 text-gray-600">
                      When students complete quizzes in Canvas, AchieveUp automatically analyzes
                      their responses and calculates their mastery level for each skill.
                    </p>

                    <div className="rounded-lg bg-purple-50 p-3">
                      <p className="text-sm text-purple-800">
                        <strong>Automatic Tracking:</strong> Progress updates happen in
                        real-time as students complete assessments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Results */}

            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Understanding Student Progress
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Skill Levels */}

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium text-gray-900">Skill Levels</h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                        Beginner
                      </span>

                      <span className="text-gray-600">0-60% accuracy</span>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Intermediate
                      </span>

                      <span className="text-gray-600">61-80% accuracy</span>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Advanced
                      </span>

                      <span className="text-gray-600">81-100% accuracy</span>
                    </div>
                  </div>
                </div>

                {/* Risk Levels */}

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium text-gray-900">Risk Levels</h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Low Risk
                      </span>

                      <span className="text-gray-600">Performing well overall</span>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Medium Risk
                      </span>

                      <span className="text-gray-600">Some areas need attention</span>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                        High Risk
                      </span>

                      <span className="text-gray-600">Multiple skills need improvement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}

            <div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Benefits for Instructors
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  [
                    'Identify Struggling Students',
                    'See which students need help before it is too late.',
                  ],
                  [
                    'Target Interventions',
                    'Know exactly which skills each student needs to work on.',
                  ],
                  ['Improve Course Design', 'See which skills the class struggles with most.'],
                  [
                    'Evidence-Based Teaching',
                    'Make informed decisions based on concrete skill data.',
                  ],
                ].map(([title, description]) => (
                  <div key={title} className="flex items-start">
                    <div className="mt-2 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-au-gold" />

                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>

                      <p className="text-xs text-gray-600">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started */}

            <div className="rounded-lg bg-au-gold-light p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Ready to Get Started?</h3>

              <p className="mb-4 text-gray-700">
                The best way to understand AchieveUp is to try it! Start by creating a skill
                matrix for one of your courses, then assign skills to a few quiz questions.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/skill-matrix';
                  }}
                  className="rounded-md bg-au-gold px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                >
                  Create Skill Matrix
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/skill-assignment';
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Assign Skills
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
