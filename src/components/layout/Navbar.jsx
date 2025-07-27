import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoPrimary from '../../assets/LogoPrimary.png';
import LogoDark from '../../assets/LogoDark.png';
import { Bell } from 'lucide-react';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout, getUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);

  // Check if we're on an auth page (login or register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Function to check if a link is active
  const isActive = (path) => {
    if (path === '/home' && (location.pathname === '/home' || location.pathname === '/')) {
      return true;
    }
    if (path === '/faculty/home' && (location.pathname === '/faculty/home' || location.pathname === '/')) {
      return true;
    }
    return location.pathname === path;
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const data = await getUserData(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser, getUserData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav id="navbar" className="bg-white shadow-sm">
      <div className="max-w-[1280px] mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-[200px_1fr_200px] items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={LogoDark} alt="BridgeIntern" className="h-12 w-10" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center justify-center gap-8">
              {!currentUser ? (
                <>
                  <Link to="/about">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/about') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>About Us</span>
                  </Link>
                </>
              ) : userData?.role === 'faculty' ? (
                <>
                  <Link to="/faculty/home">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/faculty/home') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Home</span>
                  </Link>
                  <Link to="/faculty/dashboard">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/faculty/dashboard') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Dashboard</span>
                  </Link>
                  <Link to="/about">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/about') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>AboutUS</span>
                  </Link>
                  <Link to="/faculty/profile">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/faculty/profile') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Profile</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/home">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/home') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Home</span>
                  </Link>
                  <Link to="/student/dashboard">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/student/dashboard') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Dashboard</span>
                  </Link>
                  <Link to="/courses">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/courses') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>Courses</span>
                  </Link>
                  <Link to="/about">
                    <span className={`font-medium transition-colors text-[18px] ${isActive('/about') ? 'text-primary' : 'text-text-primary hover:text-primary'}`}>AboutUS</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User Section - Only show if logged in */}
          {currentUser && !isAuthPage && (
            <div className="hidden md:flex items-center justify-end gap-5">
              {/* Notification Bell */}
              <button className="text-gray-600 hover:text-primary">
                <Bell />
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-4">
                <Link to="/student/profile" className="text-text text-[18px] font-medium select-none hover:text-primary transition-colors">
                  {userData?.firstName  || ''}
                </Link>
                <img 
                  src={userData?.profilePictureURL || `https://ui-avatars.com/api/?name=${userData?.firstName || 'U'}+${userData?.lastName || ''}`}
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 bg-primary text-white rounded-md hover:text-primary hover:bg-background text-[16px] font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          {!isAuthPage && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <svg 
                  className="h-6 w-6" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Heading */}
      <div className="w-full bg-white py-6">
        <h1 className="text-[35px] font-semibold text-center">
          {userData?.role === 'faculty' 
            ? "Shaping Futures, Bridging Industries"
            : "From College Halls To Industry Calls"
          }
        </h1>
      </div>

      {/* Mobile menu */}
      {!isAuthPage && isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!currentUser ? (
              <>
                <Link 
                  to="/about"
                  className={`block px-3 py-2 ${isActive('/about') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link 
                  to="/login"
                  className={`block px-3 py-2 ${isActive('/login') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className={`block px-3 py-2 ${isActive('/register') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : userData?.role === 'faculty' ? (
              <>
                <Link 
                  to="/faculty/home"
                  className={`block px-3 py-2 ${isActive('/faculty/home') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/faculty/dashboard"
                  className={`block px-3 py-2 ${isActive('/faculty/dashboard') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/about"
                  className={`block px-3 py-2 ${isActive('/about') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  AboutUS
                </Link>
                <Link 
                  to="/faculty/profile"
                  className={`block px-3 py-2 ${isActive('/faculty/profile') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/home"
                  className={`block px-3 py-2 ${isActive('/home') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/student/dashboard"
                  className={`block px-3 py-2 ${isActive('/student/dashboard') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/courses"
                  className={`block px-3 py-2 ${isActive('/courses') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Courses
                </Link>
                <Link 
                  to="/about"
                  className={`block px-3 py-2 ${isActive('/about') ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  AboutUS
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar; 