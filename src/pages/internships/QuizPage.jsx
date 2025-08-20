import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { APPLICATION_STATUS } from '../../utils/applicationUtils';
import { useAuth } from '../../context/AuthContext';

function QuizPage() {
  const { id: internshipId, applicationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [internship, setInternship] = useState(null);
  const [application, setApplication] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assignedTest, setAssignedTest] = useState(null);
  const [testData, setTestData] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(300);
  const [quizFinished, setQuizFinished] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const maxWarnings = 2;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setQuizFinished(true);

      if (!application || !application.id || !assignedTest || !testData) {
        setError('Essential quiz data is missing. Cannot submit.');
        setSubmitting(false);
        return;
      }

      let studentName = application?.studentName || '';
      if (!studentName && currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            studentName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          }
        } catch (error) {
          console.error('Error fetching student name:', error);
          studentName = currentUser.displayName || 'Unknown Student';
        }
      }

      let score = 0;
      const detailedQuestionData = questions.map(question => {
        const userAnswer = answers[question.id] || null;
        let isCorrect = false;
        if (userAnswer) {
          if (question.type === 'mcq' || question.type === 'multiple-choice') {
            const correctOption = question.options[question.correctAnswer];
            isCorrect = userAnswer === correctOption;
          } else if (question.type === 'text' || question.type === 'short-answer') {
            const userAnswerLower = userAnswer.toLowerCase().trim();
            isCorrect = (question.correctAnswers || []).some(answer => answer.toLowerCase().trim() === userAnswerLower);
          }
        }
        if (isCorrect) {
          score += question.points || 1;
        }
        return {
          id: question.id,
          question: question.question || question.text,
          userAnswer,
          isCorrect,
        };
      });

      const totalPossiblePoints = questions.reduce((total, q) => total + (q.points || 1), 0);
      const percentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

      const submissionData = {
        applicationId: application.id,
        internshipId: application.internshipId,
        studentId: currentUser.uid,
        studentName,
        testId: assignedTest.testId,
        testName: testData.title,
        questions: detailedQuestionData,
        score,
        totalPossiblePoints,
        percentage,
        submittedAt: serverTimestamp(),
        status: APPLICATION_STATUS.TEST_SUBMITTED,
      };

      // Create submission document
      const submissionDocRef = await addDoc(collection(db, 'quizSubmissions'), submissionData);
      console.log(`Quiz submission created with ID: ${submissionDocRef.id}`);

      // Update the single source of truth: the top-level application document
      const applicationRef = doc(db, 'applications', application.id);
      console.log(`Updating application document: /applications/${application.id}`);

      await updateDoc(applicationRef, {
        status: APPLICATION_STATUS.TEST_SUBMITTED,
        quizSubmissionId: submissionDocRef.id,
        quizScore: percentage,
        updatedAt: serverTimestamp(),
      });

      console.log('Application status updated successfully.');

      setSuccess('Quiz submitted successfully! Your results will be reviewed.');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(`Failed to submit quiz: ${err.message}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, application, assignedTest, testData, currentUser, questions, answers]);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!currentUser || !applicationId) {
        setError('User or application ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const appRef = doc(db, 'applications', applicationId);
        const appSnap = await getDoc(appRef);
        if (!appSnap.exists()) {
          setError('Application not found.');
          setLoading(false);
          return;
        }
        const appData = { id: appSnap.id, ...appSnap.data() };
        setApplication(appData);

        if (appData.status === 'quiz_completed') {
          setError('You have already completed the quiz for this application.');
          setLoading(false);
          return;
        }

        const validTestStatuses = ['test_assigned', 'test_in_progress'];
        if (!validTestStatuses.includes(appData.status)) {
          setError(`Your application status (${appData.status}) does not permit taking the quiz.`);
          setLoading(false);
          return;
        }

        const internshipRef = doc(db, 'internships', appData.internshipId);
        const internshipSnap = await getDoc(internshipRef);
        if (internshipSnap.exists()) {
          setInternship(internshipSnap.data());
        }

        const testsAssignedQuery = query(
          collection(db, 'testsAssigned'),
          where('applicationId', '==', applicationId),
          where('studentId', '==', currentUser.uid)
        );
        const testsAssignedSnapshot = await getDocs(testsAssignedQuery);

        if (testsAssignedSnapshot.empty) {
          setError('No test assigned for this application.');
          setLoading(false);
          return;
        }

        const assignmentData = { id: testsAssignedSnapshot.docs[0].id, ...testsAssignedSnapshot.docs[0].data() };
        setAssignedTest(assignmentData);

        const testDoc = await getDoc(doc(db, 'tests', assignmentData.testId));
        if (!testDoc.exists()) {
          setError('Assigned test could not be found.');
          setLoading(false);
          return;
        }

        const rawTestData = { id: testDoc.id, ...testDoc.data() };
        setTestData(rawTestData);
        setQuizTimeLeft((rawTestData.duration || 5) * 60);

        let questionsToProcess = rawTestData.questions;
        if (typeof questionsToProcess === 'string') {
          questionsToProcess = JSON.parse(questionsToProcess);
        }
        
        const shuffledQuestions = [...questionsToProcess].sort(() => Math.random() - 0.5).map(q => ({...q, id: doc(collection(db, 'questions')).id}));
        setQuestions(shuffledQuestions);

        const initialAnswers = {};
        shuffledQuestions.forEach(q => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);

      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('An unexpected error occurred while loading the quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [applicationId, currentUser, navigate]);

  useEffect(() => {
    if (loading || quizFinished || showDisclaimer) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        if (newCount > maxWarnings) {
          setWarningMessage('Quiz automatically submitted due to multiple tab switches.');
          setIsBlocked(true);
          handleSubmit();
        } else {
          setWarningMessage(`Warning ${newCount}/${maxWarnings}: Switching tabs is not allowed.`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, quizFinished, showDisclaimer, tabSwitchCount, handleSubmit]);

  useEffect(() => {
    if (loading || quizFinished || showDisclaimer) return;

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
  }, [loading, quizFinished, showDisclaimer, handleSubmit]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleSubmit();
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading quiz...</div>;
  }

  if (showDisclaimer) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Quiz Disclaimer & Rules</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Do not switch tabs or windows. After {maxWarnings} warnings, your quiz will be automatically submitted.</li>
            <li>Ensure you have a stable internet connection.</li>
            <li>Once you start, the timer will not stop.</li>
          </ul>
          <div className="flex justify-center">
            <button onClick={() => setShowDisclaimer(false)} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              I Understand, Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || success || isBlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">{success}</div>}
        {isBlocked && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{warningMessage}</div>}
        <Link to="/student/dashboard" className="btn-primary mt-4">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div className="text-center py-10">Loading question...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {warningMessage && <div className="fixed top-4 right-4 bg-yellow-100 border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">{warningMessage}</div>}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">{internship?.title || 'Quiz'}</h1>
          <div className="text-white bg-red-500 px-3 py-1 rounded-full font-mono">
            Time Left: {Math.floor(quizTimeLeft / 60).toString().padStart(2, '0')}:{(quizTimeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestionIndex + 1}. {currentQuestion.question || currentQuestion.text}
            </h3>
            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'mcq') && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswer(currentQuestion.id, option)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
            {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'text') && (
              <textarea
                rows={5}
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
              />
            )}
          </div>
          <div className="flex justify-between items-center mt-8">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;