import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme';
import { logoutUser, loginUser } from '../store';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const dispatch = useDispatch();

  // Redux Selectors
  const activeRole = useSelector((state) => state.auth.activeRole);
  const loggedInUser = useSelector((state) => state.auth.loggedInUser);
  const profileName = useSelector((state) => state.auth.profileName);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      Alert.alert('Session Terminated', 'Successfully cleared active account data.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const handleQuickLogin = async (role) => {
    const emailMap = {
      admin: { email: 'admin@mindoct.com', pass: 'admin123' },
      doctor: { email: 'doctor@mindoct.com', pass: 'doctor123' },
      user: { email: 'user@mindoct.com', pass: 'user123' }
    };
    const credentials = emailMap[role];
    if (credentials) {
      try {
        await dispatch(loginUser(credentials.email, credentials.pass));
        Alert.alert('Authenticated', `Session loaded as ${role.toUpperCase()} successfully.`, [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
      } catch (err) {
        Alert.alert('Auth Error', err.message);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Appearance Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                Switch between dark and light themes
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* User Account */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Session Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loggedInUser ? (
            <View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userIcon}>👤</Text>
                <View style={styles.userInfoDetails}>
                  <Text style={[styles.userName, { color: colors.text }]}>{profileName}</Text>
                  <Text style={[styles.userRole, { color: colors.textMuted }]}>
                    Role: {activeRole.toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.error, marginTop: 12 }]}
                onPress={handleLogout}
              >
                <Text style={styles.btnText}>Sign Out Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noUserContainer}>
              <Text style={[styles.noUserText, { color: colors.textMuted }]}>No active account loaded.</Text>
            </View>
          )}
        </View>

        {/* Demo Credentials Guide */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Demo Logins</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.demoIntro, { color: colors.textMuted }]}>
            Click any role below to quickly sign in as that user:
          </Text>

          {/* Admin Account */}
          <TouchableOpacity
            style={[styles.demoRow, { borderColor: colors.border }]}
            onPress={() => handleQuickLogin('admin')}
          >
            <View style={styles.demoDetails}>
              <Text style={[styles.demoBadge, { backgroundColor: colors.badgeAdmin, color: colors.primary }]}>
                ADMIN
              </Text>
              <Text style={[styles.demoEmail, { color: colors.text }]}>admin@mindoct.com</Text>
            </View>
            <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: admin123</Text>
          </TouchableOpacity>

          {/* Doctor Account */}
          <TouchableOpacity
            style={[styles.demoRow, { borderColor: colors.border }]}
            onPress={() => handleQuickLogin('doctor')}
          >
            <View style={styles.demoDetails}>
              <Text style={[styles.demoBadge, { backgroundColor: colors.badgeTeacher, color: colors.secondary }]}>
                DOCTOR
              </Text>
              <Text style={[styles.demoEmail, { color: colors.text }]}>doctor@mindoct.com</Text>
            </View>
            <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: doctor123</Text>
          </TouchableOpacity>

          {/* User Account */}
          <TouchableOpacity
            style={[styles.demoRow, { borderColor: colors.border }]}
            onPress={() => handleQuickLogin('user')}
          >
            <View style={styles.demoDetails}>
              <Text style={[styles.demoBadge, { backgroundColor: colors.badgeStudent, color: '#3b82f6' }]}>
                USER
              </Text>
              <Text style={[styles.demoEmail, { color: colors.text }]}>user@mindoct.com</Text>
            </View>
            <Text style={[styles.demoPass, { color: colors.textMuted }]}>pass: user123</Text>
          </TouchableOpacity>

        </View>

        {/* Corporate Legal Footer */}
        <Text style={[styles.legalText, { color: colors.textMuted }]}>
          Mindoct © 2026. Powered by Darsh Creatives Private Limited.
        </Text>

      </ScrollView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 14,
    paddingVertical: 4,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  userInfoDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
  },
  noUserContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noUserText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  demoIntro: {
    fontSize: 12,
    marginBottom: 14,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  demoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  demoBadge: {
    fontSize: 8,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
    textAlign: 'center',
    minWidth: 56,
    overflow: 'hidden',
  },
  demoEmail: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  demoPass: {
    fontSize: 11,
  },
  legalText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 14,
  },
});
