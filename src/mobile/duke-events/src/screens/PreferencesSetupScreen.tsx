import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesSetupScreenProps {
  navigation: any;
}

export default function PreferencesSetupScreen({ navigation }: PreferencesSetupScreenProps) {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

  const [majors, setMajors] = useState<string[]>([
    'Computer Science', 'Other' // Initial fallback
  ]);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        // Use your backend URL (e.g. localhost or IP if on device)
        const response = await fetch('http://localhost:3000/events/majors');
        if (response.ok) {
          const data = await response.json();
          setMajors(data);
        } else {
          console.error('Failed to fetch majors');
        }
      } catch (error) {
        console.error('Error loading majors:', error);
      }
    };
    fetchMajors();
  }, []);

  const interests = [
    { id: 'academic', label: 'Academic', icon: '📚' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'arts', label: 'Arts & Culture', icon: '🎨' },
    { id: 'social', label: 'Social Events', icon: '🎉' },
    { id: 'professional', label: 'Career & Professional', icon: '💼' },
    { id: 'service', label: 'Community Service', icon: '🤝' },
    { id: 'wellness', label: 'Health & Wellness', icon: '🧘' },
    { id: 'tech', label: 'Technology', icon: '💻' },
  ];

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  const handleSavePreferences = async () => {
    if (!selectedYear) {
      Alert.alert('Missing Information', 'Please select your year');
      return;
    }
    if (!selectedMajor) {
      Alert.alert('Missing Information', 'Please select your major');
      return;
    }
    if (selectedInterests.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one interest');
      return;
    }

    try {
      const preferences = {
        year: selectedYear,
        major: selectedMajor,
        interests: selectedInterests,
        setupComplete: true,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      console.log('Preferences saved:', preferences);

      // Navigate to Home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Duke Events! 👋</Text>
            <Text style={styles.subtitle}>
              Let's personalize your experience. Tell us about yourself to get event recommendations tailored to your interests.
            </Text>
          </View>

          {/* Year Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What year are you?</Text>
            <View style={styles.optionsContainer}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.optionButton,
                    selectedYear === year && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedYear === year && styles.optionTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Major Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your major?</Text>
            <View style={styles.optionsContainer}>
              {majors.map((major) => (
                <TouchableOpacity
                  key={major}
                  style={[
                    styles.optionButton,
                    selectedMajor === major && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedMajor(major)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedMajor === major && styles.optionTextSelected,
                    ]}
                  >
                    {major}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What interests you? (Select all that apply)</Text>
            <View style={styles.interestsContainer}>
              {interests.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestCard,
                    selectedInterests.includes(interest.id) && styles.interestCardSelected,
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                >
                  <Text style={styles.interestIcon}>{interest.icon}</Text>
                  <Text
                    style={[
                      styles.interestText,
                      selectedInterests.includes(interest.id) && styles.interestTextSelected,
                    ]}
                  >
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePreferences}
          >
            <Text style={styles.saveButtonText}>Continue to Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180, // Extra padding to ensure content scrolls above footer
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  optionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  interestCardSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#003366',
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  interestTextSelected: {
    color: '#003366',
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
});