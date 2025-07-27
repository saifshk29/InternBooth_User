import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, limit, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function QuizPage() {
  const params = useParams(); // Get all URL parameters
  const { id, applicationId } = params; // Extract id and applicationId
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // For debugging
  console.log('URL Parameters:', params);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [internship, setInternship] = useState(null);
  const [application, setApplication] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(30);
  const [assignedTest, setAssignedTest] = useState(null);
  const [testData, setTestData] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(300); // 5 minutes
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timer, setTimer] = useState(null);
  const [progress, setProgress] = useState({}); // New state to store quiz progress
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [inspectCount, setInspectCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [navigateAwayCount, setNavigateAwayCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const maxWarnings = 2; // Allow warnings per violation type, submit on the 11th violation

  // Function to handle visibility change (detect if user leaves the quiz page)
  const handleVisibilityChange = async () => {
    if (document.hidden && !loading && !quizFinished && !isBlocked) {
      console.warn('User navigated away from the quiz tab.');
      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        if (newCount > maxWarnings) {
          setWarningMessage('Error: You have switched tabs or windows too many times. Your quiz is being submitted.');
          setIsBlocked(true);
          handleSubmit();
          return newCount;
        } else {
          setWarningMessage(`Warning ${newCount}/${maxWarnings}: Do not switch tabs or windows during the quiz. Your progress has been saved.`);
          return newCount;
        }
      });
      await saveQuizProgress(true); // Save progress with in_progress flag
    }
  };

  // Save quiz progress to Firestore
  const saveQuizProgress = async (setInProgress = false) => {
    if (!application?.id || !currentUser?.uid) return;

    try {
      const progressRef = doc(db, 'applications', application.id);
      const progressData = {
        lastQuestionIndex: currentQuestionIndex,
        answers: answers,
        timeLeft: quizTimeLeft,
        status: setInProgress ? 'test_in_progress' : application.status,
        lastUpdated: serverTimestamp()
      };

      await updateDoc(progressRef, {
        quizProgress: progressData,
        status: setInProgress ? 'test_in_progress' : application.status
      });

      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Load saved progress
  const loadProgress = async () => {
    if (!application?.id || !currentUser?.uid) return;

    try {
      const progressRef = doc(db, 'applications', application.id);
      const progressSnap = await getDoc(progressRef);
      const progressData = progressSnap.data()?.quizProgress;

      if (progressData && application.status === 'test_in_progress') {
        setCurrentQuestionIndex(progressData.lastQuestionIndex || 0);
        setAnswers(progressData.answers || {});
        setQuizTimeLeft(progressData.timeLeft || quizTimeLeft);
        console.log('Progress loaded successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading progress:', error);
      return false;
    }
  };
  
  useEffect(() => {
    // Function to fetch quiz data and load progress
    const fetchQuizData = async () => {
      const appId = applicationId || id;
      console.log('[DEBUG] URL Parameters:', params);
      console.log('[DEBUG] Extracted id:', id);
      console.log('[DEBUG] Extracted applicationId:', applicationId);
      console.log('[DEBUG] Calculated appId:', appId);
      console.log('[DEBUG] currentUser:', currentUser);
      console.log('[DEBUG] currentUser?.uid:', currentUser?.uid);

      if (!appId || !currentUser?.uid) {
        setError('Application ID or User ID is missing.');
        setLoading(false);
        return;
      }

      try {
        // Try to load saved progress first
        const hasProgress = await loadProgress();
        
        // Hide navbar and footer
        const navbar = document.getElementById('navbar');
        const footer = document.getElementById('footer');
        if (navbar) navbar.style.display = 'none';
        if (footer) footer.style.display = 'none';

        if (!hasProgress) {
          // Prevent common cheating methods
          document.addEventListener('contextmenu', (e) => e.preventDefault());
          document.addEventListener('copy', (e) => e.preventDefault());
          document.addEventListener('cut', (e) => e.preventDefault());
          document.addEventListener('paste', (e) => e.preventDefault());

          // Add visibility change listener
          document.addEventListener('visibilitychange', handleVisibilityChange);
        }
      } catch (error) {
        console.error('Error in fetchQuizData:', error);
      }

      setLoading(true);
      setError('');

      try {
        let applicationRef;
        let applicationSnap;
        console.log('DEBUG: Starting application fetch with appId:', appId, 'and internshipId param:', id);
        
        // Check if we have applicationId and internshipId in URL params - this is the most direct path
        if (applicationId && id) {
          console.log('DEBUG: We have both applicationId and internshipId in URL, trying direct path first');
          // Try the direct path first if we have both parameters
          const directRef = doc(db, 'internships', id, 'applications', applicationId);
          const directSnap = await getDoc(directRef);
          
          if (directSnap.exists()) {
            console.log('DEBUG: Found application via direct path! Data:', directSnap.data());
            console.log('DEBUG: Application status from direct path:', directSnap.data().status);
            // Use this as our application data
            applicationRef = directRef;
            applicationSnap = directSnap;
          } else {
            console.log('DEBUG: Direct path failed, application not found at internships/' + id + '/applications/' + applicationId);
          }
        } else {
          console.log('DEBUG: Missing either applicationId or internshipId in URL params');
        }
        
        // If we don't have a valid snapshot yet, try the main collection
        if (!applicationSnap || !applicationSnap.exists()) {
          // 1. Fetch Application Data - first try in the main applications collection
          applicationRef = doc(db, 'applications', appId);
          applicationSnap = await getDoc(applicationRef);
          console.log('DEBUG: Trying to fetch application from main collection with ID:', appId);
          
          // If not found in main collection, try to find the internship ID from the URL params
          if (!applicationSnap.exists() && id) {
            console.log('DEBUG: Application not found in main collection, trying internships subcollection with internshipId:', id);
            applicationRef = doc(db, 'internships', id, 'applications', appId);
            applicationSnap = await getDoc(applicationRef);
            
            if (applicationSnap.exists()) {
              console.log('DEBUG: Found application in internships subcollection! Status:', applicationSnap.data().status);
            }
          }
        }
        
        // If still not found, try querying all internships to find the application
        if (!applicationSnap.exists()) {
          console.log('Application not found in specific internship, trying to find in all internships');
          // Get all internships
          const internshipsRef = collection(db, 'internships');
          const internshipsSnap = await getDocs(internshipsRef);
          
          // Loop through each internship to find the application
          let found = false;
          for (const internshipDoc of internshipsSnap.docs) {
            const internshipId = internshipDoc.id;
            const appInInternshipRef = doc(db, 'internships', internshipId, 'applications', appId);
            const appInInternshipSnap = await getDoc(appInInternshipRef);
            
            if (appInInternshipSnap.exists()) {
              console.log('Found application in internship:', internshipId);
              applicationSnap = appInInternshipSnap;
              found = true;
              break;
            }
          }
          
          if (!found) {
            console.error('Application not found in any internship collection');
            setError('Application not found in any internship. Please contact support.');
            setLoading(false);
            return;
          }
        }
        
        if (!applicationSnap.exists()) {
          setError('Application not found after searching all possible locations.');
          setLoading(false);
          return;
        }
        const applicationData = { id: applicationSnap.id, ...applicationSnap.data() };
        setApplication(applicationData);
        console.log('Using application data:', applicationData);

        // 2. Fetch Internship Data (if needed)
        if (applicationData.internshipId) {
          try {
            const internshipRef = doc(db, 'internships', applicationData.internshipId);
            const internshipSnap = await getDoc(internshipRef);
            if (internshipSnap.exists()) {
              const internshipData = { id: internshipSnap.id, ...internshipSnap.data() };
              setInternship(internshipData);
              console.log('Found internship data:', internshipData);
            } else {
              console.error('Internship not found for application:', applicationData.internshipId);
            }
          } catch (err) {
            console.error('Error fetching internship data:', err);
          }
        }

        // 3. Check Test Assignment Status & Fetch Test
        console.log('Application status:', applicationData.status);
        let testIdToFetch = null;
        let assignmentStatus = null;

        // Accept various status values that indicate a test is assigned
        const validTestStatuses = ['test_assigned', 'test_assign', 'test_in_progress', 'form_approved'];
        if (validTestStatuses.includes(applicationData.status)) {
          console.log('Application status confirms assigned test:', applicationData.status);
          // Check if the student has a test assigned for this application
          // First, try to find test assignments by applicationId
          console.log('Searching for test assignments with applicationId:', applicationId || appId);
          let testsAssignedQuery = query(
            collection(db, 'testsAssigned'),
            where('applicationId', '==', applicationId || appId),
            where('studentId', '==', currentUser.uid)
          );
          let testsAssignedSnapshot = await getDocs(testsAssignedQuery);
          
          // If no results, try searching by internshipId and studentId
          if (testsAssignedSnapshot.empty && applicationData.internshipId) {
            console.log('No test found by applicationId, trying internshipId:', applicationData.internshipId);
            testsAssignedQuery = query(
              collection(db, 'testsAssigned'),
              where('internshipId', '==', applicationData.internshipId),
              where('studentId', '==', currentUser.uid)
            );
            testsAssignedSnapshot = await getDocs(testsAssignedQuery);
          }
          
          // If still no results, try searching just by studentId
          if (testsAssignedSnapshot.empty) {
            console.log('No test found by applicationId or internshipId, trying just studentId');
            testsAssignedQuery = query(
              collection(db, 'testsAssigned'),
              where('studentId', '==', currentUser.uid),
              limit(1)
            );
            testsAssignedSnapshot = await getDocs(testsAssignedQuery);
          }
          
          // If we have a testId directly in the application document, use that
          if (testsAssignedSnapshot.empty && applicationData.testId) {
            console.log('Using testId directly from application document:', applicationData.testId);
            testIdToFetch = applicationData.testId;
          } else if (testsAssignedSnapshot.empty) {
            console.log('No test assigned for this application after all queries');
            setError(
              <div className="text-center">
                <p className="text-xl font-semibold mb-4">No test has been assigned for this application.</p>
                <p className="mb-6">Please wait for the faculty to assign a test or contact them if you believe this is an error.</p>
                <p className="mb-2">You must complete and pass Round 1 (form submission) before proceeding to Round 2 (quiz).</p>
                <Link to="/student/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Return to Dashboard
                </Link>
              </div>
            );
            setLoading(false);
            return;
          } else {
            // We found a test assignment!
            console.log('Found test assignment:', testsAssignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            const assignmentDoc = testsAssignedSnapshot.docs[0];
            const assignmentData = { id: assignmentDoc.id, ...assignmentDoc.data() };
            setAssignedTest(assignmentData);
            console.log('Set assigned test:', assignmentData);
            
            // Use the testId from the assignment
            testIdToFetch = assignmentData.testId;
            console.log('Will fetch test with ID:', testIdToFetch);
          }
        } else {
          console.log('Application status not valid for quiz:', applicationData.status);
          
          // Create a debug message for the console
          console.log('DEBUG INFORMATION:');
          console.log('- Application ID:', applicationData.id);
          console.log('- Current status:', applicationData.status);
          console.log('- Valid statuses:', validTestStatuses);
          console.log('- Application data:', applicationData);
          
          setError(
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">You are not currently in the quiz stage for this application.</p>
              <p className="mb-6">Current status: <span className="font-semibold">{applicationData.status}</span></p>
              <p className="mb-2">The application must be in one of these statuses to access the quiz: test_assigned, test_assign, test_in_progress, or form_approved.</p>
              <p className="mb-6">Please wait for the faculty to approve your Round 1 form and assign a test, or contact them if you believe this is an error.</p>
              <details className="mb-4 text-left p-2 border rounded">
                <summary className="cursor-pointer text-sm text-gray-600">Technical Details (for support)</summary>
                <div className="p-2 text-xs text-gray-600">
                  <p>Application ID: {applicationData.id}</p>
                  <p>Internship ID: {applicationData.internshipId || 'Not found'}</p>
                  <p>Status: {applicationData.status}</p>
                  <p>Data Path: {applicationRef?.path || 'Unknown'}</p>
                  <p>Last Updated: {applicationData.updatedAt?.toDate?.().toString() || 'Unknown'}</p>
                </div>
              </details>
              <Link to="/student/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </Link>
            </div>
          );
          setLoading(false);
          return;
        }

        if (!testIdToFetch) {
          setError('Could not determine the test ID for this assignment.');
          setLoading(false);
          return;
        }

        // Handle cases where student tries to re-access quiz (e.g., completed, maybe started?)
        if (assignmentStatus === 'completed' || applicationData.status === 'quiz_completed') {
          setError(
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">You have already completed the Round 2 quiz for this application.</p>
              <p className="mb-6">Please check your dashboard for updates on your application status.</p>
              <Link to="/student/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </Link>
            </div>
          );
          setLoading(false);
          return;
        }

        // --- Fetch the actual test data --- 
        console.log(`Fetching test with ID: ${testIdToFetch} from tests collection`);
        const testDoc = await getDoc(doc(db, 'tests', testIdToFetch));

        if (!testDoc.exists()) {
          console.error(`Test document ${testIdToFetch} not found!`);
          setError('The assigned test could not be found.');
          setLoading(false);
          return;
        }

        const rawTestData = { id: testDoc.id, ...testDoc.data() };
        console.log('Raw Test Data fetched:', rawTestData);
        console.log('Type of questions field:', typeof rawTestData.questions);
        console.log('Value of questions field:', rawTestData.questions);
        setTestData(rawTestData); // Set state with the fetched data

        const testDuration = rawTestData.duration || 5; // Default to 5 minutes if not specified
        console.log(`Quiz time set to: ${testDuration} minutes`);
        setQuizTimeLeft(testDuration * 60); // Store in seconds

        // 4. Process Questions
        if (!rawTestData.questions || !Array.isArray(rawTestData.questions)) {
          console.error('No questions found or questions format is invalid in test:', testIdToFetch);
          setError("No questions found or format is invalid for this test.");
          setLoading(false);
          return;
        }

        try {
          console.log('Step 9: Processing questions');
          let questionsToProcess = rawTestData.questions;

          // Fallback for stringified JSON (should ideally be fixed in DB)
          if (typeof questionsToProcess === 'string') {
            console.warn('Questions field is a string, attempting to parse JSON.');
            try {
              questionsToProcess = JSON.parse(questionsToProcess);
            } catch (parseError) {
              console.error('Failed to parse questions string:', parseError);
              setError('Error loading quiz questions format.');
              setLoading(false);
              return;
            }
          }

          if (!Array.isArray(questionsToProcess)) {
            console.error('Parsed questions is not an array:', questionsToProcess);
            setError('Invalid quiz questions format after potential parse.');
            setLoading(false);
            return;
          }

          console.log('Parsed questions:', questionsToProcess);

          const shuffledQuestions = [...questionsToProcess].sort(() => Math.random() - 0.5);
          console.log('Shuffled questions:', shuffledQuestions);

          const processedQuestions = shuffledQuestions.map((q, index) => {
            console.log(`Processing question index ${index}:`, q);
            if ((q.type === 'mcq' || q.type === 'multiple-choice') && Array.isArray(q.options)) {
              console.log(` -> Question ${index} is MCQ/MultipleChoice with options.`);
              const originalCorrectAnswer = q.correctAnswer;
              console.log(` -> Original correct answer: ${originalCorrectAnswer} (type: ${typeof originalCorrectAnswer})`);
              const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
              console.log(` -> Original options:`, q.options);
              console.log(` -> Shuffled options:`, shuffledOptions);
              let newCorrectAnswerIndex = -1;
              if (typeof originalCorrectAnswer === 'number' && originalCorrectAnswer >= 0 && originalCorrectAnswer < q.options.length) {
                const correctOptionText = q.options[originalCorrectAnswer];
                console.log(` -> Correct option text (from original index ${originalCorrectAnswer}): ${correctOptionText}`);
                newCorrectAnswerIndex = shuffledOptions.findIndex(opt => opt === correctOptionText);
                console.log(` -> New correct answer index (found in shuffled): ${newCorrectAnswerIndex}`);
              } else if (typeof originalCorrectAnswer === 'string') {
                console.log(` -> Correct option text (from string): ${originalCorrectAnswer}`);
                newCorrectAnswerIndex = shuffledOptions.findIndex(opt => opt === originalCorrectAnswer);
                console.log(` -> New correct answer index (found in shuffled): ${newCorrectAnswerIndex}`);
              } else {
                console.warn(` -> Could not determine correct answer logic for type ${typeof originalCorrectAnswer}`);
              }

              // Return the modified question object for MCQ
              return {
                ...q,
                options: shuffledOptions,
                correctAnswer: newCorrectAnswerIndex
              };
            } 
            // If not MCQ or options are invalid, return the question as is
            return q;
          }); // End of processedQuestions.map()

          console.log('Finished processing questions. Result:', processedQuestions);

          // Set state after successful processing
          setQuestions(processedQuestions);
          console.log('State updated: questions');

          const initialAnswers = {};
          processedQuestions.forEach((q, index) => {
            initialAnswers[index] = null;
          });
          setAnswers(initialAnswers);
          console.log('State updated: answers');

          setQuizFinished(false);
          console.log('State updated: quizFinished to false');

          setLoading(false);
          console.log('State updated: loading to false - UI should now render quiz');

        } catch (err) {
          // Catch errors during question processing
          console.error('Error processing questions:', err);
          setError('Error loading quiz questions.');
          setLoading(false);
          // No return here, outer catch will handle final loading state
        } // End of inner try...catch for question processing

      } catch (error) {
        // Catch errors during initial data fetching (application, assignment, test doc)
        console.error('Error in fetchQuizData:', error);
        // Ensure error is set if not already set by inner catch
        if (!error) {
          setError('An unexpected error occurred while loading the quiz.');
        } 
        setLoading(false);
      } // End of outer try...catch
      // --- End of fetchQuizData async logic --- 
    };

    fetchQuizData();

    // Cleanup function
    return () => {
      // Use consistent functions for event listeners
      const preventDefaultHandler = (e) => e.preventDefault();
      document.removeEventListener('contextmenu', preventDefaultHandler);
      document.removeEventListener('copy', preventDefaultHandler);
      document.removeEventListener('cut', preventDefaultHandler);
      document.removeEventListener('paste', preventDefaultHandler);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Show navbar and footer after the quiz
      const navbar = document.getElementById('navbar');
      const footer = document.getElementById('footer');
      if (navbar) navbar.style.display = 'block';
      if (footer) footer.style.display = 'block';
    };
  }, [id, applicationId, currentUser]); // Dependencies: id and applicationId from useParams, and currentUser

  // Setup event listeners for anti-cheating measures
  useEffect(() => {
    if (loading || quizFinished || isBlocked) return;

    // Prevent right-click (context menu) - treating as screenshot attempt
    const preventContextMenu = (e) => {
      e.preventDefault();
      setScreenshotCount(prev => {
        const newCount = prev + 1;
        if (newCount > maxWarnings) {
          setWarningMessage('Error: You have attempted to take screenshots or access context menu too many times. Your quiz is being submitted.');
          setIsBlocked(true);
          handleSubmit();
        } else {
          setWarningMessage(`Warning ${newCount}/${maxWarnings}: Right-click and screenshots are disabled during the quiz.`);
        }
        return newCount;
      });
    };

    // Prevent common dev tools shortcuts (Ctrl+Shift+I, F12)
    const preventDevTools = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        e.preventDefault();
        setInspectCount(prev => {
          const newCount = prev + 1;
          if (newCount > maxWarnings) {
            setWarningMessage('Error: You have attempted to access developer tools too many times. Your quiz is being submitted.');
            setIsBlocked(true);
            handleSubmit();
          } else {
            setWarningMessage(`Warning ${newCount}/${maxWarnings}: Developer tools are disabled during the quiz.`);
          }
          return newCount;
        });
      }
    };

    // Detect navigating away or closing the window
    const handleBeforeUnload = async (e) => {
      if (!loading && !quizFinished && !isBlocked) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be saved, but repeated attempts to leave may result in quiz submission.';
        setNavigateAwayCount(prev => {
          const newCount = prev + 1;
          if (newCount > maxWarnings) {
            setWarningMessage('Error: You have attempted to navigate away or close the window too many times. Your quiz is being submitted.');
            setIsBlocked(true);
            handleSubmit();
          } else {
            setWarningMessage(`Warning ${newCount}/${maxWarnings}: Navigating away or closing the window is not allowed during the quiz.`);
          }
          return newCount;
        });
        await saveQuizProgress(true);
      }
    };

    // Detect back button navigation
    const handlePopState = async (e) => {
      if (!loading && !quizFinished && !isBlocked) {
        e.preventDefault();
        setNavigateAwayCount(prev => {
          const newCount = prev + 1;
          if (newCount > maxWarnings) {
            setWarningMessage('Error: You have attempted to navigate away too many times. Your quiz is being submitted.');
            setIsBlocked(true);
            handleSubmit();
          } else {
            setWarningMessage(`Warning ${newCount}/${maxWarnings}: Using the back button is not allowed during the quiz.`);
          }
          return newCount;
        });
        await saveQuizProgress(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, null, window.location.href);
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventDevTools);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    // Push initial state to enable popstate detection
    window.history.pushState(null, null, window.location.href);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventDevTools);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loading, quizFinished, isBlocked]);

  // Timer for the entire quiz
  useEffect(() => {
    if (loading || quizFinished) return;
    const timer = setInterval(() => {
      setQuizTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, quizFinished]); // Removed handleSubmit from deps to avoid circular dependency

  // Timer for individual questions
  useEffect(() => {
    if (loading || quizFinished || !questions[currentQuestionIndex]) return;
    
    // Set question timer based on timeAllowed for the current question (convert minutes to seconds)
    const timeAllowed = questions[currentQuestionIndex].timeAllowed || 1; // Default to 1 minute if not specified
    setQuestionTimeLeft(timeAllowed * 60);
    
    const questionTimer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(questionTimer);
          handleNextQuestion(); // Auto-move to next question when time's up
          // If there's a next question, set its time; otherwise, keep 0
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < questions.length) {
            return (questions[nextIndex].timeAllowed || 1) * 60;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(questionTimer);
  }, [currentQuestionIndex, loading, quizFinished, questions]);

  // Clear warning message after a few seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage('');
      }, 5000); // Show warning for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  const handleAnswer = async (questionId, answerId) => {
    setSelectedAnswer(answerId);
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
    await saveQuizProgress();
  };

  const handleNextButton = () => {
    setSelectedAnswer(null);
    handleNextQuestion();
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionTimeLeft(30); // Reset timer for next question
      setSelectedAnswer(null); // Clear selected answer
      await saveQuizProgress();
    } else {
      setQuizFinished(true);
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      console.log('Submitting quiz answers:', answers);

      // Validate that we have an application object with an ID
      if (!application || !application.id) {
        console.error('Application data is missing or invalid:', application);
        setError('Application data is missing. Please try again or contact support.');
        setSubmitting(false);
        return;
      }

      // Try to save final progress before submission
      try {
        await saveQuizProgress();
      } catch (progressError) {
        console.warn('Could not save final progress, but continuing with submission:', progressError);
      }

      // Get student's full name from database if not already available
      let studentName = application?.studentName || '';
      if (!studentName && currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            studentName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            console.log('Retrieved student name from user profile:', studentName);
          }
        } catch (error) {
          console.error('Error fetching student name:', error);
          // Fall back to display name if available
          studentName = currentUser.displayName || 'Unknown Student';
        }
      }

      // Calculate score
      let score = 0;
      let totalQuestions = questions.length;

      console.log('Evaluating answers for', totalQuestions, 'questions');

      const detailedQuestionData = questions.map(question => {
        const userAnswer = answers[question.id];
        console.log(`Checking question ${question.id}:`, question.question || question.text);
        console.log('User answer:', userAnswer);
        console.log('Correct answer:', question.correctAnswer);
        console.log('Correct answer index (for MCQ):', question._correctAnswerIndex);

        let isCorrect = false;
        // Skip unanswered questions
        if (userAnswer === undefined || userAnswer === null) {
          console.log('Question skipped - no answer');
        } else {
          if (question.type === 'mcq' || question.type === 'multiple-choice') {
            if (question._correctAnswerIndex !== undefined) {
              const correctOption = question.options[question._correctAnswerIndex];
              isCorrect = userAnswer === correctOption;
              if (isCorrect) console.log('Correct MCQ answer!');
            } else if (typeof question.correctAnswer === 'number') {
              const correctOptionIndex = question.correctAnswer;
              const correctOption = question.options[correctOptionIndex];
              isCorrect = userAnswer === correctOption;
              if (isCorrect) console.log('Correct MCQ answer by index!');
            } else {
              isCorrect = userAnswer === question.correctAnswer;
              if (isCorrect) console.log('Correct MCQ answer by direct comparison!');
            }
          } else if (question.type === 'text' || question.type === 'short-answer') {
            if (Array.isArray(question.correctAnswers)) {
              const userAnswerLower = userAnswer.toLowerCase().trim();
              isCorrect = question.correctAnswers.some(
                answer => answer.toLowerCase().trim() === userAnswerLower
              );
              if (isCorrect) console.log('Correct text answer from array!');
            } else if (typeof question.correctAnswer === 'string') {
              const userAnswerLower = userAnswer.toLowerCase().trim();
              const correctAnswerLower = question.correctAnswer.toLowerCase().trim();
              isCorrect = userAnswerLower === correctAnswerLower || userAnswerLower.includes(correctAnswerLower);
              if (isCorrect) console.log('Correct text answer!');
            }
          }
        }

        if (isCorrect) {
          score += question.points || 1;
        }

        // Ensure all fields have default values to prevent undefined
        return {
          id: question.id || '',
          question: question.question || question.text || 'No question text',
          type: question.type || 'unknown',
          options: question.options || [],
          correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : null,
          correctAnswerIndex: question._correctAnswerIndex !== undefined ? question._correctAnswerIndex : null,
          points: question.points || 1,
          userAnswer: userAnswer || null,
          isCorrect: isCorrect // Explicitly include the calculated correctness
        };
      });

      // Calculate total possible points
      const totalPossiblePoints = questions.reduce((total, question) => {
        return total + (question.points || 1);
      }, 0);

      const percentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

      console.log('Submitting quiz with score:', score, 'out of', totalPossiblePoints, '(', percentage, '%) for application:', application.id);

      // Log the assigned test for debugging
      console.log('Assigned test data:', assignedTest);

      // Create a submission record in the quizSubmissions collection
      const submissionData = {
        applicationId: application.id,
        studentId: currentUser.uid,
        studentName: studentName || 'Unknown Student',
        studentEmail: currentUser.email || application?.studentEmail || 'Unknown Email',
        testId: assignedTest?.testId || application?.testId || 'unknown',
        testName: assignedTest?.testName || testData?.name || 'Unknown Test',
        internshipId: internship?.id || application?.internshipId || 'unknown',
        internshipTitle: internship?.jobRole || 'Unknown Internship',
        questionData: detailedQuestionData, // Use the array calculated above
        score: score,
        totalPossiblePoints: totalPossiblePoints,
        percentage: percentage,
        submittedAt: serverTimestamp(), // Add timestamp
        status: 'pending' // Initial status for admin review
      };

      console.log('Final submission data:', submissionData);

      // Add the submission to Firestore
      const submissionsRef = collection(db, 'quizSubmissions');
      const submissionDocRef = await addDoc(submissionsRef, submissionData);
      console.log('Submission saved with ID:', submissionDocRef.id);

      // Update application status to 'quiz_completed' in the subcollection
      if (!application.internshipId) { 
        console.error('Critical error: application.internshipId is missing. Cannot update status in subcollection.');
        setError('An critical error occurred (missing internship context). Please contact support.');
        setSubmitting(false);
        return;
      }
      if (!application.id) { 
         console.error('Critical error: application.id is missing. Cannot update status in subcollection.');
         setError('An critical error occurred (missing application context). Please contact support.');
         setSubmitting(false);
         return;
      }

      try {
        // First, try to get the existing document in the subcollection
        const appDocRef = doc(db, 'internships', application.internshipId, 'applications', application.id);
        const appDocSnap = await getDoc(appDocRef);
        
        // Prepare the data to write
        const appData = {
          status: 'quiz_completed',
          quizSubmissionId: submissionDocRef.id,
          score: percentage,
          updatedAt: serverTimestamp()
        };
        
        if (!appDocSnap.exists()) {
          // Document doesn't exist in subcollection, create it with setDoc
          // Include all necessary fields from the original application
          console.log('Application document not found in subcollection. Creating it now...');
          
          // Get the original application data from the top-level collection if needed
          const originalAppRef = doc(db, 'applications', application.id);
          const originalAppSnap = await getDoc(originalAppRef);
          
          if (originalAppSnap.exists()) {
            // Merge original data with our updates
            const originalData = originalAppSnap.data();
            await setDoc(appDocRef, {
              ...originalData,  // Copy all fields from original application
              ...appData,      // Override with our updates
              studentId: application.studentId || originalData.studentId,
              internshipId: application.internshipId
            });
            console.log('Created application document in subcollection with data from original application');
          } else {
            // No original data found, create with minimal required fields
            await setDoc(appDocRef, {
              ...appData,
              studentId: application.studentId,
              internshipId: application.internshipId,
              appliedAt: application.appliedAt || serverTimestamp(),
              currentRound: application.currentRound || 2, // Updated to Round 2
              rounds: application.rounds || []
            });
            console.log('Created application document in subcollection with minimal data');
          }
        } else {
          // Document exists, just update it
          await updateDoc(appDocRef, appData);
          console.log('Updated existing application document in subcollection');
        }
        
        console.log(`Application status updated to quiz_completed in internships/${application.internshipId}/applications/${application.id}`);
      } catch (error) {
        console.error('Error updating application in subcollection:', error);
        throw new Error(`Failed to update application status: ${error.message}`);
      }

      // Set quiz finished state and show success message
      setQuizFinished(true);
      setSuccess('Round 2 quiz submitted successfully! Your results will be reviewed.');

    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(`Failed to submit quiz: ${error.message}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const saveProgress = async () => {
    if (!application || !application.id) {
      console.error('Application data is missing or invalid:', application);
      setError('Application data is missing. Please try again or contact support.');
      return;
    }

    try {
      console.log('Saving quiz progress for application:', application.id);
      console.log('Current question index:', currentQuestionIndex);
      console.log('Current answers:', answers);

      // Create a clean copy of the answers object to avoid any circular references
      const cleanAnswers = {};
      Object.keys(answers).forEach(key => {
        if (answers[key] !== undefined && answers[key] !== null) {
          cleanAnswers[key] = answers[key];
        }
      });

      // Create the progress object
      const progressData = {
        currentQuestionIndex,
        answers: cleanAnswers,
        timestamp: new Date().toISOString() // Add timestamp for debugging
      };

      console.log('Saving progress data:', progressData);

      // Update the application document with the progress
      const applicationRef = doc(db, 'applications', application.id);
      await updateDoc(applicationRef, {
        progress: progressData,
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setProgress(progressData);
      console.log('Progress saved successfully');

      return true; // Return success
    } catch (error) {
      console.error('Error saving progress:', error);
      // Don't set error state here as it would interrupt the quiz
      // Just log the error and return false
      return false;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center">Loading quiz...</p>
      </div>
    );
  }

  if (showDisclaimer) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Quiz Disclaimer & Rules</h2>
          <div className="text-gray-700 mb-6">
            <p className="mb-2">Please read the following rules carefully before starting the quiz:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do not switch tabs or windows during the quiz. You will receive warnings, and after {maxWarnings} violations, your quiz will be automatically submitted.</li>
              <li>Accessing developer tools or attempting to take screenshots is prohibited and will result in warnings and potential quiz submission.</li>
              <li>Your progress will be saved periodically, but navigating away from this page may affect your quiz.</li>
              <li>Ensure you have a stable internet connection and a quiet environment to complete the quiz.</li>
            </ul>
            <p className="mt-2">By proceeding, you agree to adhere to these rules. Violation of these rules may result in disqualification.</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowDisclaimer(false)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              I Understand, Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="flex justify-center">
          <Link to="/home" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
            {success}
          </div>
          <Link to="/home" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Your quiz has been automatically submitted due to multiple violations of quiz rules. You cannot access this quiz again.</p>
        </div>
        <div className="flex justify-center">
          <Link to="/home" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show only the current question
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div id="quiz-container" className="max-w-4xl mx-auto px-4 py-8">
      {warningMessage && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">
          {warningMessage}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">
              Quiz: {internship?.title}
            </h1>
            <div className="text-white bg-red-500 px-3 py-1 rounded-full font-mono">
              Time Left: {questionTimeLeft}s
            </div>
            <div className="text-white bg-red-500 px-3 py-1 rounded-full font-mono">
              Quiz Time Left: {Math.floor(quizTimeLeft / 60).toString().padStart(2, '0')}:{(quizTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <p className="mt-2 text-sm">
            Answer the question within 30 seconds. You cannot move to the next or previous question manually.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={e => e.preventDefault()}>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                {currentQuestionIndex + 1}. {currentQuestion.question || currentQuestion.text}
              </h3>
              {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'mcq') && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-start">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={typeof option === 'string' ? option : option.id}
                        checked={selectedAnswer === (typeof option === 'string' ? option : option.id)}
                        onChange={() => handleAnswer(currentQuestion.id, typeof option === 'string' ? option : option.id)}
                        className="mt-1 mr-3"
                        disabled={questionTimeLeft === 0}
                      />
                      <span>{typeof option === 'string' ? option : option.text}</span>
                    </label>
                  ))}
                </div>
              )}
              {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'text') && (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                    disabled={questionTimeLeft === 0}
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-8">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <button
                type="button"
                className={`btn-primary ${(!selectedAnswer || questionTimeLeft === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedAnswer || questionTimeLeft === 0}
                onClick={handleNextButton}
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuizPage; 