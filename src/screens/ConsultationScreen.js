import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Animated,
  Easing,
  Dimensions,
  ScrollView
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

const STATIC_LOCALES = {
  en: {
    listening: 'Listening...',
    speaking: 'Doctor is speaking...',
    mute: 'Mute',
    unmute: 'Unmute',
    camOff: 'Stop Cam',
    camOn: 'Start Cam',
    chat: 'Chat',
    endCall: 'Hang Up',
    chatPlaceholder: 'Type your message to the AI Doctor...',
    live: 'LIVE',
    userLive: 'YOU (LIVE)',
    modeVideo: 'Video Call',
    modeVoice: 'Voice Call',
    modeChat: 'Text Chat',
    groupChatPlaceholder: 'Send message to live room...',
    liveIndicator: 'LIVE WEBINAR',
    participantsCount: '24 Patients Online'
  },
  hi: {
    listening: 'सुन रहा है...',
    speaking: 'डॉक्टर बोल रहे हैं...',
    mute: 'म्यूट',
    unmute: 'अनम्यूट',
    camOff: 'कैमरा बंद',
    camOn: 'कैमरा चालू',
    chat: 'चैट',
    endCall: 'कॉल समाप्त',
    chatPlaceholder: 'एआई डॉक्टर को संदेश लिखें...',
    live: 'लाइव',
    userLive: 'आप (लाइव)',
    modeVideo: 'वीडियो कॉल',
    modeVoice: 'वॉयस कॉल',
    modeChat: 'चैट रूम',
    groupChatPlaceholder: 'लाइव रूम में संदेश भेजें...',
    liveIndicator: 'लाइव वेबिनার',
    participantsCount: '24 मरीज ऑनलाइन'
  },
  bn: {
    listening: 'শুনছে...',
    speaking: 'ডাক্তার কথা বলছেন...',
    mute: 'মিউট',
    unmute: 'অনমিউট',
    camOff: 'ক্যামেরা বন্ধ',
    camOn: 'ক্যামেরা চালু',
    chat: 'চ্যাট',
    endCall: 'কল শেষ',
    chatPlaceholder: 'এআই ডাক্তারকে বার্তা লিখুন...',
    live: 'লাইভ',
    userLive: 'আপনি (লাইভ)',
    modeVideo: 'ভিডিও কল',
    modeVoice: 'ভয়েস কল',
    modeChat: 'টেক্সট চ্যাট',
    groupChatPlaceholder: 'লাইভ রুমে বার্তা পাঠান...',
    liveIndicator: 'লাইভ ওয়েবিনার',
    participantsCount: '২৪ জন রোগী অনলাইন'
  }
};

export default function ConsultationScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const profileName = useSelector((state) => state.auth.profileName || 'User');
  
  // Doctor & Mode parameter retrieval from Navigation
  const { doctorId, mode, meetingId, doctorName, roomTitle } = route.params || {};
  
  const doctors = useSelector((state) => state.curriculum.doctors);
  const selectedDoctorId = useSelector((state) => state.curriculum.selectedDoctorId);
  
  const activeDoctorId = doctorId || selectedDoctorId || 'dr_neha';
  const doctor = doctors.find(d => d.id === activeDoctorId) || doctors[0];

  // Consultation Mode: 'video', 'voice', or 'chat'
  const [consultationMode, setConsultationMode] = useState('video');
  const [language, setLanguage] = useState('en'); // 'en', 'hi', 'bn'
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false); // Quick Overlay in Video/Voice mode
  const [aiStatus, setAiStatus] = useState('speaking'); // 'speaking' or 'listening'
  const [doctorSpeech, setDoctorSpeech] = useState('');
  const [chatText, setChatText] = useState('');
  const [chatLog, setChatLog] = useState([]);
  
  // Custom Modals visibility
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Animation values
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  
  // Voice Waveform Anim values
  const wave1 = useRef(new Animated.Value(1)).current;
  const wave2 = useRef(new Animated.Value(1)).current;
  const wave3 = useRef(new Animated.Value(1)).current;
  const wave4 = useRef(new Animated.Value(1)).current;
  const wave5 = useRef(new Animated.Value(1)).current;

  // Lip-sync & face animation values
  const jawAnim = useRef(new Animated.Value(0)).current;      // 0=closed, 1=open
  const blinkAnim = useRef(new Animated.Value(1)).current;    // 1=open, 0=closed
  const breatheAnim = useRef(new Animated.Value(1)).current;  // subtle scale
  const eyebrowAnim = useRef(new Animated.Value(0)).current;  // eyebrow raise

  const listRef = useRef();

  // Load language settings
  const strings = STATIC_LOCALES[language] || STATIC_LOCALES['en'];

  // Doctor dynamic welcome and localized response database
  const getDoctorWelcome = (docId, lang) => {
    const welcomes = {
      dr_neha: {
        en: 'Hello! I am Dr. Neha Roy, your CBT and Stress Relief specialist. How can I help you today?',
        hi: 'नमस्ते! मैं डॉ. नेहा रॉय हूँ, आपकी सीबीटी और तनाव राहत विशेषज्ञ। आज मैं आपकी कैसे मदद कर सकती हूँ?'
      },
      dr_amit: {
        en: 'Greetings. I am Dr. Amit Das, specializing in mindfulness and grounding. How can we center your mind today?',
        bn: 'নমস্কার! আমি ডক্টর অমিত দাস, মাইন্ডফুলনেস এবং গ্রাউন্ডিং বিশেষজ্ঞ। আজ আমরা কীভাবে আপনার মনকে শান্ত করতে পারি?'
      },
      dr_sarah: {
        en: 'Hello there. I am Dr. Sarah Jenkins, sleep quality specialist. If you are having trouble sleeping, let\'s find a routine together.'
      }
    };
    return welcomes[docId]?.[lang] || welcomes[docId]?.['en'] || 'Hello!';
  };

  const getDoctorResponses = (docId, lang) => {
    const responses = {
      dr_neha: {
        en: [
          { text: 'I feel very anxious and stressed today.', reply: "I hear you. When anxiety builds up, our breathing fastens. Let's practice a short breathing exercise. Inhale slowly for 4 seconds... hold for 4... now exhale for 4. How does that feel?" },
          { text: 'How does CBT help with anxiety?', reply: "CBT helps you identify negative thought loops and reframe them. For example, replacing 'I can't handle this' with 'This is challenging, but I have tools to manage it.'" },
          { text: 'I have a lot of racing thoughts right now.', reply: "Racing thoughts are common in high stress. Let's write them down to offload your working memory, or try a progressive muscle relaxation. Ready?" }
        ],
        hi: [
          { text: 'मुझे आज बहुत चिंता और तनाव महसूस हो रहा है।', reply: "मैं आपकी बात समझ सकता हूँ। जब चिंता बढ़ती है, तो हमारी सांसें तेज हो जाती हैं। आइए एक छोटा सांस लेने का अभ्यास करें। 4 सेकंड के लिए धीरे-धीरे सांस लें... 4 सेकंड के लिए रोकें... अब 4 सेकंड के लिए छोड़ें। कैसा महसूस हो रहा है?" },
          { text: 'सीबीटी (CBT) मेरे तनाव में कैसे मदद कर सकता है?', reply: "सीबीटी आपको नकारात्मक विचारों को पहचानने और उन्हें सकारात्मक विचारों में बदलने में मदद करता है। यह आपके तनाव को काफी हद तक कम कर सकता है।" }
        ]
      },
      dr_amit: {
        en: [
          { text: 'Can we try a quick mindfulness grounding exercise?', reply: "Certainly. Look around your room right now. Name 3 things you can see, 2 things you can touch, and 1 thing you can hear. Let your mind settle on those sensations." },
          { text: 'I am struggling to stay in the present moment.', reply: "Staying present is a practice, like a muscle. When your mind wanders, gently notice it and bring your focus back to the sensation of your breath." },
          { text: 'How does mindfulness help regulate emotions?', reply: "Mindfulness creates a space between a trigger and your reaction. In that space, you can choose a calmer response rather than an automatic emotional reaction." }
        ],
        bn: [
          { text: 'আমরা কি একটি দ্রুত মাইন্ডফুলনেস গ্রাউন্ডিং অনুশীলন করতে পারি?', reply: "অবশ্যই। আপনার ঘরের চারদিকে তাকান। ৩টি জিনিস চিহ্নিত করুন যা দেখতে পাচ্ছেন, ২টি জিনিস যা স্পর্শ করতে পারেন এবং ১টি শব্দ যা শুনতে পাচ্ছেন। মনোযোগ দিন।" },
          { text: 'আমি বর্তমান মুহূর্তে মনোযোগ ধরে রাখতে পারছি না।', reply: "মনোযোগ চলে যাওয়া স্বাভাবিক। যখন মন অন্য কোথাও যাবে, তখন আলতো করে আবার আপনার শ্বাসের দিকে মনোযোগ ফিরিয়ে আনুন।" }
        ]
      },
      dr_sarah: {
        en: [
          { text: 'I am struggling to sleep peacefully at night.', reply: "Restful sleep is foundational. Ensure you turn off screens 1 hour before bed and keep your room completely dark. Let's set a circadian routine together." },
          { text: 'What are the best tips for good sleep hygiene?', reply: "Keep your room cool (around 65°F), avoid heavy meals and caffeine late in the day, and maintain a consistent sleep schedule even on weekends." },
          { text: 'I feel tired during the day. Should I take naps?', reply: "If you nap, keep it under 20-30 minutes and avoid napping after 3 PM, so it doesn't interfere with your nighttime sleep drive." }
        ]
      }
    };
    return responses[docId]?.[lang] || responses[docId]?.['en'] || [];
  };

  const dynamicWelcome = getDoctorWelcome(activeDoctorId, language);
  const dynamicChips = getDoctorResponses(activeDoctorId, language);

  // Set initial welcome text & configure languages based on doctor profile
  useEffect(() => {
    // If current language is not supported by doctor, fallback to first supported
    if (!doctor.languages.includes(language)) {
      setLanguage(doctor.languages[0]);
    }
    
    setDoctorSpeech(dynamicWelcome);
    setChatLog([
      { id: '1', sender: 'doctor', text: dynamicWelcome }
    ]);
  }, [activeDoctorId, language]);

  // Pulse animation loops for video stream avatar
  useEffect(() => {
    let animLoop;
    if (aiStatus === 'speaking' && (consultationMode === 'video' || mode === 'live')) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.5,
              duration: 1200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
            })
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.8,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
            })
          ])
        ])
      );
      animLoop.start();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [aiStatus, consultationMode, mode]);

  // Lip-sync jaw animation when speaking
  useEffect(() => {
    let jawLoop;
    let blinkLoop;
    let breatheLoop;

    // Breathing animation (always on)
    breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.015,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    breatheLoop.start();

    // Eye blink loop (always on)
    const doBlink = () => {
      blinkLoop = Animated.sequence([
        Animated.delay(2800 + Math.random() * 2000),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 90,
          useNativeDriver: false
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: false
        })
      ]);
      blinkLoop.start(() => doBlink());
    };
    doBlink();

    // Jaw/lip-sync animation when speaking
    if (aiStatus === 'speaking') {
      const makeJawSequence = () => {
        const openAmount = 0.3 + Math.random() * 0.7;
        const dur = 80 + Math.random() * 120;
        return Animated.sequence([
          Animated.timing(jawAnim, {
            toValue: openAmount,
            duration: dur,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false
          }),
          Animated.timing(jawAnim, {
            toValue: 0.05,
            duration: dur,
            easing: Easing.in(Easing.ease),
            useNativeDriver: false
          })
        ]);
      };
      jawLoop = Animated.loop(makeJawSequence());
      jawLoop.start();

      // Subtle eyebrow raise when speaking
      Animated.timing(eyebrowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start();
    } else {
      // Listening - jaw slowly closes
      jawAnim.stopAnimation();
      Animated.timing(jawAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }).start();
      Animated.timing(eyebrowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    }

    return () => {
      if (jawLoop) jawLoop.stop();
      if (blinkLoop) blinkLoop.stop();
      if (breatheLoop) breatheLoop.stop();
    };
  }, [aiStatus]);

  // Pulse animation loop for voice waveform
  useEffect(() => {
    let loop;
    if (consultationMode === 'voice' && aiStatus === 'speaking' && mode !== 'live') {
      const animateWave = (anim, to, duration) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: to,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false
            })
          ])
        );
      };
      
      loop = Animated.parallel([
        animateWave(wave1, 2.5, 600),
        animateWave(wave2, 3.5, 800),
        animateWave(wave3, 1.8, 500),
        animateWave(wave4, 4.0, 900),
        animateWave(wave5, 2.2, 700)
      ]);
      loop.start();
    } else {
      wave1.setValue(1);
      wave2.setValue(1);
      wave3.setValue(1);
      wave4.setValue(1);
      wave5.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [consultationMode, aiStatus, mode]);

  // Live webinar simulation chat generator
  useEffect(() => {
    if (mode !== 'live') return;
    
    const simulatedMessages = [
      { sender: 'David Miller', text: 'Good evening doctor and everyone!' },
      { sender: 'Sarah Connor', text: 'This breathing guide is exceptionally helpful. Feeling calmer.' },
      { sender: 'Amit Patel', text: 'How many times a day should we perform these CBT exercises?' },
      { sender: 'Priya Sharma', text: 'Is it normal to feel a bit restless when practicing mindfulness at first?' },
      { sender: 'David Miller', text: 'Yes, Priya! I had the same issue, it goes away with practice.' },
      { sender: 'Sarah Connor', text: 'Thank you for answering my query Dr.' }
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < simulatedMessages.length) {
        const msg = simulatedMessages[index];
        setChatLog(prev => [
          ...prev,
          {
            id: 'sim-' + Date.now() + '-' + index,
            sender: 'simulated_user',
            senderName: msg.sender,
            text: msg.text
          }
        ]);
        index++;
      }
    }, 6000);
    
    return () => clearInterval(interval);
  }, [mode]);

  // Scroll to bottom on chat logs update
  useEffect(() => {
    if (chatLog.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [chatLog]);

  // Reply generator trigger
  const handleUserReply = (text, reply) => {
    // Add user message
    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setChatLog(prev => [...prev, userMsg]);
    
    setAiStatus('listening');
    
    setTimeout(() => {
      setAiStatus('speaking');
      setDoctorSpeech(reply);
      setChatLog(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'doctor', text: reply }]);
    }, 1500);
  };

  // Chat TextInput send
  const handleSendChat = () => {
    const trimmed = chatText.trim();
    if (!trimmed) return;

    // Sanitize user inputs against tags
    const sanitizedText = trimmed.replace(/<\/?[^>]+(>|$)/g, "");

    const userMsg = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: sanitizedText
    };
    
    setChatLog(prev => [...prev, userMsg]);
    setChatText('');
    
    // In live webinar room, user is participating in group chat
    if (mode === 'live') {
      // Simulate doctor verbally replying or other users liking the comment
      setTimeout(() => {
        setChatLog(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          sender: 'simulated_user', 
          senderName: doctorName || 'Dr. Neha Roy', 
          text: `Thank you for sharing, ${profileName}. That is a very valid point. Let's practice that next.` 
        }]);
      }, 2500);
      return;
    }

    setAiStatus('listening');

    // AI Clinical response engine
    setTimeout(() => {
      let docReply = '';
      const q = sanitizedText.toLowerCase();

      if (language === 'hi') {
        if (q.includes('चिंता') || q.includes('तनाव')) {
          docReply = "मैं समझ सकता हूँ। तनाव से राहत के लिए गहरी सांस लें। धीरे-धीरे 4 सेकंड के लिए सांस लें और 4 सेकंड में छोड़ें।";
        } else if (q.includes('नींद')) {
          docReply = "नींद की गुणवत्ता सुधारने के लिए रात को सोने से कम से कम 1 घंटे पहले सभी स्क्रीन का उपयोग बंद कर दें।";
        } else if (q.includes('सीबीटी') || q.includes('विचार')) {
          docReply = "सीबीटी का मुख्य लक्ष्य आपके नकारात्मक विचारों को पहचानना और उनके स्थान पर सकारात्मक विचार लाना है।";
        } else {
          docReply = "मैंने आपका संदेश प्राप्त किया। मैं एक विशेषज्ञ के रूप में आपके मानसिक स्वास्थ्य को बेहतर बनाने में पूरी सहायता करूँगा।";
        }
      } else if (language === 'bn') {
        if (q.includes('উদ্বেগ') || q.includes('মানসিক চাপ')) {
          docReply = "মানসিক উদ্বেগ নিয়ন্ত্রণে গভীর শ্বাস নেওয়ার অভ্যাস করুন। ৪ সেকেন্ড ধরে শ্বাস নিন এবং ৪ সেকেন্ড ধরে ছাড়ুন।";
        } else if (q.includes('ঘুম')) {
          docReply = "ভালো ঘুমের জন্য রাতে ক্যাফেইন এবং নীল স্ক্রিনের আলো এড়িয়ে চলা অত্যন্ত জরুরি।";
        } else if (q.includes('মাইন্ডফুল')) {
          docReply = "মন শান্ত করতে আপনার আশেপাশের ৩টি বস্তুর দিকে মনোযোগ দিন এবং তাদের স্পর্শ অনুভব করুন।";
        } else {
          docReply = "আপনার বার্তার জন্য ধন্যবাদ। একজন বিশেষজ্ঞ হিসেবে আমি আপনার প্রতিটি মানসিক সমস্যার সঠিক সমাধানে পাশে আছি।";
        }
      } else {
        if (q.includes('anxiety') || q.includes('stress')) {
          docReply = "I understand. Try to practice progressive muscle relaxation or a 4-7-8 breathing cycle to calm your nervous system.";
        } else if (q.includes('sleep') || q.includes('insomnia')) {
          docReply = "Ensuring sleep hygiene is crucial. Make sure your bedroom is cool, dark, and try to wake up at the exact same time every morning.";
        } else if (q.includes('mindful') || q.includes('ground')) {
          docReply = "To anchor yourself, try to name 5 things you see, 4 things you can feel, 3 things you hear, 2 things you smell, and 1 thing you taste.";
        } else {
          docReply = `Thank you for sharing. As your clinical specialist, I am here to help you navigate stress, sleep issues, and mindfulness. Ask me more!`;
        }
      }

      setAiStatus('speaking');
      setDoctorSpeech(docReply);
      setChatLog(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'doctor', text: docReply }]);
    }, 1500);
  };

  const renderChatItem = ({ item }) => {
    const isDoc = item.sender === 'doctor';
    const isSelf = item.sender === 'user';
    const isSim = item.sender === 'simulated_user';

    let bubbleBg = colors.surface;
    let textCol = colors.text;
    let senderNameText = doctor.name;
    let alignStyle = styles.chatLeft;

    if (isSelf) {
      bubbleBg = colors.primary;
      textCol = '#ffffff';
      senderNameText = profileName;
      alignStyle = styles.chatRight;
    } else if (isSim) {
      bubbleBg = isDark ? '#112220' : '#f1f5f9';
      textCol = colors.text;
      senderNameText = item.senderName;
      alignStyle = styles.chatLeft;
    }

    return (
      <View style={[styles.chatBubbleContainer, alignStyle]}>
        <View style={[styles.chatBubble, { backgroundColor: bubbleBg, borderColor: colors.border }]}>
          <Text style={[styles.chatSenderName, { color: isSelf ? '#a7f3d0' : colors.secondary }]}>
            {senderNameText}
          </Text>
          <Text style={[styles.chatBubbleText, { color: textCol }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#051f1d' }]}>
      
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowLeaveModal(true)}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.topTitle} numberOfLines={1}>
          {mode === 'live' ? (roomTitle || 'Live Consultation') : `${doctor.name}'s Room`}
        </Text>
        
        {/* Language selector (only languages supported by the doctor) */}
        {mode !== 'live' && (
          <View style={styles.languageSelectors}>
            {doctor.languages.map(l => (
              <TouchableOpacity
                key={l}
                style={[
                  styles.langChip,
                  language === l && { backgroundColor: colors.secondary, borderColor: colors.secondary }
                ]}
                onPress={() => setLanguage(l)}
              >
                <Text style={styles.langText}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Segmented Mode Switcher (only for AI mode, not Live Webinar) */}
      {mode !== 'live' && (
        <View style={styles.modeSwitcher}>
          {[
            { id: 'video', label: strings.modeVideo },
            { id: 'voice', label: strings.modeVoice },
            { id: 'chat', label: strings.modeChat }
          ].map(m => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modeTab,
                consultationMode === m.id && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
              ]}
              onPress={() => {
                setConsultationMode(m.id);
                setShowChatOverlay(false);
              }}
            >
              <Text style={[
                styles.modeTabText, 
                { color: consultationMode === m.id ? '#ffffff' : 'rgba(255,255,255,0.6)' }
              ]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.viewportContainer}>
        
        {/* WEBINAR OR VIDEO CALL LAYOUT */}
        {(mode === 'live' || consultationMode === 'video') && (
          <View style={[styles.doctorViewport, { backgroundColor: '#0c2e2a', borderColor: colors.border }]}>
            
            {/* Realistic AI Doctor face with lip-sync */}
            <View style={styles.avatarPulsingContainer}>
              {aiStatus === 'speaking' && (
                <>
                  <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim2 }], opacity: 0.12 }]} />
                  <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim1 }], opacity: 0.25 }]} />
                </>
              )}

              {/* Doctor face container with breathing scale */}
              <Animated.View style={[styles.doctorFaceWrapper, { transform: [{ scale: breatheAnim }] }]}>
                
                {/* Neck */}
                <View style={styles.doctorNeck} />

                {/* Lab coat / body (visible above frame) */}
                <View style={styles.doctorBody}>
                  <View style={styles.labCoatLeft} />
                  <View style={styles.labCoatRight} />
                  <View style={styles.labCoatCenter} />
                  {/* Stethoscope hint */}
                  <View style={styles.stethoscope} />
                </View>

                {/* Face base */}
                <View style={[styles.doctorFace, { backgroundColor: doctor.id === 'dr_neha' ? '#c8856a' : doctor.id === 'dr_amit' ? '#a0714a' : '#d4967e' }]}>
                  
                  {/* Hair */}
                  <View style={[styles.doctorHair, { backgroundColor: doctor.id === 'dr_sarah' ? '#5c3d1e' : '#1a1208' }]}>
                    <View style={styles.hairSideLeft} />
                    <View style={styles.hairSideRight} />
                  </View>

                  {/* Forehead highlight */}
                  <View style={styles.foreheadHighlight} />

                  {/* Eyebrows */}
                  <View style={styles.eyebrowsRow}>
                    <Animated.View style={[
                      styles.eyebrow,
                      { transform: [{ translateY: eyebrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }
                    ]} />
                    <Animated.View style={[
                      styles.eyebrow,
                      { transform: [{ translateY: eyebrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }
                    ]} />
                  </View>

                  {/* Eyes row */}
                  <View style={styles.eyesRow}>
                    {/* Left Eye */}
                    <View style={styles.eyeSocket}>
                      <View style={styles.eyeWhite}>
                        <Animated.View style={[
                          styles.eyelid,
                          { height: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }
                        ]} />
                        <View style={styles.eyePupil}>
                          <View style={styles.eyeHighlight} />
                        </View>
                      </View>
                    </View>
                    {/* Right Eye */}
                    <View style={styles.eyeSocket}>
                      <View style={styles.eyeWhite}>
                        <Animated.View style={[
                          styles.eyelid,
                          { height: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }
                        ]} />
                        <View style={styles.eyePupil}>
                          <View style={styles.eyeHighlight} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Nose */}
                  <View style={styles.noseContainer}>
                    <View style={styles.noseBridge} />
                    <View style={styles.nostrilsRow}>
                      <View style={styles.nostril} />
                      <View style={styles.nostril} />
                    </View>
                  </View>

                  {/* Mouth with animated jaw / lip-sync */}
                  <View style={styles.mouthContainer}>
                    {/* Upper lip */}
                    <View style={styles.upperLip} />
                    {/* Mouth opening - animated height */}
                    <Animated.View style={[
                      styles.mouthOpening,
                      {
                        height: jawAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 14] }),
                        backgroundColor: '#3a1010'
                      }
                    ]} />
                    {/* Lower lip / jaw */}
                    <Animated.View style={[
                      styles.lowerLip,
                      {
                        transform: [{
                          translateY: jawAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] })
                        }]
                      }
                    ]} />
                  </View>

                  {/* Cheek highlights */}
                  <View style={styles.cheekLeft} />
                  <View style={styles.cheekRight} />

                  {/* Chin */}
                  <View style={styles.chin} />
                </View>
              </Animated.View>

              {/* Speaking indicator glow ring */}
              {aiStatus === 'speaking' && (
                <View style={styles.speakingGlowRing} />
              )}
            </View>

            {/* LIVE Label */}
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.redDot} />
              <Text style={styles.liveLabel}>
                {mode === 'live' ? strings.liveIndicator : strings.live}
              </Text>
            </View>

            {/* Doctor Tag Name */}
            <Text style={styles.doctorNameTag}>
              {mode === 'live' ? (doctorName || 'Dr. Expert') : doctor.name}
            </Text>

            {/* Subtitles speech overlay */}
            {mode !== 'live' && (
              <View style={styles.subtitleOverlay}>
                <Text style={styles.speechStatusLabel}>
                  {aiStatus === 'speaking' ? strings.speaking : strings.listening}
                </Text>
                <Text style={styles.subtitleText}>{doctorSpeech}</Text>
              </View>
            )}

            {/* Participant count for Live webinar */}
            {mode === 'live' && (
              <View style={styles.liveMetaOverlay}>
                <Text style={styles.liveMetaText}>{strings.participantsCount}</Text>
              </View>
            )}
          </View>
        )}

        {/* VOICE CALL LAYOUT */}
        {mode !== 'live' && consultationMode === 'voice' && (
          <View style={[styles.voiceViewport, { backgroundColor: '#0c2e2a', borderColor: colors.border }]}>
            <View style={styles.voiceDoctorCard}>
              {/* Realistic animated face for voice call */}
              <Animated.View style={[styles.doctorFaceWrapper, { transform: [{ scale: breatheAnim }], marginBottom: 12 }]}>
                <View style={styles.doctorNeck} />
                <View style={styles.doctorBody}>
                  <View style={styles.labCoatLeft} />
                  <View style={styles.labCoatRight} />
                  <View style={styles.labCoatCenter} />
                  <View style={styles.stethoscope} />
                </View>
                <View style={[styles.doctorFace, { backgroundColor: doctor.id === 'dr_neha' ? '#c8856a' : doctor.id === 'dr_amit' ? '#a0714a' : '#d4967e' }]}>
                  <View style={[styles.doctorHair, { backgroundColor: doctor.id === 'dr_sarah' ? '#5c3d1e' : '#1a1208' }]}>
                    <View style={styles.hairSideLeft} />
                    <View style={styles.hairSideRight} />
                  </View>
                  <View style={styles.foreheadHighlight} />
                  <View style={styles.eyebrowsRow}>
                    <Animated.View style={[styles.eyebrow, { transform: [{ translateY: eyebrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }]} />
                    <Animated.View style={[styles.eyebrow, { transform: [{ translateY: eyebrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }]} />
                  </View>
                  <View style={styles.eyesRow}>
                    <View style={styles.eyeSocket}>
                      <View style={styles.eyeWhite}>
                        <Animated.View style={[styles.eyelid, { height: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]} />
                        <View style={styles.eyePupil}><View style={styles.eyeHighlight} /></View>
                      </View>
                    </View>
                    <View style={styles.eyeSocket}>
                      <View style={styles.eyeWhite}>
                        <Animated.View style={[styles.eyelid, { height: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]} />
                        <View style={styles.eyePupil}><View style={styles.eyeHighlight} /></View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.noseContainer}>
                    <View style={styles.noseBridge} />
                    <View style={styles.nostrilsRow}>
                      <View style={styles.nostril} />
                      <View style={styles.nostril} />
                    </View>
                  </View>
                  <View style={styles.mouthContainer}>
                    <View style={styles.upperLip} />
                    <Animated.View style={[styles.mouthOpening, { height: jawAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 14] }), backgroundColor: '#3a1010' }]} />
                    <Animated.View style={[styles.lowerLip, { transform: [{ translateY: jawAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }] }]} />
                  </View>
                  <View style={styles.cheekLeft} />
                  <View style={styles.cheekRight} />
                  <View style={styles.chin} />
                </View>
              </Animated.View>
              <Text style={styles.voiceDoctorName}>{doctor.name}</Text>
              <Text style={styles.voiceSpecialty}>{doctor.specialty}</Text>
            </View>

            {/* Animated Waveforms */}
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveBar, { height: 16, transform: [{ scaleY: wave1 }] }]} />
              <Animated.View style={[styles.waveBar, { height: 16, transform: [{ scaleY: wave2 }] }]} />
              <Animated.View style={[styles.waveBar, { height: 16, transform: [{ scaleY: wave3 }] }]} />
              <Animated.View style={[styles.waveBar, { height: 16, transform: [{ scaleY: wave4 }] }]} />
              <Animated.View style={[styles.waveBar, { height: 16, transform: [{ scaleY: wave5 }] }]} />
            </View>

            <View style={styles.subtitleOverlay}>
              <Text style={styles.speechStatusLabel}>
                {aiStatus === 'speaking' ? strings.speaking : strings.listening}
              </Text>
              <Text style={styles.subtitleText}>{doctorSpeech}</Text>
            </View>
          </View>
        )}

        {/* FULL CHAT LAYOUT */}
        {mode !== 'live' && consultationMode === 'chat' && (
          <View style={styles.fullChatContainer}>
            <FlatList
              ref={listRef}
              data={chatLog}
              renderItem={renderChatItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatLogContent}
            />

            <View style={styles.chatInputBar}>
              <TextInput
                style={[styles.chatTextInput, { color: '#fff', borderColor: colors.border }]}
                placeholder={strings.chatPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={chatText}
                onChangeText={setChatText}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: colors.primary }]} onPress={handleSendChat}>
                <Text style={styles.sendText}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User Camera Simulation Overlay */}
        {mode !== 'live' && consultationMode === 'video' && !isCamOff && (
          <View style={[styles.userViewport, { borderColor: colors.border }]}>
            <View style={styles.userCameraSim}>
              <Text style={styles.userIconEmoji}>👤</Text>
              <Text style={styles.userLabel}>{strings.userLive}</Text>
            </View>
          </View>
        )}

        {/* WEBINAR LIVE ROOM PARTICIPANT GRID & CHAT OVERLAYS */}
        {mode === 'live' && (
          <View style={styles.liveGridOverlay}>
            <ScrollView contentContainerStyle={styles.liveGridContent}>
              <Text style={styles.gridSectionTitle}>Interactive Panel</Text>
              <View style={styles.participantGrid}>
                <View style={styles.pCard}>
                  <Text style={styles.pEmoji}>👤</Text>
                  <Text style={styles.pName} numberOfLines={1}>{profileName} (You)</Text>
                  <Text style={styles.pStatus}>{isMuted ? 'Muted' : 'Speaking'}</Text>
                </View>
                <View style={styles.pCard}>
                  <Text style={styles.pEmoji}>👤</Text>
                  <Text style={styles.pName} numberOfLines={1}>David Miller</Text>
                  <Text style={styles.pStatus}>Listening</Text>
                </View>
                <View style={styles.pCard}>
                  <Text style={styles.pEmoji}>👤</Text>
                  <Text style={styles.pName} numberOfLines={1}>Sarah Connor</Text>
                  <Text style={styles.pStatus}>Listening</Text>
                </View>
                <View style={styles.pCard}>
                  <Text style={styles.pEmoji}>👤</Text>
                  <Text style={styles.pName} numberOfLines={1}>Amit Patel</Text>
                  <Text style={styles.pStatus}>Listening</Text>
                </View>
              </View>

              <Text style={styles.gridSectionTitle}>Group Live Chat</Text>
              <View style={[styles.liveChatContainer, { borderColor: colors.border }]}>
                <FlatList
                  ref={listRef}
                  data={chatLog}
                  renderItem={renderChatItem}
                  keyExtractor={item => item.id}
                  style={styles.liveChatList}
                  nestedScrollEnabled={true}
                />
                <View style={styles.chatInputBar}>
                  <TextInput
                    style={[styles.chatTextInput, { color: '#fff', borderColor: colors.border }]}
                    placeholder={strings.groupChatPlaceholder}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={chatText}
                    onChangeText={setChatText}
                    onSubmitEditing={handleSendChat}
                  />
                  <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: colors.primary }]} onPress={handleSendChat}>
                    <Text style={styles.sendText}>➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Dynamic Chat Overlay Drawer (for Video/Voice Mode on AI Call) */}
        {mode !== 'live' && consultationMode !== 'chat' && showChatOverlay && (
          <View style={[styles.chatOverlay, { backgroundColor: 'rgba(5, 31, 29, 0.96)', borderColor: colors.border }]}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>{strings.chat}</Text>
              <TouchableOpacity style={styles.closeChatBtn} onPress={() => setShowChatOverlay(false)}>
                <Text style={styles.closeChatIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              ref={listRef}
              data={chatLog}
              renderItem={renderChatItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatLogContent}
            />

            <View style={styles.chatInputBar}>
              <TextInput
                style={[styles.chatTextInput, { color: '#fff', borderColor: colors.border }]}
                placeholder={strings.chatPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={chatText}
                onChangeText={setChatText}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity style={[styles.chatSendBtn, { backgroundColor: colors.primary }]} onPress={handleSendChat}>
                <Text style={styles.sendText}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Quick response chip panel (AI modes: video & voice only) */}
      {mode !== 'live' && consultationMode !== 'chat' && (
        <View style={styles.responsesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {dynamicChips.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.responseChip, { borderColor: colors.border }]}
                onPress={() => handleUserReply(item.text, item.reply)}
                disabled={aiStatus !== 'speaking'}
              >
                <Text style={styles.chipText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Footer Controls Bar */}
      <View style={styles.footerControls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && { backgroundColor: '#ef4444' }]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🎙️❌' : '🎙️'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? strings.unmute : strings.mute}</Text>
        </TouchableOpacity>

        {/* Camera toggle (only active for Video modes) */}
        {(mode === 'live' || consultationMode === 'video') ? (
          <TouchableOpacity
            style={[styles.controlBtn, isCamOff && { backgroundColor: '#ef4444' }]}
            onPress={() => setIsCamOff(!isCamOff)}
          >
            <Text style={styles.controlIcon}>{isCamOff ? '📹❌' : '📹'}</Text>
            <Text style={styles.controlLabel}>{isCamOff ? strings.camOn : strings.camOff}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.controlBtn, { opacity: 0.3 }]}>
            <Text style={styles.controlIcon}>📹</Text>
            <Text style={styles.controlLabel}>{strings.camOff}</Text>
          </View>
        )}

        {/* Chat Drawer Overlay Toggle (only active for Video/Voice modes) */}
        {mode !== 'live' && consultationMode !== 'chat' ? (
          <TouchableOpacity
            style={[styles.controlBtn, showChatOverlay && { backgroundColor: colors.primary }]}
            onPress={() => setShowChatOverlay(!showChatOverlay)}
          >
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>{strings.chat}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.controlBtn, { opacity: 0.3 }]}>
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>{strings.chat}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={() => setShowLeaveModal(true)}
        >
          <Text style={styles.controlIcon}>🛑</Text>
          <Text style={styles.controlLabel}>{strings.endCall}</Text>
        </TouchableOpacity>
      </View>

      {/* Non-blocking Custom Leave Confirmation Modal */}
      {showLeaveModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {mode === 'live' ? 'Leave Live Webinar' : 'End Clinical Session'}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              {mode === 'live' 
                ? 'Are you sure you want to disconnect from this webinar consultation?' 
                : 'Are you sure you want to hang up and terminate your clinical AI session?'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                onPress={() => {
                  setShowLeaveModal(false);
                  navigation.navigate('Home');
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                  {mode === 'live' ? 'Disconnect' : 'End Call'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 10
  },
  backIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700'
  },
  topTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginLeft: 8
  },
  languageSelectors: {
    flexDirection: 'row',
    gap: 6
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  langText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#031412',
    height: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: 'transparent'
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700'
  },
  viewportContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  doctorViewport: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  voiceViewport: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  voiceDoctorCard: {
    alignItems: 'center',
    marginBottom: 40
  },
  voiceAvatar: {
    fontSize: 72,
    marginBottom: 10
  },
  voiceDoctorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff'
  },
  voiceSpecialty: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 80,
    marginBottom: 60
  },
  waveBar: {
    width: 6,
    backgroundColor: '#38bdf8',
    borderRadius: 3
  },
  avatarPulsingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 260,
    marginBottom: 50
  },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 180,
    borderRadius: 75,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#38bdf8'
  },
  speakingGlowRing: {
    position: 'absolute',
    width: 170,
    height: 200,
    borderRadius: 85,
    borderWidth: 2.5,
    borderColor: '#38bdf8',
    opacity: 0.6
  },
  doctorFaceWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 140,
    height: 220
  },
  /* ---- Body / Lab coat ---- */
  doctorBody: {
    width: 140,
    height: 70,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginTop: -5
  },
  labCoatLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 70,
    backgroundColor: '#f0f5ff'
  },
  labCoatRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 56,
    height: 70,
    backgroundColor: '#f0f5ff'
  },
  labCoatCenter: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 70,
    backgroundColor: '#e8edf7'
  },
  stethoscope: {
    position: 'absolute',
    top: 10,
    left: 30,
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#b0c4de'
  },
  /* ---- Neck ---- */
  doctorNeck: {
    width: 36,
    height: 22,
    backgroundColor: '#c8856a',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginBottom: -4,
    zIndex: 2
  },
  /* ---- Face ---- */
  doctorFace: {
    width: 118,
    height: 140,
    borderRadius: 56,
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  /* ---- Hair ---- */
  doctorHair: {
    position: 'absolute',
    top: 0,
    width: 118,
    height: 52,
    borderTopLeftRadius: 59,
    borderTopRightRadius: 59
  },
  hairSideLeft: {
    position: 'absolute',
    left: 0,
    top: 20,
    width: 14,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 8
  },
  hairSideRight: {
    position: 'absolute',
    right: 0,
    top: 20,
    width: 14,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomRightRadius: 8
  },
  foreheadHighlight: {
    position: 'absolute',
    top: 42,
    width: 40,
    height: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  /* ---- Eyebrows ---- */
  eyebrowsRow: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 48,
    marginBottom: 4
  },
  eyebrow: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2d1a0a'
  },
  /* ---- Eyes ---- */
  eyesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6
  },
  eyeSocket: {
    width: 26,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  eyeWhite: {
    width: 22,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  eyelid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c8856a',
    zIndex: 2
  },
  eyePupil: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyeHighlight: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    position: 'absolute',
    top: 1,
    right: 1
  },
  /* ---- Nose ---- */
  noseContainer: {
    alignItems: 'center',
    marginBottom: 6
  },
  noseBridge: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)'
  },
  nostrilsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  nostril: {
    width: 7,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  /* ---- Mouth / Lip-sync ---- */
  mouthContainer: {
    alignItems: 'center',
    overflow: 'visible'
  },
  upperLip: {
    width: 34,
    height: 6,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#a0503a'
  },
  mouthOpening: {
    width: 30,
    borderRadius: 2
  },
  lowerLip: {
    width: 34,
    height: 7,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#b0604a'
  },
  /* ---- Cheeks & chin ---- */
  cheekLeft: {
    position: 'absolute',
    left: 8,
    bottom: 28,
    width: 22,
    height: 16,
    borderRadius: 11,
    backgroundColor: 'rgba(220, 100, 80, 0.25)'
  },
  cheekRight: {
    position: 'absolute',
    right: 8,
    bottom: 28,
    width: 22,
    height: 16,
    borderRadius: 11,
    backgroundColor: 'rgba(220, 100, 80, 0.25)'
  },
  chin: {
    position: 'absolute',
    bottom: 10,
    width: 40,
    height: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)'
  },
  /* Legacy - kept for voice/live mode emoji avatar */
  doctorAvatarIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  avatarEmoji: {
    fontSize: 48
  },
  liveIndicatorContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6
  },
  liveLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800'
  },
  doctorNameTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  subtitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11
  },
  speechStatusLabel: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  subtitleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18
  },
  liveMetaOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  liveMetaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },
  userViewport: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 90,
    height: 130,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#114a44',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  userCameraSim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  userIconEmoji: {
    fontSize: 32,
    color: '#fff'
  },
  userLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    fontSize: 7,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2
  },
  fullChatContainer: {
    flex: 1,
    backgroundColor: '#031412',
    borderRadius: 12,
    overflow: 'hidden'
  },
  chatOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 10
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8
  },
  chatTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800'
  },
  closeChatBtn: {
    paddingHorizontal: 6
  },
  closeChatIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600'
  },
  chatLogContent: {
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  chatBubbleContainer: {
    marginVertical: 4,
    maxWidth: '85%'
  },
  chatLeft: {
    alignSelf: 'flex-start'
  },
  chatRight: {
    alignSelf: 'flex-end'
  },
  chatBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5
  },
  chatSenderName: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2
  },
  chatBubbleText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600'
  },
  chatInputBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#031412'
  },
  chatTextInput: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800'
  },
  responsesContainer: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8
  },
  responseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8
  },
  chipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  footerControls: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#031412',
    paddingBottom: 4
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 50,
    borderRadius: 8
  },
  controlIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  controlLabel: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    opacity: 0.8
  },
  endCallBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },

  // Live webinar room styles
  liveGridOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 31, 29, 0.85)'
  },
  liveGridContent: {
    padding: 12
  },
  gridSectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  pCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center'
  },
  pEmoji: {
    fontSize: 20,
    marginBottom: 2
  },
  pName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  pStatus: {
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2
  },
  liveChatContainer: {
    height: 250,
    borderRadius: 8,
    borderWidth: 0.5,
    backgroundColor: 'rgba(3, 20, 18, 0.95)',
    overflow: 'hidden'
  },
  liveChatList: {
    flex: 1,
    padding: 8
  },

  // Custom Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '700'
  }
});
