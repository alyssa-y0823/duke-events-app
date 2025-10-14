import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AuthScreenProps {
  navigation: any; // We'll type this properly later
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const handleLogin = () => {
    navigation.navigate('Preferences');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duke Events</Text>
      <Text style={styles.subtitle}>Connect with campus events</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In with Duke</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003366', // Duke blue
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCE7FF',
    marginBottom: 50,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFD700', // Duke gold
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#003366',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});