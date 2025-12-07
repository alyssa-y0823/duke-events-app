// src/services/eventService.ts
import { ExtendedEvent } from '../types';

// API function to fetch events from JSON backend
export const eventsData = async (days = 30): Promise<any[]> => {
  try {
    const response = await fetch(`http://localhost:3000/events?future_days=${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Received ${data.length} events from JSON backend`);
    return data;
  } catch (error) {
    console.error('Fetch error:', error instanceof Error ? error.message : String(error));
    return [];
  }
};

// Convert JSON backend response to app format
const convertJsonEvent = (event: any): ExtendedEvent => {
  return {
    id: event.id || event.guid || `json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    date: event.start_timestamp ? new Date(event.start_timestamp * 1000) : new Date(),
    time: formatJsonEventTime(event),
    location: event.location?.address || 'Duke University',
    category: mapJsonCategory(event.categories),
    organizerId: 'duke-calendar',
    attendees: [],
    maxAttendees: undefined,
    tags: generateJsonTags(event),
    capacity: undefined,
    registrationUrl: event.event_url || event.link,
    contactEmail: event.contact?.email,
    isRecurring: false,
    organization: event.sponsor || 'Duke University',
    // These will be added later by classifier
    classification: undefined,
    relevanceScore: undefined,
  };
};

const formatJsonEventTime = (event: any): string => {
  try {
    if (event.start_timestamp && event.end_timestamp) {
      const start = new Date(event.start_timestamp * 1000);
      const end = new Date(event.end_timestamp * 1000);

      const startTime = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const endTime = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `${startTime} - ${endTime}`;
    }
    return 'Time TBD';
  } catch {
    return 'Time TBD';
  }
};

const mapJsonCategory = (categories: any): string => {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return 'General';

  const firstCategory = categories[0].toLowerCase();

  if (firstCategory.includes('lecture') || firstCategory.includes('academic') || firstCategory.includes('seminar')) {
    return 'Academic';
  } else if (firstCategory.includes('sport') || firstCategory.includes('athletic')) {
    return 'Sports';
  } else if (firstCategory.includes('arts') || firstCategory.includes('music') || firstCategory.includes('theater')) {
    return 'Arts';
  } else if (firstCategory.includes('social') || firstCategory.includes('student')) {
    return 'Social';
  } else if (firstCategory.includes('career') || firstCategory.includes('professional')) {
    return 'Professional';
  } else {
    return 'General';
  }
};

const generateJsonTags = (event: any): string[] => {
  const tags: string[] = [];

  if (event.categories && Array.isArray(event.categories)) {
    event.categories.forEach((cat: string) => {
      tags.push(cat.toLowerCase().replace(/\s+/g, '-'));
    });
  }

  if (event.location?.address) {
    const location = event.location.address.toLowerCase();
    if (location.includes('cameron')) tags.push('cameron-indoor');
    if (location.includes('chapel')) tags.push('duke-chapel');
    if (location.includes('perkins')) tags.push('perkins-library');
  }

  if (event.sponsor) {
    tags.push(event.sponsor.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
  }

  return tags.slice(0, 5);
};

export class EventService {
  private static instance: EventService;

  private constructor() { }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  async getAllEvents(): Promise<ExtendedEvent[]> {
    try {
      console.log('Fetching all events from JSON backend...');
      const events = await eventsData(30);

      if (events && events.length > 0) {
        console.log(`Fetched ${events.length} events from JSON backend`);
        return events.map(convertJsonEvent);
      } else {
        console.log('No events from JSON backend');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch from JSON backend:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async getUpcomingEvents(): Promise<ExtendedEvent[]> {
    try {
      console.log('Fetching upcoming events from JSON backend...');
      const events = await eventsData(7);

      if (events && events.length > 0) {
        console.log(`Fetched ${events.length} upcoming events from JSON backend`);
        const convertedEvents = events.map(convertJsonEvent);

        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const filteredEvents = convertedEvents.filter((event: ExtendedEvent) => {
          const isUpcoming = event.date >= now && event.date <= weekFromNow;
          return isUpcoming;
        });

        console.log(`Found ${filteredEvents.length} upcoming events after filtering`);
        return filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      } else {
        console.log('No upcoming events from JSON backend');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async getRankedEvents(userProfile: any, weights: any): Promise<ExtendedEvent[]> {
    try {
      console.log('Fetching ranked events...');
      const response = await fetch('http://localhost:3000/events/rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_profile: userProfile,
          weights: weights
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const events = await response.json();
      console.log(`Received ${events.length} ranked events`);
      return events.map(convertJsonEvent).map((e: ExtendedEvent, index: number) => ({
        ...e,
        relevanceScore: events[index].relevanceScore ? Math.round(events[index].relevanceScore * 100) : 0
      }));

    } catch (error) {
      console.error('Failed to fetch ranked events:', error);
      // Fallback to all events sorted by date
      return this.getAllEvents();
    }
  }

  async searchEvents(query: string): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    const searchTerm = query.toLowerCase();

    return allEvents.filter((event: ExtendedEvent) =>
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.tags.some((tag: string) => tag.includes(searchTerm)) ||
      event.organization.toLowerCase().includes(searchTerm)
    );
  }

  async testBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const eventService = EventService.getInstance();