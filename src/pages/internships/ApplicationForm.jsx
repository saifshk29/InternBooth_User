import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function ApplicationForm() {
  const { id } = useParams(); // internship id
  const { currentUser, getUserData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [internship, setInternship] = useState(null);
  const [userData, setUserData] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    whyApplying: '',
    relevantExperience: '',
    availability: '',
    references: ''
  });
  
  useEffect(() => {
    async function fetchInternshipDetails() {
      try {
        setLoading(true);
        
        // Check if user has applied and passed Round 1
        if (currentUser) {
          // First check in the subcollection (new structure)
          const internshipsQuery = query(collection(db, 'internships'));
          const internshipsSnapshot = await getDocs(internshipsQuery);
          
          let applicationFound = false;
          let applicationData = null;
          let applicationDocRef = null;
          let applicationDocId = null;
          
          // Check each internship's applications subcollection
          for (const internshipDoc of internshipsSnapshot.docs) {
            const internshipId = internshipDoc.id;
            
            // Skip if this isn't the internship we're looking for
            if (internshipId !== id) continue;
            
            const subCollectionQuery = query(
              collection(db, 'internships', internshipId, 'applications'),
              where('studentId', '==', currentUser.uid)
            );
            
            const subCollectionSnapshot = await getDocs(subCollectionQuery);
            
            if (!subCollectionSnapshot.empty) {
              applicationFound = true;
              applicationData = subCollectionSnapshot.docs[0].data();
              applicationDocId = subCollectionSnapshot.docs[0].id;
              applicationDocRef = doc(db, 'internships', internshipId, 'applications', applicationDocId);
              break;
            }
          }
          
          // If not found in subcollections, check the top-level collection (old structure)
          if (!applicationFound) {
            const topLevelQuery = query(
              collection(db, 'applications'),
              where('internshipId', '==', id),
              where('studentId', '==', currentUser.uid)
            );
            
            const topLevelSnapshot = await getDocs(topLevelQuery);
            if (!topLevelSnapshot.empty) {
              applicationFound = true;
              applicationData = topLevelSnapshot.docs[0].data();
              applicationDocId = topLevelSnapshot.docs[0].id;
              applicationDocRef = doc(db, 'applications', applicationDocId);
            }
          }
          
          // Store application reference for later use
          if (applicationFound) {
            setApplicationRef(applicationDocRef);
            setApplicationId(applicationDocId);
            setApplicationData(applicationData);
          }
          
          if (applicationFound) {
            // Check if the application status indicates they've passed Round 1
            if (applicationData.status !== 'round2_pending_form' && applicationData.status !== 'test_approved') {
              setError('You must pass Round 1 before completing the Round 2 application form.');
              setLoading(false);
              return;
            }
          } else {
            setError('You must apply and pass Round 1 before accessing this form.');
            setLoading(false);
            return;
          }
        }
        
        // Fetch internship details
        const internshipDoc = await getDoc(doc(db, 'internships', id));
        
        if (!internshipDoc.exists()) {
          setError('Internship not found');
          setLoading(false);
          return;
        }
        
        const internshipData = { id: internshipDoc.id, ...internshipDoc.data() };
        setInternship(internshipData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching internship details:', error);
        setError('Failed to load internship details. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchInternshipDetails();
  }, [id, currentUser]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Update the existing application with form data
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('internshipId', '==', id),
        where('studentId', '==', currentUser.uid)
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationDoc = applicationsSnapshot.docs[0];
      
      await updateDoc(doc(db, 'applications', applicationDoc.id), {
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });
      
      setSuccess('Application submitted successfully!');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center">Loading application form...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="flex justify-center space-x-4">
          <Link to="/student/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
        <p className="text-center">Redirecting to dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/internships/${id}`} className="text-secondary hover:underline mb-6 inline-block">
        &larr; Back to internship details
      </Link>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white">
          <h1 className="text-xl font-bold">Apply for {internship?.title}</h1>
          <p className="text-sm mt-1">{internship?.companyName}</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Application Process</h2>
            <ol className="list-decimal pl-5 text-gray-700">
              <li className="mb-1">Complete this application form</li>
              <li className="mb-1">Take a technical quiz to assess your skills</li>
              <li className="mb-1">If shortlisted, you'll be notified for further steps</li>
            </ol>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="whyApplying">
                Why are you interested in this internship opportunity? *
              </label>
              <textarea
                id="whyApplying"
                name="whyApplying"
                rows="4"
                className="input-field"
                value={formData.whyApplying}
                onChange={handleInputChange}
                placeholder="Explain why you are interested in this specific internship and how it aligns with your career goals..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="relevantExperience">
                Describe any relevant experience or projects related to this position: *
              </label>
              <textarea
                id="relevantExperience"
                name="relevantExperience"
                rows="4"
                className="input-field"
                value={formData.relevantExperience}
                onChange={handleInputChange}
                placeholder="Include details of academic projects, previous internships, or personal projects that demonstrate your skills relevant to this position..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="availability">
                What is your availability for this internship? *
              </label>
              <textarea
                id="availability"
                name="availability"
                rows="2"
                className="input-field"
                value={formData.availability}
                onChange={handleInputChange}
                placeholder="Indicate your weekly availability, preferred work hours, and any other relevant information..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="references">
                References (Optional)
              </label>
              <textarea
                id="references"
                name="references"
                rows="2"
                className="input-field"
                value={formData.references}
                onChange={handleInputChange}
                placeholder="List any professional or academic references with their contact information..."
              />
            </div>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Resume (Optional)</h3>
              {userData?.resumeUrl ? (
                <p className="text-sm text-gray-600 mb-2">
                  Your current resume will be included with this application:
                  <span className="font-semibold ml-1">{userData?.resumeFileName || "Resume.pdf"}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-600 mb-2">
                  No resume uploaded. You can still apply without a resume, but we recommend adding one for better chances.
                </p>
              )}
              <Link to="/student/profile" className="text-secondary text-sm hover:underline">
                {userData?.resumeUrl ? "Update resume" : "Add a resume"}
              </Link>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ApplicationForm; 