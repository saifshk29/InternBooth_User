import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  async function signup(email, password, role, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save additional user data in Firestore
      const collectionName = role === 'faculty' ? 'faculty' : 'students';
      await setDoc(doc(db, collectionName, user.uid), {
        ...userData,
        email,
        role,
        createdAt: new Date().toISOString()
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Immediately fetch and set the user role
      try {
        const userData = await getUserData(user.uid, userRole);
        if (userData) {
          console.log("User role set immediately after login:", userData.role);
          setUserRole(userData.role);
        } else {
          console.warn("No user data found during login for:", user.uid);
          // Set a default role of 'student' if not found
          setUserRole('student');
        }
      } catch (error) {
        console.error("Error fetching user role during login:", error);
        // Set a default role of 'student' in case of errors
        setUserRole('student');
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function getUserData(uid, role) {
    if (role) {
      const collectionName = role === 'faculty' ? 'faculty' : 'students';
      const docRef = doc(db, collectionName, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } else {
      // Try faculty first
      let docRef = doc(db, 'faculty', uid);
      let docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), role: 'faculty' };
      }
      // Try students
      docRef = doc(db, 'students', uid);
      docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), role: 'student' };
      }
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userData = await getUserData(user.uid); // No role passed
          if (userData) {
            console.log("User data loaded successfully:", userData);
            setUserRole(userData.role);
          } else {
            console.warn("No user data found for:", user.uid);
            // Set a default role of 'student' if not found
            setUserRole('student');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Set a default role of 'student' in case of errors
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 