import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoPrimary from '../../assets/LogoPrimary.png';
import { Home, Briefcase, LogIn, UserPlus, GraduationCap, Users, BookOpen, FileSpreadsheet, Mail, Phone, MapPin, Globe } from 'lucide-react';

function Footer() {
  const { currentUser, userType } = useAuth();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="footer" className="bg-[#202124]  text-white">
      <div className="max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Top section with logo and content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img src={LogoPrimary} alt="Logo" height="30" width="30" />
              <h3 className="text-xl font-bold ml-2">InternBooth</h3>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              Connecting students with industry opportunities through faculty connections.
              Build your career path with meaningful internships.
            </p>
          </div>
          
          {/* Quick Links - Dynamic based on user type */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-gray-300 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </li>
              
              {!currentUser ? (
                // Not logged in user links
                <>
                  <li>
                    <Link to="/internships" className="text-sm hover:text-gray-300 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Internships
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="text-sm hover:text-gray-300 flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-sm hover:text-gray-300 flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </Link>
                  </li>
                </>
              ) : userType === 'student' ? (
                // Student links
                <>
                  <li>
                    <Link to="/student/dashboard" className="text-sm hover:text-gray-300 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/student/applications" className="text-sm hover:text-gray-300 flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      My Applications
                    </Link>
                  </li>
                  <li>
                    <Link to="/internships" className="text-sm hover:text-gray-300 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Internships
                    </Link>
                  </li>
                </>
              ) : (
                // Faculty links
                <>
                  <li>
                    <Link to="/faculty/dashboard" className="text-sm hover:text-gray-300 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/faculty/internships" className="text-sm hover:text-gray-300 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Posted Internships
                    </Link>
                  </li>
                  <li>
                    <Link to="/faculty/applications" className="text-sm hover:text-gray-300 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Review Applications
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm hover:text-gray-300 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm hover:text-gray-300 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-gray-300 flex items-center">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Contact Us</h3>
            <ul className="space-y-3">
              <li className="text-sm text-gray-300 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                support@internbooth.com
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +91 (800) 123-4567
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Bangalore, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-center text-sm text-gray-400">
            &copy; {currentYear} InternBooth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 