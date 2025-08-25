import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/20"></div>
        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-text leading-tight">
              Join the
              <span className="block text-primary">InternBooth</span>
              Community
            </h1>
            <p className="text-lg text-subtext">
              Connect with top companies and discover your perfect internship opportunity.
            </p>
          </div>
          
          {/* Registration journey illustration */}
          <div className="relative w-80 h-64 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-surface rounded-2xl p-6 shadow-xl">
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">1</span>
                    </div>
                    <div className="h-1 bg-primary rounded w-12"></div>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs">2</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs">3</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs text-subtext">Start your journey today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl p-8 shadow-xl border border-gray-100">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center items-center mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">IB</span>
              </div>
              <div className="text-xl font-bold">
                <span className="text-primary">Intern</span>
                <span className="text-black">Booth</span>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="mb-4">
                <span className="text-subtext">Already have an account? </span>
                <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
              <h2 className="text-3xl font-bold text-text mb-2">Create Account</h2>
              <p className="text-subtext">Start your internship journey today</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-text text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50"
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
                
                <div>
                  <label className="block text-text text-sm font-medium mb-1">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50"
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
              
              <div>
                <label className="block text-text text-sm font-medium mb-1">I am a:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2.5 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      role === 'student'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-subtext hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('faculty')}
                    className={`py-2.5 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      role === 'faculty'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-subtext hover:border-gray-300 bg-gray-50'
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
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 transform hover:scale-[1.02]"
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
                  <span className="px-4 bg-surface text-subtext">Or Sign up with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full border border-gray-200 rounded-lg py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                disabled={loading}
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="font-medium text-text">Google</span>
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 