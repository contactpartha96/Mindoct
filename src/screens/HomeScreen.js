import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme';
import {
  setRole,
  setSelectedClass,
  toggleTaskAndSync,
  answerQuizQuestionAndSync,
  resetQuiz,
  setSelectedDoctorId
} from '../store';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  // Redux Selectors
  const activeRole = useSelector((state) => state.auth.activeRole);
  const loggedInUser = useSelector((state) => state.auth.loggedInUser);
  const profileName = useSelector((state) => state.auth.profileName);
  const profileDetails = useSelector((state) => state.auth.profileDetails);
  
  const selectedClass = useSelector((state) => state.curriculum.selectedClass); // Category selection
  const subjects = useSelector((state) => state.curriculum.subjects[selectedClass] || []); // selfCareModules
  const meetings = useSelector((state) => state.curriculum.meetings);
  const tasks = useSelector((state) => state.curriculum.tasks);
  const quiz = useSelector((state) => state.curriculum.quiz);
  const selectedDoctorId = useSelector((state) => state.curriculum.selectedDoctorId);
  const doctors = useSelector((state) => state.curriculum.doctors);

  const handleRoleChange = (role) => {
    dispatch(setRole(role));
  };

  const handleTaskToggle = (id) => {
    dispatch(toggleTaskAndSync(id));
  };

  const handleQuizAnswer = (optionIdx) => {
    const currentQ = quiz.questions[quiz.currentQuestionIndex];
    if (!currentQ) return;

    const isCorrect = optionIdx === currentQ.correctIndex;
    dispatch(answerQuizQuestionAndSync(isCorrect));

    Alert.alert(
      isCorrect ? '🩺 Well Done!' : '❌ Let\'s Review',
      currentQ.explanation,
      [{ text: 'OK' }]
    );
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return { backgroundColor: colors.badgeAdmin, color: colors.primary };
      case 'doctor': return { backgroundColor: colors.badgeTeacher, color: colors.secondary };
      default: return { backgroundColor: colors.badgeStudent, color: '#3b82f6' };
    }
  };

  const roleHierarchy = {
    admin: ['admin', 'doctor', 'user'],
    doctor: ['doctor', 'user'],
    user: ['user']
  };
  const switchableRoles = roleHierarchy[loggedInUser] || ['user'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>🩺</Text>
            <Text style={[styles.logoText, { color: colors.text }]}>Mindoct</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>AI-Powered Wellness Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.iconEmoji}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profileName}</Text>
              <Text style={[styles.profileDetails, { color: colors.textMuted }]}>{profileDetails}</Text>
            </View>
            <View style={[styles.roleBadge, getRoleBadgeStyle(activeRole)]}>
              <Text style={[styles.roleBadgeText, { color: getRoleBadgeStyle(activeRole).color }]}>
                {activeRole.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Role Quick Selector */}
        {switchableRoles.length > 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Switch Role Portal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelectorScroll}>
              {switchableRoles.map((role) => {
                const isActive = activeRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleChip,
                      { 
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => handleRoleChange(role)}
                  >
                    <Text style={[styles.roleChipText, { color: isActive ? '#fff' : colors.text }]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Dashboard Widgets Based on Role */}
        
        {/* USER VIEW */}
        {activeRole === 'user' && (
          <View>
            {/* Standard Category Selector */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classSelectorScroll}>
              {['Mindfulness', 'Stress Relief', 'Sleep Quality'].map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.classChip,
                      { 
                        backgroundColor: isSelected ? colors.secondary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => dispatch(setSelectedClass(cls))}
                  >
                    <Text style={[styles.classChipText, { color: isSelected ? '#fff' : colors.text }]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Self Care Modules */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Modules ({selectedClass})</Text>
            <View style={styles.subjectsGrid}>
              {subjects.map((sub, idx) => (
                <View 
                  key={idx} 
                  style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={styles.subjectEmoji}>
                    {sub.icon === 'wind' ? '💨' : sub.icon === 'brain' ? '🧠' : sub.icon === 'moon' ? '🌙' : sub.icon === 'sun' ? '☀️' : sub.icon === 'edit' ? '📝' : '❤️'}
                  </Text>
                  <Text style={[styles.subjectName, { color: colors.text }]}>{sub.name}</Text>
                  <Text style={[styles.subjectChapters, { color: colors.textMuted }]}>
                    {sub.chaptersCount} Self-care Guides
                  </Text>
                </View>
              ))}
            </View>

            {/* Quizzes Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Wellness Assessment</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.quizHeader}>
                <Text style={[styles.quizTitle, { color: colors.text }]}>🩺 General Well-being Assessment</Text>
                <Text style={[styles.quizScore, { color: colors.primary }]}>Score: {quiz.score}</Text>
              </View>
              
              {quiz.currentQuestionIndex < quiz.questions.length ? (
                <View>
                  <Text style={[styles.quizQuestion, { color: colors.text }]}>
                    Q: {quiz.questions[quiz.currentQuestionIndex].question}
                  </Text>
                  {quiz.questions[quiz.currentQuestionIndex].options.map((opt, oIdx) => (
                    <TouchableOpacity
                      key={oIdx}
                      style={[styles.quizOption, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => handleQuizAnswer(oIdx)}
                    >
                      <Text style={[styles.quizOptionText, { color: colors.text }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.quizEnded}>
                  <Text style={[styles.quizFinishedText, { color: colors.success }]}>🎉 Assessment Completed!</Text>
                  <Text style={[styles.quizFinalScore, { color: colors.text }]}>
                    You completed the checkup check. Score: {quiz.score * 10} points.
                  </Text>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={() => dispatch(resetQuiz())}
                  >
                    <Text style={styles.btnText}>Retake Assessment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* AI Consultation Room */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Doctor Portal</Text>
            
            {/* Doctor Selection List */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorSelectorScroll}>
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.doctorCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1
                      }
                    ]}
                    onPress={() => dispatch(setSelectedDoctorId(doc.id))}
                  >
                    <View style={[styles.doctorAvatarContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={styles.doctorAvatarEmoji}>{doc.avatar}</Text>
                    </View>
                    <View style={styles.doctorCardInfo}>
                      <Text style={[styles.doctorCardName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
                      <Text style={[styles.doctorCardSpecialty, { color: colors.textMuted }]} numberOfLines={1}>{doc.specialty}</Text>
                      <View style={styles.doctorLangRow}>
                        {doc.languages.map(lang => (
                          <Text key={lang} style={[styles.doctorLangBadge, { backgroundColor: colors.secondary + '20', color: colors.secondary }]}>
                            {lang.toUpperCase()}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.meetingHeader}>
                <Text style={[styles.meetingTitle, { color: colors.text }]}>🩺 Clinical Consultation Session</Text>
                <Text style={[styles.badgeText, { color: colors.primary }]}>Active</Text>
              </View>
              <Text style={[styles.meetingMeta, { color: colors.textMuted }]}>
                Connect via Video call, Voice call, or Text chat
              </Text>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
                onPress={() => navigation.navigate('Consultation', { doctorId: selectedDoctorId })}
              >
                <Text style={styles.btnText}>Start AI Consultation</Text>
              </TouchableOpacity>
            </View>

            {/* Live Meetings */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Consultation Live Room</Text>
            {meetings.filter(m => m.standard === selectedClass).map((meeting) => (
              <View 
                key={meeting.id} 
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.meetingHeader}>
                  <Text style={[styles.meetingTitle, { color: colors.text }]}>{meeting.title}</Text>
                  <Text style={[styles.badgeText, { color: colors.secondary }]}>Live</Text>
                </View>
                <Text style={[styles.meetingMeta, { color: colors.textMuted }]}>
                  ⏰ {meeting.time}  •  👤 {meeting.teacher}
                </Text>
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: colors.secondary, marginTop: 8 }]}
                  onPress={() => navigation.navigate('Consultation', {
                    mode: 'live',
                    meetingId: meeting.id,
                    doctorName: meeting.teacher,
                    roomTitle: meeting.title
                  })}
                >
                  <Text style={styles.btnText}>Join Consultation Room</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Homework Tasks */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Wellness Goals</Text>
            {tasks.filter(t => t.standard === selectedClass).map((task) => (
              <TouchableOpacity 
                key={task.id} 
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleTaskToggle(task.id)}
              >
                <View style={styles.taskRow}>
                  <View style={[
                    styles.checkbox, 
                    { 
                      borderColor: colors.border, 
                      backgroundColor: task.completed ? colors.success : 'transparent' 
                    }
                  ]}>
                    {task.completed && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <View style={styles.taskDetails}>
                    <Text style={[
                      styles.taskTitle, 
                      { 
                        color: colors.text,
                        textDecorationLine: task.completed ? 'line-through' : 'none' 
                      }
                    ]}>
                      {task.title}
                    </Text>
                    <Text style={[styles.taskMeta, { color: colors.textMuted }]}>
                      Due: {task.deadline}  •  {task.subject}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* DOCTOR ROOM & ADMIN HUB VIEW */}
        {(activeRole === 'doctor' || activeRole === 'admin') && (loggedInUser === 'doctor' || loggedInUser === 'admin') && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.metricEmoji}>👤</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>24</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Patients</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.metricEmoji}>🩺</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>6</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Doctors</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.metricEmoji}>❤️</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>12</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Reviews</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.metricEmoji}>📂</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>42</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Guides</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Console</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.consoleDesc, { color: colors.textMuted }]}>
                Use these tools to schedule counseling sessions and publish wellness modules.
              </Text>
              <TouchableOpacity 
                style={[styles.consoleBtn, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert('Action Triggered', 'Wellness task creation form...')}
              >
                <Text style={styles.btnText}>✍️ Create Daily Goal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.consoleBtn, { backgroundColor: colors.secondary, marginTop: 8 }]}
                onPress={() => Alert.alert('Action Triggered', 'Consultation schedule form...')}
              >
                <Text style={styles.btnText}>📅 Schedule Consultation</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.consoleBtn, { backgroundColor: colors.success, marginTop: 8 }]}
                onPress={() => Alert.alert('Action Triggered', 'Self-care guide upload dialog...')}
              >
                <Text style={styles.btnText}>📂 Upload Self-Care Guide</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button for AI Assistant */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Chat')}
      >
        <Text style={styles.fabIcon}>💬</Text>
        <Text style={styles.fabLabel}>Mind Help</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Safe spacing for FAB
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileDetails: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleSelectorScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  classSelectorScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subjectCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  subjectEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  subjectChapters: {
    fontSize: 11,
    marginTop: 2,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quizScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  quizOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  quizOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quizEnded: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quizFinishedText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  quizFinalScore: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  meetingTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meetingMeta: {
    fontSize: 12,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '23%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: '600',
  },
  consoleDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  consoleBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  chartMock: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chartBar: {
    width: '12%',
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorEmoji: {
    fontSize: 28,
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tutorDetails: {
    fontSize: 12,
  },
  tutorBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tutorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  fabLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  doctorSelectorScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  doctorCard: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1.5,
  },
  doctorAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  doctorAvatarEmoji: {
    fontSize: 22,
  },
  doctorCardInfo: {
    flex: 1,
  },
  doctorCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  doctorCardSpecialty: {
    fontSize: 10,
    marginTop: 1,
  },
  doctorLangRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  doctorLangBadge: {
    fontSize: 8,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
});
