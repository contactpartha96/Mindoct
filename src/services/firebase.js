// Firebase Service Wrapper
// Guarded against missing native files for Expo Go local testing environments.

let firebaseApp = null;
let authInstance = null;
let firestoreInstance = null;
let isMock = false;

// Mock database storage in-memory for testing
const mockUsers = [
  { email: 'admin@mindoct.com', password: 'admin123', name: 'Admin Hub Owner', role: 'admin', details: 'Global Administrator' },
  { email: 'doctor@mindoct.com', password: 'doctor123', name: 'Dr. Neha Roy', role: 'doctor', details: 'Clinical Psychologist • CBT Specialist' },
  { email: 'user@mindoct.com', password: 'user123', name: 'Rahul Sharma', role: 'user', details: 'User / Patient Profile' }
];

try {
  const firebase = require('@react-native-firebase/app').default;
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;

  // Check if firebase apps are already initialized
  if (!firebase.apps.length) {
    firebaseApp = firebase.initializeApp();
  } else {
    firebaseApp = firebase.app();
  }

  authInstance = auth();
  firestoreInstance = firestore();
  console.log('Firebase initialized successfully on Native Platform.');
} catch (error) {
  isMock = true;
  console.warn(
    'Firebase Native config files missing or running in simulated Expo Go mode. ' +
    'Failing safe with mock interfaces.'
  );

  authInstance = {
    currentUser: null,
    signInWithEmailAndPassword: async (email, password) => {
      console.log(`Mock sign-in check with ${email}`);
      await new Promise(resolve => setTimeout(resolve, 600));
      const found = mockUsers.find(u => u.email === email.trim().toLowerCase() && u.password === password);
      if (found) {
        const mockUser = { uid: 'mock-uid-' + found.role, email: found.email };
        authInstance.currentUser = mockUser;
        return { user: mockUser };
      }
      throw new Error('Invalid credentials. Use the Demo Credentials guide!');
    },
    createUserWithEmailAndPassword: async (email, password) => {
      console.log(`Mock sign-up with ${email}`);
      await new Promise(resolve => setTimeout(resolve, 800));
      const exists = mockUsers.find(u => u.email === email.trim().toLowerCase());
      if (exists) {
        throw new Error('Email address already registered.');
      }
      const mockUser = { uid: 'mock-uid-user-' + Date.now(), email: email.trim().toLowerCase() };
      authInstance.currentUser = mockUser;
      return { user: mockUser };
    },
    signOut: async () => {
      console.log('Mock sign-out');
      await new Promise(resolve => setTimeout(resolve, 300));
      authInstance.currentUser = null;
    },
    onAuthStateChanged: (callback) => {
      // Mock state listener
      callback(authInstance.currentUser);
      return () => {};
    }
  };

  firestoreInstance = {
    collection: (name) => {
      console.log(`Accessing mock Firestore collection: ${name}`);
      return {
        doc: (id) => ({
          set: async (data) => console.log(`Mock Firestore write to ${name}/${id}`, data),
          get: async () => ({
            exists: true,
            data: () => ({})
          }),
          collection: (subName) => ({
            doc: (subId) => ({
              set: async (subData) => console.log(`Mock Firestore write to ${name}/${id}/${subName}/${subId}`, subData)
            }),
            add: async (subData) => {
              console.log(`Mock Firestore add to ${name}/${id}/${subName}`, subData);
              return { id: 'mock-subdoc-id-' + Date.now() };
            }
          })
        }),
        get: async () => ({
          docs: []
        })
      };
    }
  };
}

// Auth wrappers
export const signUpUser = async (email, password, name, role) => {
  if (isMock) {
    const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
    const mockProfile = {
      email: email.trim().toLowerCase(),
      password, // for mock sign-in reuse
      name,
      role,
      details: role === 'user' ? 'User / Patient Profile' : (role === 'doctor' ? 'Clinical Specialist' : 'Global Administrator')
    };
    mockUsers.push(mockProfile);
    return {
      uid: userCredential.user.uid,
      email: mockProfile.email,
      name: mockProfile.name,
      role: mockProfile.role,
      details: mockProfile.details
    };
  } else {
    const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const details = role === 'user' ? 'User / Patient Profile' : (role === 'doctor' ? 'Clinical Specialist' : 'Global Administrator');
    
    await firestoreInstance.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email.trim().toLowerCase(),
      name,
      role,
      details,
      createdAt: new Date().toISOString()
    });

    return { uid: user.uid, email, name, role, details };
  }
};

export const signInUser = async (email, password) => {
  if (isMock) {
    const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
    const found = mockUsers.find(u => u.email === email.trim().toLowerCase());
    return {
      uid: userCredential.user.uid,
      email: found.email,
      name: found.name,
      role: found.role,
      details: found.details
    };
  } else {
    const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const userDoc = await firestoreInstance.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        name: data.name || 'User',
        role: data.role || 'user',
        details: data.details || ''
      };
    }
    return { uid: user.uid, email: user.email, name: 'User', role: 'user', details: '' };
  }
};

export const signOutUser = async () => {
  await authInstance.signOut();
};

// Database Sync Adapters
export const syncTaskToCloud = async (userId, taskId, completed) => {
  if (isMock) {
    console.log(`Mock sync task ${taskId} (completed: ${completed}) for user: ${userId}`);
    return;
  }
  try {
    await firestoreInstance
      .collection('users')
      .doc(userId)
      .collection('tasks')
      .doc(taskId.toString())
      .set({
        taskId,
        completed,
        updatedAt: new Date().toISOString()
      }, { merge: true });
  } catch (error) {
    console.error('Failed to sync task to Firestore:', error);
  }
};

export const saveQuizToCloud = async (userId, score, total) => {
  if (isMock) {
    console.log(`Mock save quiz score ${score}/${total} for user: ${userId}`);
    return;
  }
  try {
    await firestoreInstance
      .collection('users')
      .doc(userId)
      .collection('quizzes')
      .add({
        score,
        total,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to save quiz to Firestore:', error);
  }
};

export const app = firebaseApp;
export const auth = authInstance;
export const db = firestoreInstance;
