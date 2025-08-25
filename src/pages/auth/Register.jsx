import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoPrimary from '../../assets/LogoPrimary.png';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, googleSignIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
  

    try {
      setError('');
      setLoading(true);
      
      // Basic user data - more details will be collected in profile setup
      const userData = {
        email,
        createdAt: new Date().toISOString(),
        displayName: email.split('@')[0], // Temporary display name
        profileCompleted: false // Flag to indicate profile needs to be completed
      };
      
      console.log("Selected role:", role);
      
      await signup(email, password, role, userData);
      
      // Always redirect students to profile setup first
      if (role === 'student') {
        navigate('/student/profile'); // Go to student profile setup
      } else {
        navigate('/faculty/profile'); // Go to faculty profile setup
      }
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await googleSignIn();
      navigate('/home');
    } catch (error) {
      setError('Failed to sign up with Google.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Side - Attractive Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background"></div>
        
        {/* Decorative geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-primary/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-primary/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Abstract illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-96 h-96">
            {/* Main circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-sm"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-transparent rounded-full"></div>
            
            {/* Floating elements */}
            <div className="absolute top-8 left-8 w-16 h-16 bg-white/20 rounded-2xl transform rotate-12 animate-bounce" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-primary/30 rounded-xl transform -rotate-12 animate-bounce" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/40 rounded-lg animate-pulse"></div>
            
            {/* Connection lines */}
            <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform rotate-45"></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform -rotate-45"></div>
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full p-16 text-text">
          <div className="max-w-lg space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                Join the
                <span className="block">
                  <span className="text-primary">Intern</span>
                  <span className="text-black">Booth</span>
                </span>
                Community
              </h1>
              <p className="text-xl text-subtext leading-relaxed">
                Create your account and start connecting with organizations, mentors, and opportunities that match your career goals.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Student & Faculty accounts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Comprehensive profile building</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Direct company connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-background to-primary/5">
        <div className="w-full max-w-md">
          {/* Animated form card */}
          <div className="bg-surface rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-700 animate-fade-in-up">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center items-center mb-8">
              <img src={LogoPrimary} alt="InternBooth" className="h-12 w-auto mr-3" />
              <div className="text-xl font-bold">
                <span className="text-primary">Intern</span>
                <span className="text-black">Booth</span>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <div className="mb-6">
                <span className="text-subtext">Already have an account? </span>
                <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
              <h2 className="text-4xl font-bold text-text mb-3">Create Account</h2>
              <p className="text-subtext text-lg">Start your internship journey today</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-text text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-gray-50 hover:bg-white"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-text text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-text text-sm font-medium">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="Confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-text text-sm font-medium">I am a:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2.5 px-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-offset-2 ${
                      role === 'student'
                        ? 'btn-outline-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('faculty')}
                    className={`py-2.5 px-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-offset-2 ${
                      role === 'faculty'
                        ? 'btn-outline-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    👨‍🏫 Faculty
                  </button>
                </div>
                {role === 'faculty' && (
                  <p className="text-xs text-subtext mt-1 text-center">
                    Faculty accounts require admin verification
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-offset-2 ${
                  loading ? 'btn-disabled' : 'btn-success'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface text-subtext">Or continue with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className={`w-full py-3 flex items-center justify-center space-x-3 transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                  loading ? 'btn-disabled' : 'btn-secondary'
                }`}
                disabled={loading}
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="font-medium">Google</span>
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 