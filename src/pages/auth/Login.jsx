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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/20"></div>
        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-text leading-tight">
              Simplify
              <span className="block text-primary">management with</span>
              our platform.
            </h1>
            <p className="text-lg text-subtext">
              Streamline your internship management with our user-friendly admin dashboard.
            </p>
          </div>
          
          {/* Illustration placeholder */}
          <div className="relative w-80 h-64 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-surface rounded-2xl p-6 shadow-xl">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl">🎓</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-subtext">Connect students with opportunities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl p-8 shadow-xl border border-gray-100">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">IB</span>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="mb-4">
                <span className="text-subtext">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Signup
                </Link>
              </div>
              <h2 className="text-3xl font-bold text-text mb-2">Welcome Back</h2>
              <p className="text-subtext">Please login to your account</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Email address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50"
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
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 transform hover:scale-[1.02]"
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
                  <span className="px-4 bg-surface text-subtext">Or Login with</span>
                </div>
              </div>

              {/* Google Sign In */}
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

export default Login; 