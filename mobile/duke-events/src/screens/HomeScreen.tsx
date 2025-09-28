import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { eventService, ExtendedEvent } from '../services/eventService';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventData = filter === 'upcoming' 
        ? await eventService.getUpcomingEvents()
        : await eventService.getAllEvents();
      setEvents(eventData);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with logout */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Duke Events</Text>
        <TouchableOpacity 
          style={styles.logoutButtonTopRight}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.logoutTextTopRight}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.activeFilter]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All Events
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003366" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <ScrollView style={styles.eventsList} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
          {events.map((event, index) => (
            <TouchableOpacity 
            key={event.id && event.id !== '-1' ? event.id : `event-${index}`} 
            onPress={() => navigation.navigate('EventDetail', { event })}
            style={styles.eventCard}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventCategory}>{event.category}</Text>
              </View>
              
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
              
              <View style={styles.eventDetails}>
                <Text style={styles.eventTime}>
                  {formatDate(event.date)} • {event.time}
                </Text>
                <Text style={styles.eventLocation}>
                {typeof event.location === 'string' ? event.location : event.location || 'Location TBD'}
                </Text>
                <Text style={styles.eventOrganization}>{event.organization}</Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {event.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Capacity info */}
              {event.capacity && (
                <Text style={styles.capacityText}>
                  Capacity: {event.capacity} people
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {events.length === 0 && (
            <Text style={styles.noEventsText}>
              No events found for the selected filter.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366',
  },
  logoutButtonTopRight: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutTextTopRight: {
    color: '#003366',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#003366',
  },
  filterText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  eventsList: {
    flex: 1,
    maxHeight: 600,
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    flex: 1,
    marginRight: 10,
  },
  eventCategory: {
    fontSize: 12,
    color: '#FFD700',
    backgroundColor: '#003366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventTime: {
    fontSize: 16,
    color: '#003366',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventOrganization: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#003366',
    fontWeight: '500',
  },
  capacityText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  noEventsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});