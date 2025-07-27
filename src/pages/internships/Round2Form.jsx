import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { APPLICATION_STATUS, updateApplicationStatus, ROUND_STATUS } from '../../utils/applicationUtils';
import { ArrowLeft, FileText } from 'lucide-react';

function Round2Form() {
  // This component now represents Round 2 (quiz) in the new flow
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
        
        console.log('Looking up application:', id);
        
        // Get application data
        const applicationDocRef = doc(db, 'applications', id);
        const applicationSnapshot = await getDoc(applicationDocRef);
        
        if (applicationSnapshot.exists()) {
          applicationData = applicationSnapshot.data();
          applicationFound = true;
          console.log('Found application:', applicationData);
          
          // Check if the application belongs to the current user
          if (applicationData.studentId !== currentUser.uid) {
            setError('You do not have permission to access this application.');
            setLoading(false);
            return;
          }
          
          // Check if the application is in the correct status for Round 2
          // Accept both test_assigned and test_assign for backward compatibility
          const validTestStatuses = [APPLICATION_STATUS.TEST_ASSIGNED, 'test_assign', 'test_in_progress'];
          if (!validTestStatuses.includes(applicationData.status)) {
            setError('This application is not ready for Round 2 quiz. Current status: ' + applicationData.status);
            setLoading(false);
            return;
          }
          
          // Get internship data
          const internshipDocRef = doc(db, 'internships', applicationData.internshipId);
          const internshipSnapshot = await getDoc(internshipDocRef);
          
          if (internshipSnapshot.exists()) {
            internshipData = internshipSnapshot.data();
            console.log('Found internship:', internshipData);
          } else {
            setError('Internship not found.');
            setLoading(false);
            return;
          }
          
          // Get student data
          const studentDocRef = doc(db, 'users', currentUser.uid);
          const studentSnapshot = await getDoc(studentDocRef);
          
          if (studentSnapshot.exists()) {
            const studentData = studentSnapshot.data();
            setStudentData(studentData);
          }
          
          // Check if the student has already submitted Round 2
          const quizSubmissionsQuery = query(
            collection(db, 'quizSubmissions'),
            where('applicationId', '==', id)
          );
          
          const quizSubmissionsSnapshot = await getDocs(quizSubmissionsQuery);
          
          if (!quizSubmissionsSnapshot.empty) {
            setError('You have already submitted the Round 2 quiz for this application.');
            setLoading(false);
            return;
          }
        } else {
          setError('Application not found.');
          setLoading(false);
          return;
        }
        
        setApplication(applicationData);
        setInternship(internshipData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching application details:', error);
        setError('Failed to load application details: ' + error.message);
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
      // Create a submission record in quizSubmissions collection
      const submissionData = {
        ...formData,
        applicationId: id,
        internshipId: application.internshipId,
        studentId: currentUser.uid,
        submittedAt: serverTimestamp(),
        status: 'pending_review',
        // Add round information for better tracking
        roundNumber: 2,
        roundType: 'quiz'
      };
      
      // Add the submission to quizSubmissions collection
      const submissionRef = await addDoc(collection(db, 'quizSubmissions'), submissionData);
      
      // Get the submission ID to reference in the application
      const submissionId = submissionRef.id;
      
      // Update the application with the quiz submission ID and status
      await updateDoc(doc(db, 'applications', id), {
        status: APPLICATION_STATUS.QUIZ_COMPLETED,
        quizSubmissionId: submissionId,
        currentRound: 2,
        lastUpdated: serverTimestamp(),
        // Update the rounds array with the new round information
        rounds: application.rounds ? 
          [...application.rounds.filter(r => r.roundNumber !== 2), 
            {
              roundNumber: 2,
              status: ROUND_STATUS.PENDING,
              submittedAt: serverTimestamp(),
              quizSubmissionId: submissionId
            }
          ] : 
          [{
            roundNumber: 2,
            status: ROUND_STATUS.PENDING,
            submittedAt: serverTimestamp(),
            quizSubmissionId: submissionId
          }]
      });
      
      // Also update the user's application summary for easy dashboard access
      const userSummaryRef = doc(db, 'users', currentUser.uid, 'applicationSummaries', application.internshipId);
      const summarySnapshot = await getDoc(userSummaryRef);
      
      if (summarySnapshot.exists()) {
        // Update existing summary
        await updateDoc(userSummaryRef, {
          status: APPLICATION_STATUS.QUIZ_COMPLETED,
          currentRound: 2,
          lastUpdated: serverTimestamp(),
          roundResults: summarySnapshot.data().roundResults ? 
            [...summarySnapshot.data().roundResults.filter(r => r.round !== 2), 
              { round: 2, status: ROUND_STATUS.PENDING }
            ] : 
            [{ round: 2, status: ROUND_STATUS.PENDING }]
        });
      } else {
        // Create new summary if it doesn't exist
        await setDoc(userSummaryRef, {
          internshipId: application.internshipId,
          internshipTitle: internship.title,
          companyName: internship.companyName,
          currentRound: 2,
          status: APPLICATION_STATUS.QUIZ_COMPLETED,
          roundResults: [{ round: 2, status: ROUND_STATUS.PENDING }],
          lastUpdated: serverTimestamp()
        });
      }
      
      setSuccess('Round 2 quiz submitted successfully! Your results will be reviewed.');
      
      // Navigate back to dashboard after a delay
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center text-primary hover:text-primary-dark mb-4"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">Round 2 Quiz Assessment</h1>
          <p className="text-sm mt-1">{internship?.title} at {internship?.companyName}</p>
          <p className="text-sm mt-1">Congratulations on passing Round 1!</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Technical Skills Assessment</h2>
            <p className="text-gray-700 mb-4">
              This quiz will help us better understand your technical skills, experience, and fit for the role.
              Please provide detailed and thoughtful answers to increase your chances of selection.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading application details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectExperience">
                  Describe your relevant project experience: *
                </label>
                <textarea
                  id="projectExperience"
                  name="projectExperience"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.projectExperience}
                  onChange={handleInputChange}
                  placeholder="For the quiz, describe projects you've worked on that are relevant to this internship..."
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="technicalSkills">
                  List and rate your technical skills: *
                </label>
                <textarea
                  id="technicalSkills"
                  name="technicalSkills"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.technicalSkills}
                  onChange={handleInputChange}
                  placeholder="For the quiz, list your technical skills and rate your proficiency (e.g., JavaScript - Advanced, Python - Intermediate)..."
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
                  placeholder="For the quiz, share examples of collaboration, your role in teams, and how you handle team challenges..."
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
                  placeholder="For the quiz, explain a difficult technical problem you faced and how you approached solving it..."
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
                  placeholder="For the quiz, describe your short and long-term career goals and how this internship will help you achieve them..."
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="additionalInfo">
                  Additional information (optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="For the quiz, anything else you'd like to share with the evaluation team..."
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {submitting ? 'Submitting...' : 'Submit Round 2 Quiz'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Round2Form;
