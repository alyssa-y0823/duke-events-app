import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Alert 
} from 'react-native';
import { ExtendedEvent } from '../services/eventService';

interface EventDetailScreenProps {
  navigation: any;
  route: {
    params: {
      event: ExtendedEvent;
    };
  };
}

export default function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const { event } = route.params;
  const [isSaved, setIsSaved] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSaveEvent = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Event Removed' : 'Event Saved',
      isSaved ? 'Event removed from your saved events' : 'Event saved to your list'
    );
  };

  const handleRegister = () => {
    if (event.registrationUrl) {
      Linking.openURL(event.registrationUrl).catch(() => {
        Alert.alert('Error', 'Could not open registration link');
      });
    } else {
      Alert.alert('Registration', 'No registration link available for this event');
    }
  };

  const handleContactOrganizer = () => {
    if (event.contactEmail) {
      Linking.openURL(`mailto:${event.contactEmail}`).catch(() => {
        Alert.alert('Error', 'Could not open email client');
      });
    } else {
      Alert.alert('Contact', 'No contact information available');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organization}>{event.organization}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>
          <Text style={styles.dateText}>{formatDate(event.date)}</Text>
          <Text style={styles.timeText}>{event.time}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where</Text>
          <Text style={styles.locationText}>{event.location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.descriptionText}>
            {event.description || 'No description available for this event.'}
          </Text>
        </View>

        {event.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {event.capacity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            <Text style={styles.capacityText}>{event.capacity} people</Text>
          </View>
        )}

        {event.contactEmail && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity onPress={handleContactOrganizer}>
              <Text style={styles.contactText}>{event.contactEmail}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton, isSaved && styles.savedButton]}
          onPress={handleSaveEvent}
        >
          <Text style={[styles.actionButtonText, isSaved && styles.savedButtonText]}>
            {isSaved ? 'Saved' : 'Save Event'}
          </Text>
        </TouchableOpacity>

        {event.registrationUrl && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.registerButton]}
            onPress={handleRegister}
          >
            <Text style={styles.actionButtonText}>Register</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 15,
  },
  categoryText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
    lineHeight: 34,
  },
  organization: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#003366',
    fontWeight: '500',
  },
  capacityText: {
    fontSize: 16,
    color: '#333',
  },
  contactText: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#003366',
  },
  savedButton: {
    backgroundColor: '#003366',
  },
  registerButton: {
    backgroundColor: '#FFD700',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
  },
  savedButtonText: {
    color: 'white',
  },
});