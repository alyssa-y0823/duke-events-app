// src/services/eventService.ts

interface BaseEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: string;
  organizerId: string;
  attendees: string[];
  maxAttendees?: number;
}

export interface ExtendedEvent extends BaseEvent {
  imageUrl?: string;
  tags: string[];
  capacity?: number;
  registrationUrl?: string;
  contactEmail?: string;
  isRecurring: boolean;
  organization: string;
}

// API function to fetch events from backend
export const eventsData = async (days = 30): Promise<any[]> => {
  try {
    const response = await fetch(`http://localhost:3000/events?future_days=${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const convertDukeCalendarEvent = (event: any): ExtendedEvent => {
  return {
    id: event.id || `duke-${Date.now()}-${Math.random()}`,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    date: new Date(parseInt(event.start_timestamp) * 1000), // CHANGE THIS BACK
    time: formatDukeEventTime(event),
    location: event.location?.address || 'Duke University',
    category: mapDukeCalendarCategory(event.categories),
    organizerId: 'duke-calendar',
    attendees: [],
    maxAttendees: undefined,
    tags: generateTagsFromDukeCalendar(event),
    capacity: undefined,
    registrationUrl: event.event_url || event.link,
    contactEmail: event.contact?.email,
    isRecurring: false,
    organization: event.sponsor || 'Duke University'
  };
};

const formatDukeEventTime = (event: any): string => {
  try {
    if (event.start_timestamp && event.end_timestamp) {
      const start = new Date(parseInt(event.start_timestamp) * 1000);
      const end = new Date(parseInt(event.end_timestamp) * 1000);
      
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

const mapDukeCalendarCategory = (categories: any): string => {
  if (!categories) return 'General';
  
  // Handle both single category and array of categories
  const categoryList = Array.isArray(categories) ? categories : [categories];
  if (categoryList.length === 0) return 'General';
  
  const firstCategory = categoryList[0].toLowerCase();
  
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

const generateTagsFromDukeCalendar = (event: any): string[] => {
  const tags: string[] = [];
  
  // Add from categories
  if (event.categories) {
    const categoryList = Array.isArray(event.categories) ? event.categories : [event.categories];
    categoryList.forEach((cat: string) => {
      tags.push(cat.toLowerCase().replace(/\s+/g, '-'));
    });
  }
  
  // Add from location
  if (event.location?.address) {
    const location = event.location.address.toLowerCase();
    if (location.includes('cameron')) tags.push('cameron-indoor');
    if (location.includes('chapel')) tags.push('duke-chapel');
    if (location.includes('perkins')) tags.push('perkins-library');
    if (location.includes('fitzpatrick')) tags.push('fitzpatrick-center');
  }
  
  // Add from sponsor
  if (event.sponsor) {
    tags.push(event.sponsor.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
  }
  
  return tags.slice(0, 5); // Limit to 5 tags
};

// Mock data fallback - empty array, only use real API data
const mockEventData: ExtendedEvent[] = [];

// Event service class
export class EventService {
  private static instance: EventService;
  private mockEvents: ExtendedEvent[] = mockEventData;

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Get all events - only from Duke Calendar API
  async getAllEvents(): Promise<ExtendedEvent[]> {
    try {
      console.log('Fetching all events from Duke Calendar API...');
      const dukeCalendarEvents = await eventsData(30);
      
      if (dukeCalendarEvents && dukeCalendarEvents.length > 0) {
        console.log(`Fetched ${dukeCalendarEvents.length} events from Duke Calendar`);
        return dukeCalendarEvents.map(convertDukeCalendarEvent);
      } else {
        console.log('No events from Duke Calendar API');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch from Duke Calendar API:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async getUpcomingEvents(): Promise<ExtendedEvent[]> {
  try {
    console.log('Fetching upcoming events from Duke Calendar API...');
    const dukeCalendarEvents = await eventsData(7);
    
    if (dukeCalendarEvents && dukeCalendarEvents.length > 0) {
      console.log(`Fetched ${dukeCalendarEvents.length} upcoming events from Duke Calendar`);
      const convertedEvents = dukeCalendarEvents.map(convertDukeCalendarEvent);
      
      // Filter for truly upcoming events
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      console.log(`Filtering events between ${now} and ${weekFromNow}`);
      
      const filteredEvents = convertedEvents.filter((event: ExtendedEvent) => {
        const isUpcoming = event.date >= now && event.date <= weekFromNow;
        console.log(`Event: "${event.title}" - Date: ${event.date} - Is upcoming: ${isUpcoming}`);
        return isUpcoming;
      });
      
      console.log(`Found ${filteredEvents.length} upcoming events after filtering`);
      
      return filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    } else {
      console.log('No upcoming events from Duke Calendar API');
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

  // Search events by title, description, or tags
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

  // Filter events by category
  async getEventsByCategory(category: string): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter((event: ExtendedEvent) => 
      event.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter events by tags
  async getEventsByTags(tags: string[]): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter((event: ExtendedEvent) =>
      tags.some((tag: string) => 
        event.tags.some((eventTag: string) => eventTag.includes(tag.toLowerCase()))
      )
    );
  }

  // Get events by organization
  async getEventsByOrganization(organization: string): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter((event: ExtendedEvent) =>
      event.organization.toLowerCase().includes(organization.toLowerCase())
    );
  }

  // Test if backend is available
  async testBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get event by ID
  async getEventById(id: string): Promise<ExtendedEvent | null> {
    const allEvents = await this.getAllEvents();
    return allEvents.find((event: ExtendedEvent) => event.id === id) || null;
  }

  // Get events happening today
  async getTodaysEvents(): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    const today = new Date();
    const todayString = today.toDateString();
    
    return allEvents.filter((event: ExtendedEvent) =>
      event.date.toDateString() === todayString
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Get events for a specific date range
  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<ExtendedEvent[]> {
    const allEvents = await this.getAllEvents();
    
    return allEvents.filter((event: ExtendedEvent) =>
      event.date >= startDate && event.date <= endDate
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export const eventService = EventService.getInstance();