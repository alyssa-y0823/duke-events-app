// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventService } from '../services/eventService';
import { eventClassifier, ClassificationResult } from '../services/eventClassifier';
import { ExtendedEvent, SimpleUserPreferences } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [preferences, setPreferences] = useState<SimpleUserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'recommended' | 'upcoming' | 'all'>('recommended');
  const [recencyWeight, setRecencyWeight] = useState(0.2); // 0.0 to 1.0 (0% to 100%)

  useEffect(() => {
    loadPreferences();
    loadEvents();
  }, [filter]);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('userPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      let eventData: ExtendedEvent[] = [];

      if (filter === 'recommended' && preferences) {
        // Calculate weights based on slider
        // If recencyWeight is 1.0, only recency matters.
        // If 0.0, only relevance (sim + label) matters.
        const w_recency = recencyWeight;
        const w_sim = (1.0 - recencyWeight) * 0.7; // 70% of remaining goes to semantic
        const w_label = (1.0 - recencyWeight) * 0.3; // 30% of remaining goes to label match

        eventData = await eventService.getRankedEvents(preferences, {
          recency: w_recency,
          sim: w_sim,
          label: w_label
        });
      } else if (filter === 'upcoming') {
        eventData = await eventService.getUpcomingEvents();
      } else {
        eventData = await eventService.getAllEvents();
      }

      // Check if events are already classified in cache
      const cachedClassifications = await loadCachedClassifications();

      const enhancedEvents: ExtendedEvent[] = eventData.map(event => {
        const cached = cachedClassifications.get(event.id);
        return {
          ...event,
          classification: cached,
          relevanceScore: cached && preferences ? calculateRelevanceScore(event, cached, preferences) : 0,
        };
      });

      setEvents(enhancedEvents);

      // Classify unclassified events in background
      const unclassified = enhancedEvents.filter(e => !e.classification);
      if (unclassified.length > 0) {
        classifyEventsInBackground(unclassified);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const classifyEventsInBackground = async (eventsToClassify: ExtendedEvent[]) => {
    setClassifying(true);
    try {
      const classifications = await eventClassifier.classifyEvents(eventsToClassify);

      // Cache the classifications
      await cacheClassifications(classifications);

      // Update events with classifications
      setEvents(prevEvents =>
        prevEvents.map(event => {
          const classification = classifications.get(event.id);
          if (classification) {
            return {
              ...event,
              classification,
              relevanceScore: preferences ? calculateRelevanceScore(event, classification, preferences) : 0,
            };
          }
          return event;
        })
      );
    } catch (error) {
      console.error('Error classifying events:', error);
    } finally {
      setClassifying(false);
    }
  };

  const loadCachedClassifications = async (): Promise<Map<string, ClassificationResult>> => {
    try {
      const cached = await AsyncStorage.getItem('eventClassifications');
      if (cached) {
        const parsed = JSON.parse(cached);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading cached classifications:', error);
    }
    return new Map();
  };

  const cacheClassifications = async (classifications: Map<string, ClassificationResult>) => {
    try {
      const existing = await loadCachedClassifications();
      classifications.forEach((value, key) => {
        existing.set(key, value);
      });

      const toStore = Object.fromEntries(existing);
      await AsyncStorage.setItem('eventClassifications', JSON.stringify(toStore));
    } catch (error) {
      console.error('Error caching classifications:', error);
    }
  };

  const calculateRelevanceScore = (
    event: ExtendedEvent,
    classification: ClassificationResult,
    prefs: SimpleUserPreferences
  ): number => {
    let score = 0;

    // Interest matching (highest weight) - 10 points per match
    const interestMatches = classification.relevantInterests.filter((interest: string) =>
      prefs.interests.includes(interest)
    );
    score += interestMatches.length * 10;

    // Major matching - 15 points if exact match
    if (classification.relevantMajors.includes(prefs.major)) {
      score += 15;
    }

    // Year relevance - up to 10 points based on year-specific score
    const yearKey = prefs.year.toLowerCase() as keyof typeof classification.yearRelevance;
    score += classification.yearRelevance[yearKey] || 5;

    // Tag matching with user interests - 5 points per match
    const allTags = [...event.tags, ...classification.enhancedTags];
    const tagMatches = allTags.filter((tag: string) =>
      prefs.interests.some((interest: string) =>
        tag.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(tag.toLowerCase())
      )
    );
    score += tagMatches.length * 5;

    // Recency boost
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 3) {
      score += 5;
    } else if (daysUntil > 3 && daysUntil <= 7) {
      score += 2;
    }

    return Math.min(score, 100); // Cap at 100
  };

  const getSortedEvents = () => {
    const eventsCopy = [...events];

    if (filter === 'recommended' && preferences) {
      return eventsCopy.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else {
      return eventsCopy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPreferences();
    await loadEvents();
    setRefreshing(false);
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

  const sortedEvents = getSortedEvents();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.header}>
            Duke Events {preferences ? `• ${preferences.year}` : ''}
          </Text>
          <Text style={styles.subheader}>
            {sortedEvents.length} {filter === 'recommended' ? 'recommended' : ''} events
            {classifying && ' • Analyzing...'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButtonTopRight}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.logoutTextTopRight}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Setup Prompt */}
      {!preferences && (
        <View style={styles.setupPrompt}>
          <Text style={styles.setupPromptTitle}>🎯 Get AI-Powered Recommendations</Text>
          <Text style={styles.setupPromptText}>
            Set up your preferences and we'll use AI to find the perfect events for you!
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Text style={styles.setupButtonText}>Set Up Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        {preferences && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'recommended' && styles.activeFilter]}
            onPress={() => setFilter('recommended')}
          >
            <Text style={[styles.filterText, filter === 'recommended' && styles.activeFilterText]}>
              For You
            </Text>
          </TouchableOpacity>
        )}
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
        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {sortedEvents.map((event, index) => {
            const score = event.relevanceScore || 0;
            const isHighlyRelevant = score >= 40;

            return (
              <TouchableOpacity
                key={event.id && event.id !== '-1' ? event.id : `event-${index}`}
                onPress={() => navigation.navigate('EventDetail', { event })}
                style={styles.eventCard}
              >
                {/* Recommended Badge */}
                {isHighlyRelevant && filter === 'recommended' && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>⭐ Recommended</Text>
                  </View>
                )}

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

                {/* Tags and Classification Info */}
                <View style={styles.tagsContainer}>
                  {event.classification?.enhancedTags.slice(0, 2).map((tag, tagIndex) => (
                    <View key={tagIndex} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {event.tags.slice(0, 1).map((tag, tagIndex) => (
                    <View key={`orig-${tagIndex}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {preferences && score > 0 && filter === 'recommended' && (
                    <View style={styles.scoreTag}>
                      <Text style={styles.scoreText}>{score}% match</Text>
                    </View>
                  )}
                </View>

                {/* Show relevant majors if classified */}
                {event.classification && event.classification.relevantMajors.length > 0 && (
                  <Text style={styles.majorText}>
                    For: {event.classification.relevantMajors.slice(0, 2).join(', ')}
                  </Text>
                )}

                {/* Capacity info */}
                {event.capacity && (
                  <Text style={styles.capacityText}>
                    Capacity: {event.capacity} people
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {sortedEvents.length === 0 && (
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
    marginBottom: 15,
    marginTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  subheader: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
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
  setupPrompt: {
    marginBottom: 15,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  setupPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 6,
  },
  setupPromptText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  setupButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
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
    fontSize: 14,
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
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#003366',
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
  scoreTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11,
    color: '#003366',
    fontWeight: 'bold',
  },
  majorText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
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
  sliderContainer: {
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderTextLeft: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  sliderTextRight: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
});