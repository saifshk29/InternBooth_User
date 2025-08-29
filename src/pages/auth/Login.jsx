import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoPrimary from '../../assets/LogoPrimary.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/home');
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
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
      setError('Failed to sign in with Google.');
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
                Welcome to
                <span className="block">
                  <span className="text-primary">Intern</span>
                  <span className="text-black">Booth</span>
                </span>
              </h1>
              <p className="text-xl text-subtext leading-relaxed">
                Connect with opportunities, build your career, and take the first step towards your dream opportunity.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Personalized internship matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Expert mentorship & guidance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-subtext">Career development resources</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-background to-primary/5">
        <div className="w-full max-w-md">
          {/* Animated form card */}
          <div className="bg-surface rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-700 animate-fade-in-up">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src={LogoPrimary} alt="InternBooth" className="h-12 w-auto" />
            </div>
            
            <div className="text-center mb-8">
              <div className="mb-6">
                <span className="text-subtext">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Sign up
                </Link>
              </div>
              <h2 className="text-4xl font-bold text-text mb-3">Welcome Back</h2>
              <p className="text-subtext text-lg">Please login to your account</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Email address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-gray-50 hover:bg-white"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-offset-2 ${
                  loading ? 'btn-disabled' : 'btn-primary'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Login'
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

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-300 hover:border-gray-300"
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

export default Login; 