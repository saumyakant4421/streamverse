import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);


const generateUsername = (name) => {
    const base = name.toLowerCase().replace(/\s+/g, "_");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${randomNum}`;
};


const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
  
      // Check Firestore for existing user data
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        const name = user.displayName || prompt("Enter your name:");
        const username = generateUsername(name);
        await setDoc(userRef, {
          uid: user.uid,
          name: name,
          email: user.email,
          username: username,
          createdAt: new Date(),
        });
        
        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name });
      }
      return user;
    } catch (error) {
      console.error("Google Sign-In Error: ", error);
    }
};


const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");
  } catch (error) {
    console.error("Password Reset Error: ", error);
  }
};

export { auth, db, signInWithGoogle, sendPasswordReset };
