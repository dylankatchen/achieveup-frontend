import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/* 
This component is used as part of the authentication / routing system. 
It checks if the user is authenticated and has the required role(s) to access a specific route.
*/

function RequireRole({ roles }: { roles?: Array<'student' | 'instructor'> }) {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user!.role) {
    logout();
    return <Navigate to="/login" replace />;
  }

  // An instructor whose Canvas token also validates as a student enrollment
  // (has_student_access) is allowed into student-only routes too, so the
  // dual-role "view as student" toggle actually has somewhere to go.
  const hasRequiredRole =
    !roles ||
    roles.some((r) => r === user!.role) ||
    (roles.includes('student') && user!.role === 'instructor' && !!user!.has_student_access);

  if (!hasRequiredRole) {
    return (
      <Navigate
        to={user!.role === 'instructor' ? '/instructor-dashboard' : '/student-dashboard'}
        replace
      />
    );
  }
  return <Outlet />;
}

export default RequireRole;
