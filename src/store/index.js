import { configureStore, createSlice } from '@reduxjs/toolkit';
import { signUpUser, signInUser, signOutUser, syncTaskToCloud, saveQuizToCloud } from '../services/firebase';

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loggedInUser: null,    // Null indicates unauthenticated (requires AuthScreen routing)
    activeRole: 'user',    // Active role ('admin', 'doctor', 'user')
    profileName: '',
    profileDetails: '',
    userId: null,
  },
  reducers: {
    setRole: (state, action) => {
      const targetRole = action.payload;
      const allowedRoles = {
        admin: ['admin', 'doctor', 'user'],
        doctor: ['doctor', 'user'],
        user: ['user']
      };
      const userRole = state.loggedInUser;
      if (userRole && allowedRoles[userRole]?.includes(targetRole)) {
        state.activeRole = targetRole;
      } else {
        console.warn(`Unauthorized role switch attempt: ${userRole} -> ${targetRole}`);
      }
    },
    login: (state, action) => {
      state.loggedInUser = action.payload.role;
      state.activeRole = action.payload.role;
      state.profileName = action.payload.name || 'Demo User';
      state.profileDetails = action.payload.details || '';
      state.userId = action.payload.uid || action.payload.userId || 'mock-id';
    },
    logout: (state) => {
      state.loggedInUser = null;
      state.activeRole = 'user';
      state.profileName = '';
      state.profileDetails = '';
      state.userId = null;
    }
  }
});

// Chat Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      { id: '1', sender: 'ai', text: 'Hello! I am your Mindoct AI Wellness Companion. Ask me any questions about managing stress, sleep hygiene, or mindfulness practices!' }
    ],
    isTyping: false
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    clearChat: (state) => {
      state.messages = [
        { id: '1', sender: 'ai', text: 'Hello! I am your Mindoct AI Wellness Companion. Ask me any questions about managing stress, sleep hygiene, or mindfulness practices!' }
      ];
    }
  }
});

// Curriculum Slice (rebranded internally to Wellness, keeping properties for component compatibility)
const curriculumSlice = createSlice({
  name: 'curriculum',
  initialState: {
    selectedClass: 'Mindfulness', // Selected Wellness Category
    selectedDoctorId: 'dr_neha',
    doctors: [
      {
        id: 'dr_neha',
        name: 'Dr. Neha Roy',
        specialty: 'CBT & Stress Specialist',
        emoji: '🩺',
        avatar: '👩‍⚕️',
        gender: 'female',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Neha Roy.jpeg'),
        welcome: 'Hello! I am Dr. Neha Roy, your CBT and Stress Relief specialist. Let us discuss how you are coping today.'
      },
      {
        id: 'dr_amit',
        name: 'Dr. Amit Das',
        specialty: 'Mindfulness & Grounding Specialist',
        emoji: '🧘',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en', 'bn'],
        image: require('../assets/Doctors/Dr. Amit Das.jpeg'),
        welcome: 'Greetings. I am Dr. Amit Das. I specialize in mindfulness and emotional grounding. How can we center your mind today?'
      },
      {
        id: 'dr_sarah',
        name: 'Dr. Sarah Jenkins',
        specialty: 'Sleep & Circadian Expert',
        emoji: '🌙',
        avatar: '👩‍⚕️',
        gender: 'female',
        languages: ['en'],
        image: require('../assets/Doctors/Dr. Sarah Jenkins.jpeg'),
        welcome: 'Hello there. I am Dr. Sarah Jenkins, sleep quality specialist. If you are having trouble sleeping or feeling fatigued, let\'s set a circadian routine together.'
      },
      {
        id: 'dr_rajiv',
        name: 'Dr. Rajiv',
        specialty: 'Psychiatry & Mental Wellness',
        emoji: '🧠',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Rajiv.jpeg'),
        welcome: 'Hello! I am Dr. Rajiv, a psychiatrist focused on mental wellness and emotional health. How can I assist you today?'
      },
      {
        id: 'dr_riya',
        name: 'Dr. Riya Dixit',
        specialty: 'Anxiety & Panic Disorder Expert',
        emoji: '💙',
        avatar: '👩‍⚕️',
        gender: 'female',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Riya Dixit.jpeg'),
        welcome: 'Hi, I am Dr. Riya Dixit. I specialize in anxiety and panic disorders. You are safe here — let us talk about what you are experiencing.'
      },
      {
        id: 'dr_rohit',
        name: 'Dr. Rohit Sharma',
        specialty: 'Trauma & PTSD Recovery',
        emoji: '🛡️',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Rohit Sharma.jpeg'),
        welcome: 'Hello, I am Dr. Rohit Sharma. I work with trauma survivors and PTSD recovery. This is a safe space — feel free to share at your pace.'
      },
      {
        id: 'dr_sneha',
        name: 'Dr. Sneha',
        specialty: 'Child & Adolescent Psychology',
        emoji: '🌸',
        avatar: '👩‍⚕️',
        gender: 'female',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Sneha.jpeg'),
        welcome: 'Hi there! I am Dr. Sneha, a child and adolescent psychologist. I am here to listen and support you through any challenges you face.'
      },
      {
        id: 'dr_sonu',
        name: 'Dr. Sonu',
        specialty: 'Addiction & Behavioral Therapy',
        emoji: '🔄',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en'],
        image: require('../assets/Doctors/Dr. Sonu.jpeg'),
        welcome: 'Hello! I am Dr. Sonu, specializing in behavioral therapy and addiction recovery. Every step forward counts — how are you doing today?'
      },
      {
        id: 'dr_sourav',
        name: 'Dr. Sourav',
        specialty: 'Couples & Relationship Counseling',
        emoji: '💞',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en', 'bn'],
        image: require('../assets/Doctors/Dr. Sourav.jpeg'),
        welcome: 'Hello! I am Dr. Sourav, a relationship and couples counselor. Communication and empathy are the keys — let us explore that together.'
      },
      {
        id: 'dr_vishal',
        name: 'Dr. Vishal',
        specialty: 'Depression & Mood Disorders',
        emoji: '☀️',
        avatar: '👨‍⚕️',
        gender: 'male',
        languages: ['en', 'hi'],
        image: require('../assets/Doctors/Dr. Vishal.jpeg'),
        welcome: 'Hi, I am Dr. Vishal. I specialize in depression and mood disorders. You took a brave step by being here — I am ready to listen.'
      }
    ],
    subjects: {
      'Mindfulness': [
        { name: 'Breathing Exercises', icon: 'wind', chaptersCount: 3 },
        { name: 'Gratitude Journaling', icon: 'edit', chaptersCount: 2 }
      ],
      'Stress Relief': [
        { name: 'Cognitive Reframing', icon: 'brain', chaptersCount: 2 },
        { name: 'Relaxation Techniques', icon: 'heart', chaptersCount: 3 }
      ],
      'Sleep Quality': [
        { name: 'Sleep Hygiene', icon: 'moon', chaptersCount: 2 },
        { name: 'Circadian Alignment', icon: 'sun', chaptersCount: 2 }
      ]
    },
    meetings: [
      { id: '1', title: 'Therapy & CBT Consultation Session', standard: 'Stress Relief', time: 'Today, 04:30 PM', teacher: 'Dr. Neha Roy' },
      { id: '2', title: 'Mindfulness Practice Live Group', standard: 'Mindfulness', time: 'Tomorrow, 10:00 AM', teacher: 'Dr. Amit Das' }
    ],
    tasks: [
      { id: 1, title: '10-Minute Mindful Breathing Exercise', subject: 'Breathing Exercises', standard: 'Mindfulness', deadline: 'June 5, 2026', completed: false, score: 0 },
      { id: 2, title: 'Log 3 Positive Things in Gratitude Journal', subject: 'Gratitude Journaling', standard: 'Mindfulness', deadline: 'June 7, 2026', completed: true, score: 95 },
      { id: 3, title: 'Complete Cognitive Reframing Form', subject: 'Cognitive Reframing', standard: 'Stress Relief', deadline: 'June 4, 2026', completed: false, score: 0 }
    ],
    quiz: {
      currentQuestionIndex: 0,
      score: 0,
      active: true,
      questions: [
        {
          question: 'How would you rate your sleep quality over the past week?',
          options: ['Excellent & restful', 'Somewhat restful', 'Toss and turn frequently', 'Severe insomnia'],
          correctIndex: 0,
          explanation: 'High sleep quality is vital for emotional resilience and stress recovery.'
        },
        {
          question: 'How often have you felt overwhelmed by stress or anxiety recently?',
          options: ['Rarely / Never', 'Occasionally', 'Frequently', 'Almost constantly'],
          correctIndex: 0,
          explanation: 'Recognizing stress patterns is the first step in applying Cognitive Behavioral Therapy (CBT) techniques.'
        },
        {
          question: 'Which of the following activities best helps you recharge your mental battery?',
          options: ['Physical exercise / Walking', 'Mindful breathing / Meditation', 'Creative hobbies / Reading', 'All of the above'],
          correctIndex: 3,
          explanation: 'A balanced combination of activity, mindfulness, and relaxation promotes overall mental wellbeing.'
        }
      ]
    }
  },
  reducers: {
    setSelectedClass: (state, action) => {
      state.selectedClass = action.payload;
    },
    setSelectedDoctorId: (state, action) => {
      state.selectedDoctorId = action.payload;
    },
    toggleTask: (state, action) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    answerQuizQuestion: (state, action) => {
      const { isCorrect } = action.payload;
      if (isCorrect) {
        state.quiz.score += 1;
      }
      state.quiz.currentQuestionIndex += 1;
    },
    resetQuiz: (state) => {
      state.quiz.currentQuestionIndex = 0;
      state.quiz.score = 0;
    }
  }
});

// Exports Slices actions
export const { setRole, login, logout } = authSlice.actions;
export const { addMessage, setTyping, clearChat } = chatSlice.actions;
export const { setSelectedClass, toggleTask, answerQuizQuestion, resetQuiz, setSelectedDoctorId } = curriculumSlice.actions;

// Async Thunk Actions
export const loginUser = (email, password) => async (dispatch) => {
  const profile = await signInUser(email, password);
  dispatch(login(profile));
  return profile;
};

export const registerUser = (email, password, name, role) => async (dispatch) => {
  const profile = await signUpUser(email, password, name, role);
  dispatch(login(profile));
  return profile;
};

export const logoutUser = () => async (dispatch) => {
  await signOutUser();
  dispatch(logout());
};

export const toggleTaskAndSync = (taskId) => async (dispatch, getState) => {
  dispatch(toggleTask(taskId));
  const state = getState();
  const task = state.curriculum.tasks.find(t => t.id === taskId);
  const userId = state.auth.userId;
  if (userId && task) {
    await syncTaskToCloud(userId, taskId, task.completed);
  }
};

export const answerQuizQuestionAndSync = (isCorrect) => async (dispatch, getState) => {
  dispatch(answerQuizQuestion({ isCorrect }));
  const state = getState();
  const userId = state.auth.userId;
  if (userId) {
    const { score, questions, currentQuestionIndex } = state.curriculum.quiz;
    if (currentQuestionIndex === questions.length) {
      await saveQuizToCloud(userId, score, questions.length);
    }
  }
};

// Store Configuration
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    chat: chatSlice.reducer,
    curriculum: curriculumSlice.reducer
  }
});
