import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { APPLICATION_STATUS, ROUND_STATUS, updateApplicationStatus, getStatusLabel, getStatusBadgeClass } from '../../utils/applicationUtils';

function EvaluateQuizSubmissions() {
  const { internshipId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [internship, setInternship] = useState(null);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  useEffect(() => {
    async function fetchQuizSubmissions() {
      try {
        setLoading(true);
        setError('');
        
        // Fetch internship details
        const internshipDoc = await getDoc(doc(db, 'internships', internshipId));
        if (internshipDoc.exists()) {
          setInternship(internshipDoc.data());
        } else {
          throw new Error('Internship not found');
        }
        
        // Fetch applications for this internship that have quiz submissions
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('internshipId', '==', internshipId),
          where('status', '==', APPLICATION_STATUS.QUIZ_COMPLETED)
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        // Get all the quiz submission IDs
        const quizSubmissionIds = applicationsSnapshot.docs
          .map(doc => ({ 
            applicationId: doc.id, 
            ...doc.data(),
            quizSubmissionId: doc.data().quizSubmissionId
          }))
          .filter(app => app.quizSubmissionId); // Filter out any without quiz submission IDs
        
        // Fetch the actual quiz submissions
        const submissionsData = await Promise.all(
          quizSubmissionIds.map(async (app) => {
            try {
              const quizDoc = await getDoc(doc(db, 'quizSubmissions', app.quizSubmissionId));
              
              if (quizDoc.exists()) {
                const quizData = quizDoc.data();
                
                // Fetch student details
                const studentDoc = await getDoc(doc(db, 'users', app.studentId));
                let studentData = {};
                
                if (studentDoc.exists()) {
                  studentData = studentDoc.data();
                }
                
                return {
                  id: quizDoc.id,
                  applicationId: app.applicationId,
                  applicationStatus: app.status,
                  studentId: app.studentId,
                  studentName: studentData.firstName && studentData.lastName ? 
                    `${studentData.firstName} ${studentData.lastName}` : 'Unknown Student',
                  studentEmail: studentData.email || 'No email',
                  ...quizData
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching quiz submission:', error);
              return null;
            }
          })
        );
        
        // Filter out any null values (failed fetches)
        const validSubmissions = submissionsData.filter(submission => submission !== null);
        
        setQuizSubmissions(validSubmissions);
        setFilteredSubmissions(validSubmissions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
        setError('Failed to load quiz submissions: ' + error.message);
        setLoading(false);
      }
    }
    
    if (internshipId && currentUser) {
      fetchQuizSubmissions();
    }
  }, [internshipId, currentUser]);
  
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredSubmissions(quizSubmissions);
    } else {
      setFilteredSubmissions(quizSubmissions.filter(submission => submission.status === statusFilter));
    }
  }, [statusFilter, quizSubmissions]);
  
  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };
  
  const handleApproveQuiz = async (submissionId, applicationId) => {
    if (!feedbackText.trim()) {
      alert('Please provide feedback before approving.');
      return;
    }
    
    setProcessingAction(true);
    try {
      // 1. Update the quiz submission status
      await updateDoc(doc(db, 'quizSubmissions', submissionId), {
        status: 'approved',
        feedback: feedbackText,
        evaluatedAt: serverTimestamp(),
        evaluatedBy: currentUser.uid
      });
      
      // 2. Update the application status using our utility function
      const result = await updateApplicationStatus(
        applicationId,
        APPLICATION_STATUS.QUIZ_APPROVED,
        2, // Round 2
        ROUND_STATUS.PASSED,
        feedbackText,
        currentUser.uid
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update application status');
      }
      
      // 3. Update the local state
      setQuizSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'approved', feedback: feedbackText }
            : sub
        )
      );
      
      // 4. Close the modal and reset
      setShowDetailsModal(false);
      setSelectedSubmission(null);
      setFeedbackText('');
      
      alert('Quiz approved successfully!');
    } catch (error) {
      console.error('Error approving quiz:', error);
      alert('Failed to approve quiz: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleRejectQuiz = async (submissionId, applicationId) => {
    if (!feedbackText.trim()) {
      alert('Please provide feedback before rejecting.');
      return;
    }
    
    setProcessingAction(true);
    try {
      // 1. Update the quiz submission status
      await updateDoc(doc(db, 'quizSubmissions', submissionId), {
        status: 'rejected',
        feedback: feedbackText,
        evaluatedAt: serverTimestamp(),
        evaluatedBy: currentUser.uid
      });
      
      // 2. Update the application status using our utility function
      const result = await updateApplicationStatus(
        applicationId,
        APPLICATION_STATUS.QUIZ_REJECTED,
        2, // Round 2
        ROUND_STATUS.FAILED,
        feedbackText,
        currentUser.uid
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update application status');
      }
      
      // 3. Update the local state
      setQuizSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'rejected', feedback: feedbackText }
            : sub
        )
      );
      
      // 4. Close the modal and reset
      setShowDetailsModal(false);
      setSelectedSubmission(null);
      setFeedbackText('');
      
      alert('Quiz rejected successfully!');
    } catch (error) {
      console.error('Error rejecting quiz:', error);
      alert('Failed to reject quiz: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleSelectForInternship = async (submissionId, applicationId) => {
    if (!feedbackText.trim()) {
      alert('Please provide feedback before selecting for internship.');
      return;
    }
    
    setProcessingAction(true);
    try {
      // 1. Update the quiz submission status
      await updateDoc(doc(db, 'quizSubmissions', submissionId), {
        status: 'approved',
        feedback: feedbackText,
        evaluatedAt: serverTimestamp(),
        evaluatedBy: currentUser.uid
      });
      
      // 2. Update the application status using our utility function
      const result = await updateApplicationStatus(
        applicationId,
        APPLICATION_STATUS.SELECTED,
        2, // Round 2
        ROUND_STATUS.PASSED,
        feedbackText,
        currentUser.uid
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update application status');
      }
      
      // 3. Update the local state
      setQuizSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      
      // 4. Close the modal and reset
      setShowDetailsModal(false);
      setSelectedSubmission(null);
      setFeedbackText('');
      
      alert('Student selected for internship successfully!');
    } catch (error) {
      console.error('Error selecting for internship:', error);
      alert('Failed to select for internship: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };
  
  if (loading) {
    return (
      <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
        <p className="text-center">Loading quiz submissions...</p>
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
        <div>
          <h1 className="text-2xl font-bold">{internship?.title || 'Internship'}</h1>
          <p className="text-gray-600">{internship?.companyName || 'Company'}</p>
        </div>
        <button
          onClick={() => navigate('/faculty/dashboard')}
          className="text-primary hover:text-primary-dark"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Round 2 Quiz Submissions</h2>
            <p className="text-gray-600">{quizSubmissions.length} submissions received</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-l ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending_review')}
              className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 ${statusFilter === 'pending_review' ? 'bg-blue-100 text-blue-800' : ''}`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 ${statusFilter === 'approved' ? 'bg-green-100 text-green-800' : ''}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-r ${statusFilter === 'rejected' ? 'bg-red-100 text-red-800' : ''}`}
            >
              Rejected
            </button>
          </div>
        </div>
        
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No quiz submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map(submission => (
                  <tr key={submission.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                      <div className="text-sm text-gray-500">{submission.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        submission.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status === 'pending_review' ? 'Pending Review' :
                         submission.status === 'approved' ? 'Approved' :
                         submission.status === 'rejected' ? 'Rejected' : submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Quiz Details Modal */}
      {showDetailsModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Quiz Submission Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSubmission(null);
                    setFeedbackText('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Student Information</h4>
                <p><span className="font-medium">Name:</span> {selectedSubmission.studentName}</p>
                <p><span className="font-medium">Email:</span> {selectedSubmission.studentEmail}</p>
                <p><span className="font-medium">Submitted:</span> {
                  selectedSubmission.submittedAt ? 
                  new Date(selectedSubmission.submittedAt.seconds * 1000).toLocaleString() : 
                  'Unknown'
                }</p>
                <p><span className="font-medium">Status:</span> {
                  selectedSubmission.status === 'pending_review' ? 'Pending Review' :
                  selectedSubmission.status === 'approved' ? 'Approved' :
                  selectedSubmission.status === 'rejected' ? 'Rejected' : selectedSubmission.status
                }</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Quiz Answers</h4>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Project Experience</h5>
                    <p className="text-gray-700">{selectedSubmission.projectExperience || 'No response'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Technical Skills</h5>
                    <p className="text-gray-700">{selectedSubmission.technicalSkills || 'No response'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Teamwork Experience</h5>
                    <p className="text-gray-700">{selectedSubmission.teamworkExperience || 'No response'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Challenges Solved</h5>
                    <p className="text-gray-700">{selectedSubmission.challengesSolved || 'No response'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Career Goals</h5>
                    <p className="text-gray-700">{selectedSubmission.careerGoals || 'No response'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Additional Information</h5>
                    <p className="text-gray-700">{selectedSubmission.additionalInfo || 'No response'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Provide Feedback</h4>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback for the student here..."
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  disabled={processingAction}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                {selectedSubmission.status === 'pending_review' && (
                  <>
                    <button
                      onClick={() => handleRejectQuiz(selectedSubmission.id, selectedSubmission.applicationId)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      disabled={processingAction || !feedbackText.trim()}
                    >
                      {processingAction ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApproveQuiz(selectedSubmission.id, selectedSubmission.applicationId)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={processingAction || !feedbackText.trim()}
                    >
                      {processingAction ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleSelectForInternship(selectedSubmission.id, selectedSubmission.applicationId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={processingAction || !feedbackText.trim()}
                    >
                      {processingAction ? 'Processing...' : 'Select for Internship'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSubmission(null);
                    setFeedbackText('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                  disabled={processingAction}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluateQuizSubmissions;
