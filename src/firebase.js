import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, query, where, getAnalytics } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const registerUser = async (email, password, firstName, lastName, username, dateOfBirth, phoneNumber, bio) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Prepare user details for Firestore
    const userProfile = {
      firstName,
      lastName,
      username,
      dateOfBirth,
      phoneNumber,
      bio,
      email: user.email,
      createdAt: new Date()
    };

    // Save user profile to Firestore under "users" collection
    await setDoc(doc(db, "users", user.uid), userProfile);

    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Error('Registration failed: ' + error.message);
  }
};

export const loginUser = async (credential, password) => {
  try {
    let userCredential;

    if (credential.includes('@')) {
      userCredential = await signInWithEmailAndPassword(auth, credential, password);
    } else {
      const userDoc = await getDocs(query(collection(db, "users"), where("username", "==", credential)));
      if (userDoc.empty) {
        throw new Error('No user found with this username.');
      }
      const user = userDoc.docs[0].data();
      userCredential = await signInWithEmailAndPassword(auth, user.email, password);
    }

    return userCredential.user;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw new Error('Login failed: ' + error.message);
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const addStory = async (storyData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated");

    const docRef = await addDoc(collection(db, "stories"), {
      ...storyData,
      userId: user.uid, // Include the userId of the logged-in user
    });

    return { id: docRef.id, ...storyData, userId: user.uid }; // Return consistent data
  } catch (e) {
    console.error("Error adding story:", e);
    throw new Error("Failed to add story");
  }
};

export const getUserStories = async (userId) => {
  const q = query(collection(db, "stories"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const stories = [];
  querySnapshot.forEach((doc) => {
    stories.push({ id: doc.id, ...doc.data() });
  });
  return stories;
};

export const getCharactersByStory = async (storyId) => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);
    
    if (storySnap.exists()) {
      return storySnap.data().characters || [];
    } else {
      console.log("No such story!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching characters:", error);
    throw new Error("Failed to fetch characters");
  }
};

export const getUserStoriesWithCharacters = async (userId) => {
  try {
    const userStoriesQuery = query(collection(db, "stories"), where("userId", "==", userId));
    const querySnapshot = await getDocs(userStoriesQuery);
    const stories = [];
    for (const storyDoc of querySnapshot.docs) {
      const storyData = storyDoc.data();
      const characters = await getCharactersByStory(storyDoc.id); // Fetch characters for each story
      stories.push({
        id: storyDoc.id,
        ...storyData,
        characters,
      });
    }
    return stories;
  } catch (error) {
    console.error("Error fetching user stories:", error);
    throw new Error("Failed to fetch user stories");
  }
};

export const getStoryById = async (id) => {
  try {
    const docRef = doc(db, "stories", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (e) {
    console.error("Error getting story:", e);
    throw new Error("Failed to fetch story");
  }
};

export const updateStory = async (id, storyData) => {
  try {
    const docRef = doc(db, "stories", id);
    await updateDoc(docRef, storyData);
    console.log("Story updated:", id);
  } catch (e) {
    console.error("Error updating story:", e);
    throw new Error("Failed to update story");
  }
};

export const deleteStory = async (id) => {
  try {
    const docRef = doc(db, "stories", id);
    await deleteDoc(docRef);
    console.log("Story deleted:", id);
  } catch (e) {
    console.error("Error deleting story:", e);
    throw new Error("Failed to delete story");
  }
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("No such user!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data");
  }
};

export const createAIThread = async (userId, storyId) => {
  try {
    const threadRef = await addDoc(collection(db, "threads"), {
      userId,
      storyId,
      messages: [],
      createdAt: new Date(),
    });
    const threadId = threadRef.id;
    await updateDoc(doc(db, "stories", storyId), {
      threadId,
    });
    return threadRef.id;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw new Error("Failed to create thread");
  }
};

export const addMessageToThread = async (threadId, message) => {
  try {
    const threadRef = doc(db, "threads", threadId);
    const threadSnapshot = await getDoc(threadRef);

    if (threadSnapshot.exists()) {
      const existingData = threadSnapshot.data();
      await updateDoc(threadRef, {
        messages: [...existingData.messages, message],
      });
    } else {
      throw new Error("Thread not found");
    }
  } catch (error) {
    console.error("Error adding message to thread:", error);
    throw new Error("Failed to add message to thread");
  }
};

export const getThreadsForUser = async (userId) => {
  try {
    const q = query(collection(db, "threads"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const threads = [];
    querySnapshot.forEach((doc) => {
      threads.push({ id: doc.id, ...doc.data() });
    });
    return threads;
  } catch (error) {
    console.error("Error fetching threads:", error);
    throw new Error("Failed to fetch threads");
  }
};

export const getAIThreadByStory = async (storyId) => {
  try {
    const storyDoc = await getStoryById(storyId);
    if (!storyDoc) {
      throw new Error('Story not found');
    }

    if (storyDoc.threadId) {

      return storyDoc.threadId;
    }
    else {
      console.log("no thread id")
      return null;
    }
  } catch (error) {
    console.error("Error getting thread:", error);
    throw new Error("Failed to fetch thread");
  }
};


export const getAIThread = async (threadId) => {
  if (!threadId) {
    console.log("No thread ID")
    return null;
  }

  try {
    const threadRef = doc(db, "threads", threadId);
    const threadSnapshot = await getDoc(threadRef);
    if (threadSnapshot.exists()) {
      return { id: threadSnapshot.id, ...threadSnapshot.data() };
    } else {
      throw new Error('Thread not found');
    }
  } catch (error) {
    throw new Error("Failed to fetch thread");
  }
};

export const deleteThread = async (threadId, storyId) => {
  try {
    const threadRef = doc(db, "threads", threadId);
    await deleteDoc(threadRef);
    await updateDoc(doc(db, "stories", storyId), { threadId: null });
    console.log("Thread and reference in story deleted successfully.");
  } catch (e) {
    console.error("Error deleting thread:", e);
    throw new Error("Failed to delete thread");
  }
};