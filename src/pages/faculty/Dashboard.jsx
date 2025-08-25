import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import InternshipForm from '../../components/faculty/InternshipForm';

function Dashboard() {
  const { currentUser, getUserData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('internships');
  const [facultyData, setFacultyData] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInternshipForm, setShowInternshipForm] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError('');

        // Fetch faculty data using getUserData from AuthContext
        const userData = await getUserData(currentUser.uid);
        setFacultyData(userData);

        // Check if profile is complete - faculty profiles are stored in users collection
        const requiredFields = ['firstName', 'lastName', 'department', 'designation'];
        const isProfileComplete = requiredFields.every(field => userData?.[field]);
        console.log('Profile data:', userData);
        console.log('Is profile complete:', isProfileComplete);
        setProfileComplete(isProfileComplete);

        // Fetch internships with their applicant counts
        const internshipsQuery = query(
          collection(db, 'internships'),
          where('facultyId', '==', currentUser.uid),
          orderBy('postedDate', 'desc')
        );
        const internshipsSnapshot = await getDocs(internshipsQuery);
        const internshipsData = internshipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch applications and count them per internship
        let applicationsData = [];
        
        if (internshipsData.length > 0) {
          // Handle Firestore's limit of 10 items in 'in' clause
          const batchSize = 10;
          const batches = [];
          
          // Split internship IDs into batches of 10
          for (let i = 0; i < internshipsData.length; i += batchSize) {
            batches.push(internshipsData.slice(i, i + batchSize));
          }
          
          // Fetch applications for each batch
          for (const batch of batches) {
            const batchIds = batch.map(internship => internship.id);
            const batchQuery = query(
              collection(db, 'applications'),
              where('internshipId', 'in', batchIds)
            );
            
            const batchSnapshot = await getDocs(batchQuery);
            const batchData = batchSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            applicationsData = [...applicationsData, ...batchData];
          }
        }

        // Group applications by internship
        const applicationsByInternship = applicationsData.reduce((acc, application) => {
          if (!acc[application.internshipId]) {
            acc[application.internshipId] = [];
          }
          acc[application.internshipId].push(application);
          return acc;
        }, {});

        // Update internships with applicant counts
        const internshipsWithCounts = internshipsData.map(internship => ({
          ...internship,
          applicants: applicationsByInternship[internship.id] || []
        }));

        setInternships(internshipsWithCounts);
        setApplications(applicationsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Handle internship form success
  const handleInternshipSuccess = async () => {
    // Refresh internships list
    const internshipsQuery = query(
      collection(db, 'internships'),
      where('facultyId', '==', currentUser.uid),
      orderBy('postedDate', 'desc')
    );
    
    const internshipsSnapshot = await getDocs(internshipsQuery);
    const internshipsData = internshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setInternships(internshipsData);
    setShowInternshipForm(false);
  };

  // Handle internship deletion
  const handleDeleteInternship = async (internshipId) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await deleteDoc(doc(db, 'internships', internshipId));
        
        // Update local state
        setInternships(prev => prev.filter(internship => internship.id !== internshipId));
      } catch (error) {
        console.error('Error deleting internship:', error);
        setError('Failed to delete internship');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
        <p className="text-center">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Welcome, {facultyData?.firstName || 'Faculty'}
          </span>
          <Link to="/profile" className="text-primary hover:underline">
            Edit Profile
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('internships')}
            className={`${
              activeTab === 'internships'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Internships
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`${
              activeTab === 'applications'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Applications
          </button>
          <Link to="/faculty/all-students">
            <button className={`px-4 py-2 mt-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-200`}>
              All Students
            </button>
          </Link>
        </nav>
      </div>

      {/* Internships Tab */}
      {activeTab === 'internships' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">My Internship Listings</h2>
            <button
              onClick={() => {
                console.log('Button clicked, profileComplete:', profileComplete);
                if (!profileComplete) {
                  setError('Please complete your profile before posting an internship');
                  return;
                }
                setShowInternshipForm(!showInternshipForm);
              }}
              className="btn-primary"
            >
              {showInternshipForm ? 'Cancel' : 'Post New Internship'}
            </button>
          </div>
          
          {/* Internship Form */}
          {showInternshipForm && (
            <InternshipForm
              onSuccess={handleInternshipSuccess}
              onCancel={() => setShowInternshipForm(false)}
            />
          )}
          
          {/* Internships List */}
          {!showInternshipForm && (
            internships.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600 mb-4">You haven't posted any internships yet.</p>
                <button
                  onClick={() => {
                    if (!profileComplete) {
                      setError('Please complete your profile before posting an internship');
                      return;
                    }
                    setShowInternshipForm(true);
                  }}
                  className={`btn-primary ${!profileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Post Your First Internship
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {internships.map(internship => (
                  <div key={internship.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{internship.title}</h3>
                          <p className="text-gray-600">{internship.companyName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm">
                            {internship.applicants?.length || 0} Applicants
                          </span>
                          <button
                            onClick={() => handleDeleteInternship(internship.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {internship.departments && internship.departments.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-600 font-medium">Departments:</span>
                            {internship.departments.map(dept => (
                              <span key={dept} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {dept}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-600 font-medium">Domains:</span>
                          <span className="bg-secondary bg-opacity-10 text-secondary text-xs px-2 py-1 rounded">
                            {internship.domains.join(', ')}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          Posted on {new Date(internship.postedDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-3">{internship.description}</p>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <span className="mr-4">
                            Deadline: {new Date(internship.firstRoundDate).toLocaleDateString()}
                          </span>
                          <span>
                            Test Date: {new Date(internship.testDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Link
                          to={`/faculty/internships/${internship.id}`}
                          className="text-primary hover:underline"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div>
          <h2 className="text-xl font-bold mb-6">Applications</h2>
          
          {/* Internships List */}
          <div className="grid grid-cols-1 gap-6">
            {internships.map(internship => (
              <div key={internship.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{internship.title}</h3>
                      <p className="text-gray-600">{internship.companyName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm">
                        {internship.applicants?.length || 0} Applicants
                      </span>
                      <Link
                        to={`/faculty/view-applications/${internship.id}`}
                        className="text-primary hover:text-primary-dark"
                      >
                        View Applications
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;