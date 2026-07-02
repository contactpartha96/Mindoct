import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './store';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import { ThemeProvider } from './theme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const loggedInUser = useSelector((state) => state.auth.loggedInUser);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loggedInUser === null ? (
          // Session is unauthenticated: route exclusively to Auth Gate Screen
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          // Session is authenticated: unlock all learning desk portals
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Consultation" component={ConsultationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // Safe init check
  useEffect(() => {
    // Native Firebase & SDK handlers auto-bootstrap via services/firebase module import loader
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
