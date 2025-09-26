# AchieveUp - AI-Powered Skill Tracking System
testing this branch
## 🎯 Vision & Overview

AchieveUp transforms traditional assessment into comprehensive skill tracking. Instead of just seeing grades, instructors get detailed insights into what specific skills each student has mastered and where they need support.

### Core Philosophy
- **Skills Over Scores**: Move beyond simple grades to track specific skill development
- **AI-Enhanced Teaching**: Use artificial intelligence to identify and map skills to assessments
- **Real-Time Insights**: Provide instructors with immediate feedback on student progress
- **Personalized Learning**: Enable targeted interventions based on skill gaps
- **Evidence-Based Education**: Create verifiable skill credentials for students

## 🏗️ Current Architecture

### Frontend (React + TypeScript)
- **Status**: ✅ Production Ready
- **URL**: https://achieveup-frontend.netlify.app
- **Tech Stack**: React 18, TypeScript, Tailwind CSS, React Hook Form, Axios
- **Deployment**: Netlify (automatic from GitHub)

### Backend (Node.js + Express)
- **Status**: ✅ Production Ready
- **URL**: https://gen-ai-prime-3ddeabb35bd7.herokuapp.com
- **Tech Stack**: Node.js, Express, MongoDB, JWT, Canvas API integration
- **Deployment**: Heroku

## 🚀 Current Features

### ✅ Implemented & Working

#### Authentication System
- Instructor-only authentication with Canvas token validation
- Optional Canvas token during signup (can be added later)
- Flexible role validation for users without Canvas tokens
- Secure JWT-based authentication

#### Instructor Dashboard
- Course overview with Canvas integration
- Student count with deterministic calculations
- Skill matrix management
- Recent activity tracking
- Workflow progress indicators

#### Skill Matrix Creation
- AI-powered skill suggestions based on course content
- Manual skill customization and editing
- Course-specific skill matrices
- Template-based skill generation

#### Skill Assignment Interface
- Canvas quiz and question integration
- AI-powered question analysis and skill mapping
- Bulk assignment operations
- Manual skill assignment with drag-and-drop
- Question complexity analysis

#### Student Progress Tracking
- Individual student skill breakdown
- Top 3 skills per student display
- Risk level assessment (low/medium/high)
- Detailed skill analytics with modal views
- Progress visualization and reporting

#### Settings & Configuration
- Canvas API token management
- Profile management
- Connection testing and validation
- Clear guidance for Canvas integration

## 🎯 Student View (Planned)

### Student Dashboard Features Needed
- **Individual Progress View**: Students see their own skill mastery levels
- **Skill Breakdown**: Detailed view of all skills with progress percentages
- **Achievement Badges**: Visual badges for skill milestones
- **Learning Path**: Recommended next steps for skill improvement
- **Assessment History**: Timeline of completed assessments and results

## 🏆 Badge System (Stretch Goal)

### Badge System Overview
The badge system provides gamified recognition for student skill achievements, increasing engagement and motivation while providing verifiable skill credentials.

### Badge Types & Categories
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'skill' | 'milestone' | 'achievement' | 'special';
  icon: string;
  criteria: BadgeCriteria;
  earned: boolean;
  earnedAt?: string;
  progress: number; // 0-100 progress towards earning
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number; // XP/points awarded
}

interface BadgeCriteria {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  minimumScore: number; // e.g., 80% for advanced badge
  questionsRequired: number; // minimum questions attempted
  timeFrame?: 'week' | 'month' | 'semester';
  consecutiveSuccess?: number; // streak requirements
}
```

### Badge Categories

#### 1. Skill-Specific Badges
- **Beginner Badges**: Awarded for 60%+ mastery in a skill
- **Intermediate Badges**: Awarded for 80%+ mastery in a skill
- **Advanced Badges**: Awarded for 90%+ mastery in a skill
- **Expert Badges**: Awarded for 95%+ mastery with high question volume

#### 2. Milestone Badges
- **First Skill Mastered**: First skill reaching intermediate level
- **Skill Explorer**: Mastered 5 different skills
- **Skill Specialist**: Mastered 10 different skills
- **Skill Master**: Mastered all skills in a course
- **Perfect Score**: 100% on any skill assessment

#### 3. Achievement Badges
- **Consistent Learner**: Maintained intermediate+ level for 4 weeks
- **Rapid Progress**: Improved from beginner to advanced in 2 weeks
- **Streak Master**: 5 consecutive perfect scores
- **Course Champion**: Top performer in a course
- **Early Bird**: Completed first assessment within 24 hours

#### 4. Special Badges
- **Instructor Recognition**: Custom badges awarded by instructors
- **Peer Nominated**: Badges awarded by fellow students
- **Challenge Winner**: Special competition badges
- **Innovation Badge**: Creative problem-solving recognition

### Badge System Features

#### Visual Design
- **Custom Icons**: Unique SVG icons for each badge type
- **Animated Unlocks**: Celebration animations when badges are earned
- **Progress Indicators**: Visual progress bars towards badge completion
- **Badge Collections**: Organized display of earned and available badges

#### Badge Display
```typescript
interface BadgeDisplay {
  // Student Dashboard Badge Showcase
  recentBadges: Badge[];
  totalBadges: number;
  totalPoints: number;
  level: number; // Student level based on total points
  
  // Badge Collection View
  earnedBadges: Badge[];
  availableBadges: Badge[];
  progressTowardsBadges: Badge[];
  
  // Badge Details Modal
  badgeDetails: {
    criteria: BadgeCriteria;
    progress: number;
    timeToEarn?: string;
    tips: string[];
  };
}
```

#### Badge Earning Logic
```typescript
interface BadgeEarningSystem {
  // Automatic Badge Detection
  checkSkillBadges(studentId: string, skillName: string, score: number): Badge[];
  
  // Milestone Tracking
  checkMilestoneBadges(studentId: string): Badge[];
  
  // Achievement Monitoring
  checkAchievementBadges(studentId: string): Badge[];
  
  // Progress Calculation
  calculateBadgeProgress(badge: Badge, studentData: StudentProgress): number;
}
```

### Badge System Implementation

#### Backend Requirements
```typescript
// Badge Management Endpoints
POST /achieveup/badges/generate/{studentId}     // Generate badges for student
GET /achieveup/badges/{studentId}               // Get student's badges
POST /achieveup/badges/award/{badgeId}          // Award custom badge
GET /achieveup/badges/available/{courseId}      // Get available badges for course
PUT /achieveup/badges/progress/{badgeId}        // Update badge progress

// Badge Templates
GET /achieveup/badges/templates                  // Get badge templates
POST /achieveup/badges/templates                 // Create custom badge template
PUT /achieveup/badges/templates/{templateId}     // Update badge template
DELETE /achieveup/badges/templates/{templateId}  // Delete badge template
```

#### Database Schema
```sql
-- Badge templates table
CREATE TABLE badge_templates (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  skill_name VARCHAR,
  level ENUM('beginner', 'intermediate', 'advanced'),
  category ENUM('skill', 'milestone', 'achievement', 'special'),
  icon_url VARCHAR,
  criteria JSONB,
  rarity ENUM('common', 'rare', 'epic', 'legendary'),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student badges table
CREATE TABLE student_badges (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES student_users(id),
  badge_template_id UUID REFERENCES badge_templates(id),
  earned BOOLEAN DEFAULT FALSE,
  earned_at TIMESTAMP,
  progress DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Badge progress tracking
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES student_users(id),
  badge_template_id UUID REFERENCES badge_templates(id),
  current_progress DECIMAL(5,2),
  criteria_met JSONB,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### Badge System UI Components

#### Student Badge Dashboard
```typescript
interface BadgeDashboard {
  // Recent Achievements
  recentBadges: Badge[];
  
  // Progress Overview
  totalBadges: number;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  
  // Badge Categories
  skillBadges: Badge[];
  milestoneBadges: Badge[];
  achievementBadges: Badge[];
  specialBadges: Badge[];
  
  // Progress Tracking
  badgesInProgress: Badge[];
  upcomingBadges: Badge[];
}
```

#### Badge Collection View
- **Grid Layout**: Visual badge collection with hover effects
- **Filter Options**: Filter by category, rarity, earned status
- **Search Functionality**: Search badges by name or skill
- **Sort Options**: Sort by date earned, rarity, points value
- **Badge Details**: Click to view detailed badge information

#### Badge Earning Notifications
- **Toast Notifications**: Immediate feedback when badges are earned
- **Modal Celebrations**: Detailed celebration modal with badge details
- **Email Notifications**: Optional email notifications for badge achievements
- **Social Sharing**: Share badge achievements on social media

### Badge System Benefits

#### For Students
- **Increased Motivation**: Gamified learning experience
- **Clear Goals**: Visual progress towards skill mastery
- **Recognition**: Tangible recognition of achievements
- **Portfolio Building**: Verifiable skill credentials
- **Competition**: Friendly competition with peers

#### For Instructors
- **Engagement Tracking**: Monitor student engagement through badge activity
- **Motivation Tool**: Use badges to encourage participation
- **Recognition System**: Custom badges for special achievements
- **Progress Visualization**: Visual representation of student progress
- **Retention Tool**: Increase course completion rates

#### For Institutions
- **Skill Verification**: Verifiable skill credentials for employers
- **Student Success**: Increased student engagement and retention
- **Competitive Advantage**: Modern, gamified learning platform
- **Data Insights**: Detailed analytics on skill development patterns

### Badge System Roadmap

#### Phase 1: Core Badge System (Week 9-10)
- [ ] Implement basic badge templates
- [ ] Create badge earning logic
- [ ] Build badge display components
- [ ] Add automatic badge detection

#### Phase 2: Advanced Features (Week 11-12)
- [ ] Custom badge creation for instructors
- [ ] Badge progress tracking
- [ ] Notification system
- [ ] Badge sharing functionality

#### Phase 3: Gamification (Week 13-14)
- [ ] Student levels and points system
- [ ] Leaderboards and competitions
- [ ] Social features and peer recognition
- [ ] Advanced badge categories

#### Phase 4: Analytics & Polish (Week 15-16)
- [ ] Badge analytics dashboard
- [ ] Performance optimization
- [ ] Mobile badge experience
- [ ] Final testing and deployment

### Student Authentication
- **Canvas Student Integration**: Use Canvas student tokens
- **Student Role Validation**: Separate authentication for students
- **Course Enrollment**: Access only enrolled courses
- **Privacy Controls**: Students see only their own data

### Student Interface Components Needed
```typescript
// Student Dashboard Component
interface StudentDashboard {
  enrolledCourses: Course[];
  skillProgress: SkillProgress[];
  achievements: Badge[];
  learningRecommendations: string[];
}

// Student Progress View
interface StudentProgressView {
  courseId: string;
  skillBreakdown: SkillBreakdown[];
  assessmentHistory: Assessment[];
  improvementSuggestions: string[];
}
```

## 🔧 Backend Requirements for Student View

### New Endpoints Needed
```typescript
// Student Authentication
POST /auth/student/login
POST /auth/student/signup
GET /auth/student/me

// Student Data
GET /achieveup/student/{studentId}/courses
GET /achieveup/student/{studentId}/progress/{courseId}
GET /achieveup/student/{studentId}/achievements
GET /achieveup/student/{studentId}/recommendations

// Canvas Student Integration
GET /canvas/student/courses
GET /canvas/student/assessments/{courseId}
```

### Database Schema Updates
```sql
-- Student users table
CREATE TABLE student_users (
  id UUID PRIMARY KEY,
  canvas_student_id VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  canvas_token VARCHAR ENCRYPTED,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student progress tracking
CREATE TABLE student_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES student_users(id),
  course_id VARCHAR NOT NULL,
  skill_name VARCHAR NOT NULL,
  mastery_level ENUM('beginner', 'intermediate', 'advanced'),
  score DECIMAL(5,2),
  questions_attempted INTEGER,
  questions_correct INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## 🎨 UI/UX Requirements for Student View

### Student Dashboard Design
- **Clean, Student-Friendly Interface**: Less technical than instructor view
- **Progress Visualization**: Charts and graphs showing skill development
- **Achievement Showcase**: Prominent display of earned badges
- **Mobile Responsive**: Optimized for student device usage
- **Accessibility**: WCAG compliant for all students

### Key Student Pages Needed
1. **Student Dashboard**: Overview of all courses and progress
2. **Course Progress**: Detailed view of skills for specific course
3. **Achievements**: Badge collection and milestone tracking
4. **Learning Path**: Recommended next steps and resources
5. **Assessment History**: Timeline of completed work

## 🔄 Workflow Integration

### Current Instructor Workflow
1. **Create Skill Matrix** → Define skills for course
2. **Assign Skills to Questions** → Map quiz questions to skills
3. **Students Complete Assessments** → Automatic progress tracking
4. **Monitor Progress** → View student skill development

### Planned Student Workflow
1. **Student Login** → Canvas student authentication
2. **View Progress** → See skill mastery levels
3. **Complete Assessments** → Normal Canvas quiz taking
4. **Track Growth** → Monitor skill development over time
5. **Earn Badges** → Achieve skill milestones

## 🧪 Testing Requirements

### Frontend Testing
- **Unit Tests**: All React components and hooks
- **Integration Tests**: Authentication and API integration
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: WCAG compliance verification

### Backend Testing
- **API Tests**: All endpoints and error handling
- **Canvas Integration Tests**: Token validation and data retrieval
- **AI Service Tests**: Skill suggestion and analysis accuracy
- **Performance Tests**: Load testing for multiple users

## 🚀 Deployment & Infrastructure

### Current Setup
- **Frontend**: Netlify (automatic deployment)
- **Backend**: Heroku (production ready)
- **Database**: MongoDB Atlas
- **CDN**: Netlify CDN for static assets

### Production Checklist
- [x] Frontend deployed and working
- [x] Backend deployed and working
- [x] Canvas integration functional
- [x] Authentication system complete
- [x] Basic instructor features working

### Remaining Infrastructure
- [ ] Student authentication system
- [ ] Student database schema
- [ ] Student API endpoints
- [ ] Student frontend components
- [ ] Badge system database schema
- [ ] Badge earning logic and API
- [ ] Badge UI components and animations
- [ ] Mobile optimization
- [ ] Performance monitoring
- [ ] Error tracking and logging

## 📊 Analytics & Reporting

### Current Analytics
- **Instructor Analytics**: Course-wide student performance
- **Individual Student Views**: Detailed skill breakdowns
- **Progress Tracking**: Real-time skill development
- **Risk Assessment**: Student performance indicators

### Planned Analytics
- **Student Self-Analytics**: Individual progress insights
- **Learning Analytics**: Study pattern analysis
- **Predictive Analytics**: Skill mastery predictions
- **Comparative Analytics**: Class performance benchmarks

## 🔐 Security & Privacy

### Current Security
- **JWT Authentication**: Secure token-based auth
- **Canvas Token Encryption**: Encrypted storage of API tokens
- **Role-Based Access**: Instructor-only current access
- **HTTPS**: All communications encrypted

### Security Requirements for Student View
- **Student Data Privacy**: Students see only their own data
- **FERPA Compliance**: Educational data protection
- **Canvas Integration Security**: Secure student token handling
- **Data Encryption**: All sensitive data encrypted at rest

## 🎯 Next Steps & Roadmap

### Phase 1: Student Authentication (Week 1-2)
- [ ] Implement student authentication endpoints
- [ ] Create student user database schema
- [ ] Build student login/signup pages
- [ ] Test Canvas student token integration

### Phase 2: Student Dashboard (Week 3-4)
- [ ] Create student dashboard component
- [ ] Implement course enrollment display
- [ ] Build progress visualization components
- [ ] Add basic achievement tracking

### Phase 3: Student Progress Views (Week 5-6)
- [ ] Individual course progress pages
- [ ] Skill breakdown visualizations
- [ ] Assessment history timeline
- [ ] Learning recommendations

### Phase 4: Mobile & Polish (Week 7-8)
- [ ] Mobile-responsive design
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Final testing and deployment

### Phase 5: Badge System Core (Week 9-10)
- [ ] Implement basic badge templates
- [ ] Create badge earning logic
- [ ] Build badge display components
- [ ] Add automatic badge detection

### Phase 6: Badge System Advanced (Week 11-12)
- [ ] Custom badge creation for instructors
- [ ] Badge progress tracking
- [ ] Notification system
- [ ] Badge sharing functionality

### Phase 7: Gamification Features (Week 13-14)
- [ ] Student levels and points system
- [ ] Leaderboards and competitions
- [ ] Social features and peer recognition
- [ ] Advanced badge categories

### Phase 8: Analytics & Final Polish (Week 15-16)
- [ ] Badge analytics dashboard
- [ ] Performance optimization
- [ ] Mobile badge experience
- [ ] Final testing and deployment

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Frontend Setup
```bash
git clone https://github.com/nsanchez9009/achieveup-frontend.git
cd achieveup-frontend
npm install
npm start
```

### Environment Variables
```env
REACT_APP_API_URL=https://gen-ai-prime-3ddeabb35bd7.herokuapp.com
REACT_APP_ENVIRONMENT=development
```

### Backend Setup
```bash
git clone https://github.com/AndresQ9/knowgap-backend.git
cd knowgap-backend
npm install
npm start
```

## 📞 Support & Contact

### Repository Links
- **Frontend**: https://github.com/nsanchez9009/achieveup-frontend
- **Backend**: https://github.com/AndresQ9/knowgap-backend
- **Live Demo**: https://achieveup-frontend.netlify.app

### Development Team
- **Frontend Developer**: Nico Sanchez
- **Backend Developer**: Andres Q
- **Project Lead**: UCF Senior Design Team

## 📝 License

This project is part of the UCF Senior Design program. All rights reserved.

---

**AchieveUp** - Transforming Assessment into Skill Tracking 🎯 
