import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import { ExtendedEvent } from './src/types';
import PreferencesSetupScreen from './src/screens/PreferencesSetupScreen';

export type RootStackParamList = {
  Auth: undefined;
  Preferences: undefined;
  Home: undefined;
  EventDetail: { event: ExtendedEvent };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Auth"
        screenOptions={{
          headerStyle: { backgroundColor: '#003366' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Duke Events' }}
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen}
          options={{ title: 'Event Details' }}
        />
        <Stack.Screen 
          name="Preferences" 
          component={PreferencesSetupScreen}
          options={{ title: 'Set Up Your Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}