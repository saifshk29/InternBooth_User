import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function Round1Form() {
  const { id } = useParams(); // application id
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [internship, setInternship] = useState(null);
  const [application, setApplication] = useState(null);
  const [studentData, setStudentData] = useState(null);
  
  // Form fields for Round 2
  const [formData, setFormData] = useState({
    projectExperience: '',
    technicalSkills: '',
    teamworkExperience: '',
    challengesSolved: '',
    careerGoals: '',
    additionalInfo: ''
  });
  
  useEffect(() => {
    async function fetchApplicationDetails() {
      try {
        setLoading(true);
        
        if (!currentUser) {
          setError('You must be logged in to access this form.');
          setLoading(false);
          return;
        }
        
        console.log('Searching for application with ID:', id);
        
        // First, try to find the application in the top-level collection to get the internshipId
        let applicationFound = false;
        let applicationData = null;
        let internshipData = null;
        let applicationDocRef = null;
        
        console.log('Looking up application:', id);
        
        // First check the top-level collection to get the internshipId
        const topLevelAppDoc = await getDoc(doc(db, 'applications', id));
        
        if (topLevelAppDoc.exists()) {
          const topLevelData = topLevelAppDoc.data();
          console.log('Found application in top-level collection with internshipId:', topLevelData.internshipId);
          
          if (!topLevelData.internshipId) {
            setError('Cannot find internship details for this application.');
            setLoading(false);
            return;
          }
          
          // Now that we have the internshipId, look for the application in the correct subcollection
          const subcollectionAppRef = doc(db, 'internships', topLevelData.internshipId, 'applications', id);
          const subcollectionAppDoc = await getDoc(subcollectionAppRef);
          
          // Get the internship data
          const internshipDoc = await getDoc(doc(db, 'internships', topLevelData.internshipId));
          
          if (subcollectionAppDoc.exists()) {
            // Use the subcollection version if it exists
            console.log('Found application in correct subcollection');
            applicationFound = true;
            applicationData = { id: subcollectionAppDoc.id, ...subcollectionAppDoc.data() };
            applicationDocRef = subcollectionAppRef;
          } else {
            // If not in subcollection, use the top-level data but create it in subcollection later
            console.log('Application not found in subcollection, will use top-level data');
            applicationFound = true;
            applicationData = { id: topLevelAppDoc.id, ...topLevelData };
            applicationDocRef = subcollectionAppRef; // Use subcollection ref for future updates
          }
          
          if (internshipDoc.exists()) {
            internshipData = { id: topLevelData.internshipId, ...internshipDoc.data() };
            console.log('Found internship data:', internshipData.id);
          } else {
            setError('Cannot find internship details.');
            setLoading(false);
            return;
          }
        } else {
          // If not found in top-level, try direct lookup in the internships collection
          console.log('Application not found in top-level collection, checking internships collection');
          
          // Get all internships
          const internshipsQuery = query(collection(db, 'internships'));
          const internshipsSnapshot = await getDocs(internshipsQuery);
          
          // Look for the application with matching ID and studentId
          for (const internshipDoc of internshipsSnapshot.docs) {
            const appRef = doc(db, 'internships', internshipDoc.id, 'applications', id);
            const appSnap = await getDoc(appRef);
            
            if (appSnap.exists() && appSnap.data().studentId === currentUser.uid) {
              console.log('Found application in internship:', internshipDoc.id);
              applicationFound = true;
              applicationData = { id: appSnap.id, ...appSnap.data() };
              internshipData = { id: internshipDoc.id, ...internshipDoc.data() };
              applicationDocRef = appRef;
              break;
            }
          }
        }
        
        if (!applicationFound) {
          setError('Application not found.');
          setLoading(false);
          return;
        }
        
        // Verify this application belongs to the current user
        if (applicationData.studentId !== currentUser.uid) {
          setError('You do not have permission to access this application.');
          setLoading(false);
          return;
        }
        
        // Check if the application status indicates they're eligible for Round 1 form
        console.log('Application status:', applicationData.status);
        console.log('Application data:', applicationData);
        
        // Accept applications with status 'pending' or 'form_pending' for Round 1
        const eligibleStatuses = ['pending', 'form_pending', 'under_review'];
        const rejectedStatuses = ['rejected'];
        
        if (rejectedStatuses.includes(applicationData.status)) {
          // Special error message for rejected applications
          setError(
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">This application was rejected.</p>
              <p className="mb-6">Your application status is: <span className="font-semibold text-red-500">{applicationData.status}</span></p>
              <p className="mb-2">Please check your dashboard for feedback from the evaluators.</p>
              <Link to="/student/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </Link>
            </div>
          );
          setLoading(false);
          return;
        } else if (!eligibleStatuses.includes(applicationData.status) && applicationData.currentRound !== 1) {
          setError(
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">This application is not eligible for Round 1 submission.</p>
              <p className="mb-6">Current status: <span className="font-semibold">{applicationData.status}</span></p>
              <Link to="/student/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </Link>
            </div>
          );
          setLoading(false);
          return;
        }
        
        // Get student data
        const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
        if (studentDoc.exists()) {
          setStudentData({ id: studentDoc.id, ...studentDoc.data() });
        }
        
        setApplication(applicationData);
        setInternship(internshipData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching application details:', error);
        setError('Failed to load application details. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchApplicationDetails();
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
    setSubmitting(true);
    setError('');
    
    try {
      if (!internship?.id) {
        throw new Error('Cannot submit form: Missing internship details.');
      }
      
      // First update/create in the subcollection path
      const appDocRef = doc(db, 'internships', internship.id, 'applications', application.id);
      
      try {
        // First check if the document exists in the subcollection
        const appDocSnap = await getDoc(appDocRef);
        
        // Create a new submission document
        const submissionDocRef = await addDoc(collection(db, 'round1Submissions'), {
          ...formData,  // Include all form fields
          studentId: currentUser.uid,
          studentName: studentData?.firstName + ' ' + studentData?.lastName,
          studentEmail: currentUser.email,
          applicationId: application.id,
          internshipId: internship.id,
          internshipTitle: internship.title,
          companyName: internship.companyName,
          submittedAt: serverTimestamp(),
          status: 'pending_review'
        });
        
        const updateData = {
          status: 'form_submitted',
          round1SubmissionId: submissionDocRef.id,
          updatedAt: serverTimestamp(),
          round1FormData: formData  // Store form data in application for easy access
        };
        
        if (!appDocSnap.exists()) {
          // Document doesn't exist in subcollection, create it
          console.log('Creating application document in subcollection...');
          
          // Get the original application data from the top-level collection
          const originalAppRef = doc(db, 'applications', application.id);
          const originalAppSnap = await getDoc(originalAppRef);
          
          if (originalAppSnap.exists()) {
            // Merge original data with our updates
            const originalData = originalAppSnap.data();
            await setDoc(appDocRef, {
              ...originalData,  // Copy all fields from original application
              ...updateData,    // Override with our updates
              studentId: currentUser.uid,
              internshipId: internship.id,  // Always use the internship.id from state
              currentRound: 2,  // Explicitly set current round
              rounds: application.rounds || []  // Preserve rounds array if it exists
            });
            console.log('Created application document in subcollection with data from original application');
          } else {
            // Create with minimal required fields
            await setDoc(appDocRef, {
              ...updateData,
              studentId: currentUser.uid,
              internshipId: internship.id,  // Always use the internship.id from state
              appliedAt: application.appliedAt || serverTimestamp(),
              currentRound: 2,  // Explicitly set current round
              rounds: application.rounds || [],
              studentName: studentData?.firstName + ' ' + studentData?.lastName,
              studentEmail: currentUser.email
            });
            console.log('Created application document in subcollection with minimal data');
          }
        } else {
          // Document exists in subcollection, update it
          await updateDoc(appDocRef, updateData);
          console.log('Updated existing application document in subcollection');
        }

        // Also update the top-level document to maintain consistency
        try {
          const topLevelAppRef = doc(db, 'applications', application.id);
          await updateDoc(topLevelAppRef, {
            ...updateData,
            internshipId: internship.id  // Ensure internshipId is correct in top-level doc
          });
          console.log('Updated top-level application document');
        } catch (error) {
          console.warn('Could not update top-level application document:', error);
          // Don't throw error here as the main operation in subcollection succeeded
        }
        
        setSuccess('Round 1 form submitted successfully! Your application will be reviewed.');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 3000);
      } catch (error) {
        console.error('Error updating application:', error);
        throw new Error(`Failed to update application status: ${error.message}`);
      }


      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting Round 2 form:', error);
      setError(`Failed to submit form: ${error.message}. Please try again.`);
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center">Loading Round 1 form...</p>
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
          <Link to="/student/dashboard" className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary-dark">
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
      <Link to="/student/dashboard" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Back to dashboard
      </Link>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">Round 1 Application Form</h1>
          <p className="text-sm mt-1">{internship?.title} at {internship?.companyName}</p>
          <p className="text-sm mt-1">Please complete this form to proceed with your application</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Round 1 Assessment</h2>
            <p className="text-gray-700 mb-4">
              This form will help us better understand your technical skills, experience, and fit for the role.
              Please provide detailed and thoughtful answers to increase your chances of selection.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectExperience">
                Describe a significant project you've worked on that's relevant to this role: *
              </label>
              <textarea
                id="projectExperience"
                name="projectExperience"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.projectExperience}
                onChange={handleInputChange}
                placeholder="Include the project's purpose, your role, technologies used, challenges faced, and outcomes..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="technicalSkills">
                Detail your technical skills and proficiency levels relevant to this internship: *
              </label>
              <textarea
                id="technicalSkills"
                name="technicalSkills"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.technicalSkills}
                onChange={handleInputChange}
                placeholder="List programming languages, frameworks, tools, and your proficiency level with each..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teamworkExperience">
                Describe your experience working in a team environment: *
              </label>
              <textarea
                id="teamworkExperience"
                name="teamworkExperience"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.teamworkExperience}
                onChange={handleInputChange}
                placeholder="Share examples of collaboration, your role in teams, and how you handle team challenges..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="challengesSolved">
                Describe a technical challenge you've solved: *
              </label>
              <textarea
                id="challengesSolved"
                name="challengesSolved"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.challengesSolved}
                onChange={handleInputChange}
                placeholder="Explain the problem, your approach to solving it, and the outcome..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="careerGoals">
                What are your career goals and how does this internship fit into them? *
              </label>
              <textarea
                id="careerGoals"
                name="careerGoals"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.careerGoals}
                onChange={handleInputChange}
                placeholder="Share your short and long-term career goals and how this opportunity aligns with them..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="additionalInfo">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                placeholder="Any other information you'd like to share with the hiring team..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link 
                to="/student/dashboard" 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Round 1 Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Round1Form;
