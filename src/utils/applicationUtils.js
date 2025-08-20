import { doc, updateDoc, getDoc, setDoc, serverTimestamp, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Application status constants
 */
export const APPLICATION_STATUS = {
  // Initial application
  FORM_PENDING: 'form_pending',
  
  // Round 1 statuses
  FORM_SUBMITTED: 'form_submitted',
  FORM_APPROVED: 'form_approved',
  FORM_REJECTED: 'form_rejected',
  
  // Round 2 statuses
  TEST_ASSIGNED: 'test_assigned',
  TEST_SUBMITTED: 'test_submitted',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_APPROVED: 'quiz_approved',
  QUIZ_REJECTED: 'quiz_rejected',
  
  // Final statuses
  SELECTED: 'selected',
  OFFER_ACCEPTED: 'offer_accepted',
  REJECTED: 'rejected'
};

/**
 * Round status constants
 */
export const ROUND_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed'
};

/**
 * Updates an application's status and round information
 * @param {string} applicationId - The application document ID
 * @param {string} newStatus - The new application status
 * @param {number} roundNumber - The round number (1 or 2)
 * @param {string} roundStatus - The status of the round (passed, failed, pending)
 * @param {string} feedback - Optional feedback for the round
 * @param {string} adminId - ID of the admin who evaluated the application
 * @returns {Promise<void>}
 */
export const updateApplicationStatus = async (
  applicationId,
  newStatus,
  roundNumber,
  roundStatus,
  feedback = '',
  adminId = null
) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    const appDoc = await getDoc(appRef);
    
    if (!appDoc.exists()) {
      throw new Error('Application not found');
    }
    
    const appData = appDoc.data();
    const internshipId = appData.internshipId;
    const studentId = appData.studentId;
    
    // Create or update the round information
    const rounds = appData.rounds || [];
    const existingRoundIndex = rounds.findIndex(r => r.roundNumber === roundNumber);
    
    const roundData = {
      roundNumber,
      status: roundStatus,
      feedback: feedback || '',
      evaluatedAt: serverTimestamp(),
      evaluatedBy: adminId
    };
    
    if (existingRoundIndex >= 0) {
      rounds[existingRoundIndex] = { ...rounds[existingRoundIndex], ...roundData };
    } else {
      rounds.push(roundData);
    }
    
    // Update the application document
    const updateData = {
      status: newStatus,
      currentRound: roundNumber,
      rounds,
      updatedAt: serverTimestamp()
    };
    
    // Add specific timestamp based on status
    if (newStatus === APPLICATION_STATUS.SELECTED) {
      updateData.selectedAt = serverTimestamp();
    } else if (newStatus === APPLICATION_STATUS.REJECTED) {
      updateData.rejectedAt = serverTimestamp();
    }
    
    await updateDoc(appRef, updateData);
    
    // Update the user's application summary
    await updateUserApplicationSummary(studentId, internshipId, newStatus, roundNumber, roundStatus);
    
    // Update aggregate statistics
    await updateRoundResults(internshipId, roundNumber, roundStatus);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates the user's application summary for easy access in their dashboard
 * @param {string} userId - The user's ID
 * @param {string} internshipId - The internship ID
 * @param {string} status - The current application status
 * @param {number} currentRound - The current round number
 * @param {string} roundStatus - The status of the current round
 * @returns {Promise<void>}
 */
export const updateUserApplicationSummary = async (
  userId,
  internshipId,
  status,
  currentRound,
  roundStatus
) => {
  try {
    // Get internship details
    const internshipRef = doc(db, 'internships', internshipId);
    const internshipDoc = await getDoc(internshipRef);
    
    if (!internshipDoc.exists()) {
      throw new Error('Internship not found');
    }
    
    const internshipData = internshipDoc.data();
    
    // Create or update the application summary in the user's document
    const summaryRef = doc(db, 'users', userId, 'applicationSummaries', internshipId);
    
    // Get existing summary if it exists
    const summaryDoc = await getDoc(summaryRef);
    const existingRoundResults = summaryDoc.exists() ? summaryDoc.data().roundResults || [] : [];
    
    // Update the round results array
    const roundResults = [...existingRoundResults];
    const existingRoundIndex = roundResults.findIndex(r => r.round === currentRound);
    
    if (existingRoundIndex >= 0) {
      roundResults[existingRoundIndex] = { round: currentRound, status: roundStatus };
    } else {
      roundResults.push({ round: currentRound, status: roundStatus });
    }
    
    // Create the summary data
    const summaryData = {
      internshipId,
      internshipTitle: internshipData.title,
      companyName: internshipData.companyName,
      currentRound,
      status,
      roundResults,
      lastUpdated: serverTimestamp()
    };
    
    await setDoc(summaryRef, summaryData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user application summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates the aggregate round results for an internship
 * @param {string} internshipId - The internship ID
 * @param {number} roundNumber - The round number
 * @param {string} roundStatus - The status of the round (passed, failed, pending)
 * @returns {Promise<void>}
 */
export const updateRoundResults = async (internshipId, roundNumber, roundStatus) => {
  try {
    const resultDocId = `${internshipId}_${roundNumber}`;
    const resultRef = doc(db, 'roundResults', resultDocId);
    
    // Use a transaction to safely update the counters
    await runTransaction(db, async (transaction) => {
      const resultDoc = await transaction.get(resultRef);
      
      if (!resultDoc.exists()) {
        // Create a new document if it doesn't exist
        transaction.set(resultRef, {
          internshipId,
          roundNumber,
          totalApplicants: 1,
          passed: roundStatus === ROUND_STATUS.PASSED ? 1 : 0,
          rejected: roundStatus === ROUND_STATUS.FAILED ? 1 : 0,
          pending: roundStatus === ROUND_STATUS.PENDING ? 1 : 0,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Update the existing document
        const data = resultDoc.data();
        
        // Determine which counters to increment
        const updates = {
          lastUpdated: serverTimestamp()
        };
        
        if (roundStatus === ROUND_STATUS.PASSED) {
          updates.passed = increment(1);
        } else if (roundStatus === ROUND_STATUS.FAILED) {
          updates.rejected = increment(1);
        } else if (roundStatus === ROUND_STATUS.PENDING) {
          updates.pending = increment(1);
        }
        
        transaction.update(resultRef, updates);
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating round results:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets the formatted status label for display
 * @param {string} status - The application status
 * @returns {string} - Formatted status label
 */
export const getStatusLabel = (app) => {
  if (!app || !app.status) return 'Unknown';

  // Handle specific pending statuses
  if (app.status === APPLICATION_STATUS.FORM_SUBMITTED) {
    return 'Pending Review for Round 1';
  }
  if (app.status === APPLICATION_STATUS.TEST_SUBMITTED) {
    return 'Pending Review for Round 2';
  }

  // Default formatting for other statuses
  return app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Gets the appropriate CSS class for a status badge
 * @param {string} status - The application status
 * @returns {string} - CSS class for the status badge
 */
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case APPLICATION_STATUS.FORM_PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case APPLICATION_STATUS.FORM_SUBMITTED:
      return 'bg-blue-100 text-blue-800';
    case APPLICATION_STATUS.FORM_APPROVED:
      return 'bg-green-100 text-green-800';
    case APPLICATION_STATUS.FORM_REJECTED:
      return 'bg-red-100 text-red-800';
    case APPLICATION_STATUS.TEST_ASSIGNED:
      return 'bg-purple-100 text-purple-800';
    case APPLICATION_STATUS.QUIZ_COMPLETED:
      return 'bg-indigo-100 text-indigo-800';
    case APPLICATION_STATUS.QUIZ_APPROVED:
      return 'bg-green-100 text-green-800';
    case APPLICATION_STATUS.QUIZ_REJECTED:
      return 'bg-red-100 text-red-800';
    case APPLICATION_STATUS.SELECTED:
      return 'bg-green-100 text-green-800';
    case APPLICATION_STATUS.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
