import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useTheme } from '../theme';
import { loginUser, registerUser } from '../store';

export default function AuthScreen() {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user'); // 'user', 'doctor', 'admin'
  const [loading, setLoading] = useState(false);

  // Email format validation helper
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedName = name.trim();

    // Input validations
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Error', 'Please fill in all credentials fields.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup' && !trimmedName) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    setLoading(false);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await dispatch(loginUser(trimmedEmail, trimmedPassword));
        Alert.alert('Authenticated', `Successfully logged in!`);
      } else {
        await dispatch(registerUser(trimmedEmail, trimmedPassword, trimmedName, role));
        Alert.alert('Registered', `Successfully created ${role.toUpperCase()} account!`);
      }
    } catch (err) {
      Alert.alert('Authentication Failed', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setLoading(true);
    try {
      await dispatch(loginUser(demoEmail, demoPass));
      Alert.alert('Authenticated', `Demo session initialized successfully!`);
    } catch (err) {
      Alert.alert('Demo Auth Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Logo Brand */}
          <View style={styles.logoContainer}>
            <View style={[styles.owlLogo, { backgroundColor: colors.primary }]}>
              <Text style={styles.owlIcon}>🩺</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>Mindoct</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              AI-Powered Mental Wellness Gate
            </Text>
          </View>

          {/* Tab Selection */}
          <View style={[styles.tabContainer, { backgroundColor: isDark ? '#0f2d2a' : '#e6f4f1' }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'signin' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setMode('signin')}
            >
              <Text style={[
                styles.tabText,
                { color: mode === 'signin' ? '#ffffff' : colors.textMuted }
              ]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'signup' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setMode('signup')}
            >
              <Text style={[
                styles.tabText,
                { color: mode === 'signup' ? '#ffffff' : colors.textMuted }
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {mode === 'signin' ? 'Access your Wellness Desk' : 'Create User Account'}
            </Text>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. user@mindoct.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Select Role</Text>
                <View style={styles.roleChips}>
                  {['user', 'doctor'].map((r) => {
                    const isActive = role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive ? colors.primary : (isDark ? '#143834' : '#eaf6f4'),
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setRole(r)}
                      >
                        <Text style={[
                          styles.chipText,
                          { color: isActive ? '#ffffff' : colors.text }
                        ]}>
                          {r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'signin' ? 'Authenticate Session' : 'Register Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Demo Credentials Guide */}
          <View style={styles.demoGuideContainer}>
            <Text style={[styles.demoTitle, { color: colors.text }]}>
              💡 Demo Accounts Quick Login
            </Text>
            <Text style={[styles.demoSubtitle, { color: colors.textMuted }]}>
              Tap any role credentials box below to log in instantly.
            </Text>

            {/* User */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleQuickLogin('user@mindoct.com', 'user123')}
            >
              <View style={styles.demoCardLeft}>
                <Text style={[styles.roleBadge, { backgroundColor: '#3b82f6', color: '#fff' }]}>USER</Text>
                <Text style={[styles.demoEmail, { color: colors.text }]}>user@mindoct.com</Text>
              </View>
              <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: user123</Text>
            </TouchableOpacity>

            {/* Doctor */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleQuickLogin('doctor@mindoct.com', 'doctor123')}
            >
              <View style={styles.demoCardLeft}>
                <Text style={[styles.roleBadge, { backgroundColor: '#8b5cf6', color: '#fff' }]}>DOCTOR</Text>
                <Text style={[styles.demoEmail, { color: colors.text }]}>doctor@mindoct.com</Text>
              </View>
              <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: doctor123</Text>
            </TouchableOpacity>

            {/* Admin */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleQuickLogin('admin@mindoct.com', 'admin123')}
            >
              <View style={styles.demoCardLeft}>
                <Text style={[styles.roleBadge, { backgroundColor: '#f59e0b', color: '#fff' }]}>ADMIN</Text>
                <Text style={[styles.demoEmail, { color: colors.text }]}>admin@mindoct.com</Text>
              </View>
              <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: admin123</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25
  },
  owlLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  owlIcon: {
    fontSize: 32
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500'
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700'
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginBottom: 25
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14
  },
  roleChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center'
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700'
  },
  submitButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  submitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  demoGuideContainer: {
    marginTop: 10
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2
  },
  demoSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8
  },
  demoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden'
  },
  demoEmail: {
    fontSize: 12,
    fontWeight: '600'
  },
  demoPass: {
    fontSize: 11,
    fontWeight: '500'
  }
});
