import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import FacultyHome from './pages/faculty/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentProfile from './pages/student/Profile';
import StudentDashboard from './pages/student/Dashboard';
import StudentApplications from './pages/student/Applications';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyProfile from './pages/faculty/Profile';
import InternshipDetails from './pages/internships/InternshipDetails';
import QuizPage from './pages/internships/QuizPage';
import ApplicationForm from './pages/internships/ApplicationForm';
import Round1Form from './pages/internships/Round1Form';
import Round2Form from './pages/internships/Round2Form';
import NotFound from './pages/NotFound';
import About from './pages/About';
import InternshipDetailsFaculty from './pages/faculty/InternshipDetailsFaculty';
import EditInternship from './pages/faculty/EditInternship';
import ViewApplications from './pages/faculty/ViewApplications';
import EvaluateQuizSubmissions from './pages/faculty/EvaluateQuizSubmissions';
import AllStudents from './pages/faculty/AllStudents';

import { useState, useEffect } from 'react';

// Root Redirect Component
function RootRedirect() {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return userRole === 'faculty' ? (
    <Navigate to="/faculty/home" replace />
  ) : (
    <Navigate to="/home" replace />
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles, requireProfileCompletion = true }) {
  const { currentUser, userRole, getUserData } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkProfileCompletion() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserData(currentUser.uid);
        console.log('Protected Route - User Data:', userData);
        console.log('Protected Route - User Role:', userRole);
        console.log('Protected Route - Allowed Roles:', allowedRoles);
        
        // Check profile completion based on role
        if (userRole === 'faculty') {
          // Faculty profile is complete if required fields are present
          const requiredFields = ['firstName', 'lastName', 'department', 'designation'];
          const isProfileComplete = requiredFields.every(field => userData?.[field]);
          setIsProfileComplete(isProfileComplete);
        } else {
          // For students, check if profile is marked as completed
          setIsProfileComplete(userData && userData.profileCompleted === true);
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
      } finally {
        setLoading(false);
      }
    }

    checkProfileCompletion();
  }, [currentUser, getUserData, userRole]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role access if roles are specified
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log('Access denied - incorrect role');
    // Redirect faculty to their dashboard if they try to access student routes
    if (userRole === 'faculty') {
      return <Navigate to="/faculty/dashboard" replace />;
    }
    // Redirect students to their dashboard if they try to access faculty routes
    if (userRole === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  // If profile completion is required but profile is not complete, redirect to profile page
  if (requireProfileCompletion && !isProfileComplete && userRole === 'student') {
    return <Navigate to="/student/profile" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen w-full bg-background">
          <Navbar />
          <main className="flex-grow w-full flex flex-col ">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              
              {/* Root path - redirect based on auth state */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Student Routes */}
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Home />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/student/profile" 
                element={
                  <ProtectedRoute allowedRoles={['student']} requireProfileCompletion={false}>
                    <StudentProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/student/applications" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentApplications />
                  </ProtectedRoute>
                } 
              />
              
              {/* Faculty Routes */}
              <Route 
                path="/faculty/home" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <FacultyHome />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/view-applications/:internshipId" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <ViewApplications />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/evaluate-quiz-submissions/:internshipId" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <EvaluateQuizSubmissions />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/profile" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <FacultyProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/internships/:id" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <InternshipDetailsFaculty />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/faculty/internships/:id/edit" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <EditInternship />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/faculty/all-students" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']} requireProfileCompletion={false}>
                    <AllStudents />
                  </ProtectedRoute>
                } 
              />
              
              {/* Shared Routes */}
              <Route 
                path="/internships/:id" 
                element={
                  <ProtectedRoute>
                    <InternshipDetails />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/internships/:id/apply" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ApplicationForm />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/internships/:id/quiz" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <QuizPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/student/quiz/:applicationId" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <QuizPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/student/applications/:applicationId/resume-quiz" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <QuizPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/internships/round1-form/:id" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Round1Form />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/internships/round2-form/:id" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Round2Form />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
