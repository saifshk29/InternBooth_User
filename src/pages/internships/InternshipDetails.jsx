import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DomainTag from '../../components/DomainTag';
import InternshipCard from '../../components/InternshipCard';

function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, getUserData, userRole } = useAuth();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [userData, setUserData] = useState(null);
  const [otherInternships, setOtherInternships] = useState([]);
  const [loadingOthers, setLoadingOthers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appliedInternshipIds, setAppliedInternshipIds] = useState([]);

  // Reset states when component unmounts or id changes
  useEffect(() => {
    return () => {
      setInternship(null);
      setLoading(true);
      setError('');
    };
  }, [id]);

  // Main internship data fetching
  useEffect(() => {
    async function fetchInternshipData() {
      if (!id) return;

      setLoading(true);
      setError('');
      
      try {
        const internshipDoc = await getDoc(doc(db, 'internships', id));
        if (!internshipDoc.exists()) {
          throw new Error('Internship not found');
        }

        const internshipData = { id: internshipDoc.id, ...internshipDoc.data() };
        setInternship(internshipData);
      } catch (error) {
        console.error('Error fetching internship:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInternshipData();
  }, [id]);

  // Fetch other internships
  useEffect(() => {
    async function fetchOtherInternships() {
      if (!id) return;
      
      try {
        const internshipsQuery = query(
          collection(db, 'internships'),
          orderBy('postedDate', 'desc'),
          limit(4)
        );

        const querySnapshot = await getDocs(internshipsQuery);
        const internships = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(internship => internship.id !== id)
          .slice(0, 3);

        setOtherInternships(internships);
      } catch (error) {
        console.error('Error fetching other internships:', error);
      } finally {
        setLoadingOthers(false);
      }
    }

    fetchOtherInternships();
  }, [id]);

  useEffect(() => {
    async function fetchAppliedInternships() {
      if (currentUser && userRole === 'student') {
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('studentId', '==', currentUser.uid)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const ids = applicationsSnapshot.docs.map(doc => doc.data().internshipId);
          setAppliedInternshipIds(ids);
        } catch (error) {
          console.error('Error fetching applied internships:', error);
        }
      } else {
        setAppliedInternshipIds([]);
      }
    }
    fetchAppliedInternships();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (appliedInternshipIds.includes(id)) {
      setHasApplied(true);
    } else {
      setHasApplied(false);
    }
  }, [appliedInternshipIds, id]);

  const handleApply = async () => {
    if (submitting) return; // Prevent double submit
    setSubmitting(true);
    if (!currentUser) {
      navigate('/login', { state: { from: `/internships/${id}` } });
      setSubmitting(false);
      return;
    }
    
    if (userRole !== 'student') {
      setError('Only students can apply for internships');
      setSubmitting(false);
      return;
    }

    try {
      // Validate internship data
      if (!internship) {
        throw new Error('Internship data not available');
      }

      // Get user data if not already available
      let studentData = userData;
      if (!studentData) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          studentData = userDoc.data();
        }
      }

      // Create initial application with pending status
      const applicationData = {
        internshipId: id,
        studentId: currentUser.uid,
        studentName: studentData ? `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() : 'Student',
        studentEmail: currentUser.email,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        internshipDetails: {
          title: internship.title || '',
          companyName: internship.companyName || '',
          domains: internship.domains || [],
          testDate: internship.testDate ? new Date(internship.testDate).toISOString() : null,
          firstRoundDate: internship.firstRoundDate ? new Date(internship.firstRoundDate).toISOString() : null
        }
      };

      // Debug log before Firestore write
      console.log('Application data to be saved:', applicationData);

      // Validate required fields
      if (!applicationData.internshipId || !applicationData.studentId || !applicationData.internshipDetails.testDate) {
        throw new Error('Missing required application data');
      }

      try {
        const docRef = await addDoc(collection(db, 'applications'), applicationData);
        console.log('Application document created with ID:', docRef.id);
        if (!docRef.id) {
          throw new Error('Failed to create application document');
        }
      } catch (firestoreError) {
        console.error('Error creating application:', firestoreError);
        throw firestoreError;
      }

      // Show success message
      setSuccess(true);
      setHasApplied(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error applying:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render the More For You section with safety checks
  const renderMoreForYou = () => {
    if (loadingOthers) {
      return (
        <div className="space-y-4">
          <p className="text-subtext text-sm">Loading opportunities...</p>
        </div>
      );
    }

    // Filter out internships the student has already applied to
    const filteredOtherInternships = otherInternships.filter(
      internship => !appliedInternshipIds.includes(internship.id)
    );

    if (!Array.isArray(filteredOtherInternships) || filteredOtherInternships.length === 0) {
      return (
        <div className="space-y-4">
          <p className="text-subtext text-sm">No other opportunities available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredOtherInternships.map(internship => (
          internship && internship.id ? (
            <InternshipCard 
              key={internship.id} 
              internship={internship}
            />
          ) : null
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">APPLIED SUCCESSFULLY</h2>
        <p className="text-gray-600 mb-4">
          You'll be notified about the First Round Soon!
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-600">Loading internship details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/home" className="text-secondary hover:underline">
          &larr; Back to internships
        </Link>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Internship not found</p>
        <div className="text-center mt-4">
          <Link to="/home" className="text-secondary hover:underline">
            &larr; Back to internships
          </Link>
        </div>
      </div>
    );
  }

  const isApplicationOpen = internship.firstRoundDate ? new Date(internship.firstRoundDate) > new Date() : false;
  const safeDomains = Array.isArray(internship.domains) ? internship.domains : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 rounded-lg shadow-lg overflow-hidden min-h-screen p-4 lg:p-12">
      {/* Left Sidebar - More For You */}
      <div className="w-full lg:w-1/4 bg-background rounded-lg p-4 lg:p-6">
        <h2 className="text-xl font-bold mb-6">More For You</h2>
        {renderMoreForYou()}
      </div>
      
      {/* Main Content Container */}
      <div className="flex-1">
        {/* Content Area */}
        <div className="w-full bg-white rounded-xl flex flex-col lg:flex-row gap-4">
          {/* Main Content Section */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8 border-b lg:border-b-0 lg:border-r-4 border-gray-200 p-4 lg:p-12">
              <div className="pb-5 border-gray-200 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-5">
                <h1 className="text-2xl font-bold">{internship.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {safeDomains.map((domain, index) => (
                    domain ? <DomainTag key={index} domain={domain} /> : null
                  ))}
                </div>
              </div>
              <div className='h-[3px] w-full bg-subtext opacity-30'></div>
              {/* About This Role */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-2">About This Role:</h2>
                <p className="text-gray-700 text-justify">{internship.description}</p>
              </div>
              
              {/* Responsibilities */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-2">Responsibilities:</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {Array.isArray(internship?.responsibilities) && internship.responsibilities.length > 0 ? (
                    internship.responsibilities.map((responsibility, index) => (
                      <li key={index}>{responsibility}</li>
                    ))
                  ) : (
                    <li>No specific responsibilities listed</li>
                  )}
                </ul>
              </div>

              {/* Required Skills */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-2">Required Skills:</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(internship?.skills) && internship.skills.length > 0 ? (
                    internship.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-primary bg-opacity-10 text-primary text-sm px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-600">No specific skills listed</span>
                  )}
                </div>
              </div>
          </div>

          {/* Right Sidebar Section */}
          <div className="w-full lg:w-1/3 p-4 lg:p-6">
            <div className="sticky top-6">
              {/* Company Info */}
              <div className="mb-6 flex flex-col gap-2">
                <h2 className="text-[21px] font-bold mb-2">{internship.companyName}</h2>
                <p className="text-[15px] font-medium text-text">
                  Posted on: {new Date(internship.postedDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-subtext">
                  Posted by: {internship?.facultyName || 'Faculty'}
                  {internship?.facultyDesignation && (
                    <>
                      <br />
                      ({internship.facultyDesignation})
                    </>
                  )}
                </p>
              </div>
              
              {/* Other Information */}
              <div className="mb-6 flex flex-col gap-2">
                <h2 className="text-[21px] font-bold mb-2">Other Information</h2>
                <p className="text-sm text-subtext mb-1">
                  Duration: {internship.duration || 'Not specified'} {internship.duration ? 'months' : ''}
                </p>
                <p className="text-sm text-subtext mb-1">
                  Location: {internship.location || 'Remote'}
                </p>
                <p className="text-sm text-subtext mb-1">
                  Start Date: {internship.startDate ? new Date(internship.startDate).toLocaleDateString() : 'Not specified'}
                </p>
                <p className="text-sm text-subtext">
                  Stipend: {internship.stipend ? `₹${internship.stipend}` : 'Not specified'}
                </p>
              </div>
              
              {/* Application Process */}
              <div className="mb-6 flex flex-col gap-2">
                <h2 className="text-lg font-bold mb-2">Application Process</h2>
                <p className="text-sm text-subtext mb-1">First Round: Application</p>
                <p className="text-sm text-subtext mb-1">Second Round: Test</p>
                <p className="text-sm text-subtext mb-1">
                  First Round Date: {new Date(internship.firstRoundDate).toLocaleDateString()}
                </p>
              </div>
              
              {/* Apply Button or Status */}
              {hasApplied ? (
                <div className="bg-green-100 text-green-700 p-4 rounded-2xl">
                  <p>You have already applied to this internship.</p>
                  <Link to="/student/dashboard" className="text-primary hover:underline">
                    View your application status
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-2xl"
                  disabled={submitting}
                >
                  {submitting ? 'Applying...' : 'APPLY'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternshipDetails;