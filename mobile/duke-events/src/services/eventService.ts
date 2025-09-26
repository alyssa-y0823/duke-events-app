// src/services/eventService.ts
import { Event } from '../types/index';

// Extended event interface for real data
export interface ExtendedEvent extends Event {
  imageUrl?: string;
  tags: string[];
  capacity?: number;
  registrationUrl?: string;
  contactEmail?: string;
  isRecurring: boolean;
  organization: string;
}

// Mock enhanced event data (replace with real API calls later)
const mockEventData: ExtendedEvent[] = [
  {
    id: '1',
    title: 'Duke vs UNC Basketball Game',
    description: 'The annual rivalry game between Duke Blue Devils and UNC Tar Heels at Cameron Indoor Stadium.',
    date: new Date('2025-02-08T19:00:00'),
    time: '7:00 PM',
    location: 'Cameron Indoor Stadium',
    category: 'Sports',
    organizerId: 'athletics',
    attendees: [],
    maxAttendees: 9314,
    tags: ['basketball', 'rivalry', 'cameron', 'sports'],
    capacity: 9314,
    registrationUrl: 'https://goduke.com/tickets',
    contactEmail: 'athletics@duke.edu',
    isRecurring: false,
    organization: 'Duke Athletics'
  },
  {
    id: '2',
    title: 'CS 330 Study Group',
    description: 'Weekly study session for Computer Science 330: Design and Analysis of Algorithms. Covers dynamic programming and graph algorithms.',
    date: new Date('2025-09-27T15:00:00'),
    time: '3:00 PM - 5:00 PM',
    location: 'Perkins Library, Room 217',
    category: 'Academic',
    organizerId: 'cs-dept',
    attendees: [],
    maxAttendees: 25,
    tags: ['computer-science', 'algorithms', 'study-group', 'cs330'],
    capacity: 25,
    isRecurring: true,
    organization: 'Computer Science Department'
  },
  {
    id: '3',
    title: 'Interfraternity Council Mixer',
    description: 'Annual fall mixer hosted by IFC. Meet students from different fraternities and learn about Greek life at Duke.',
    date: new Date('2025-09-28T20:00:00'),
    time: '8:00 PM - 11:00 PM',
    location: 'East Campus Union Ballroom',
    category: 'Social',
    organizerId: 'ifc',
    attendees: [],
    maxAttendees: 200,
    tags: ['greek-life', 'social', 'mixer', 'networking'],
    capacity: 200,
    registrationUrl: 'https://duke.edu/greek-life/events',
    contactEmail: 'ifc@duke.edu',
    isRecurring: false,
    organization: 'Interfraternity Council'
  },
  {
    id: '4',
    title: 'Research Symposium: AI in Healthcare',
    description: 'Undergraduate research presentations on applications of artificial intelligence in medical diagnosis and treatment.',
    date: new Date('2025-09-29T14:00:00'),
    time: '2:00 PM - 4:30 PM',
    location: 'Fitzpatrick Center Schiciano Auditorium',
    category: 'Academic',
    organizerId: 'pratt',
    attendees: [],
    tags: ['research', 'ai', 'healthcare', 'presentations'],
    isRecurring: false,
    organization: 'Pratt School of Engineering'
  },
  {
    id: '5',
    title: 'Duke Chapel Evening Prayer',
    description: 'Weekly contemplative service featuring music, scripture, and silent reflection.',
    date: new Date('2025-09-28T17:30:00'),
    time: '5:30 PM - 6:00 PM',
    location: 'Duke Chapel',
    category: 'Religious',
    organizerId: 'chapel',
    attendees: [],
    tags: ['chapel', 'prayer', 'spiritual', 'music'],
    isRecurring: true,
    organization: 'Duke Chapel'
  },
  {
    id: '6',
    title: 'Startup Pitch Competition',
    description: 'Student entrepreneurs present their business ideas to a panel of venture capitalists and Duke alumni.',
    date: new Date('2025-09-30T18:00:00'),
    time: '6:00 PM - 9:00 PM',
    location: 'Fuqua School of Business',
    category: 'Professional',
    organizerId: 'innovation',
    attendees: [],
    maxAttendees: 150,
    tags: ['entrepreneurship', 'startups', 'business', 'competition'],
    capacity: 150,
    registrationUrl: 'https://innovation.duke.edu/pitch-comp',
    contactEmail: 'innovation@duke.edu',
    isRecurring: false,
    organization: 'Duke Innovation & Entrepreneurship'
  }
];

// Event service class
export class EventService {
  private static instance: EventService;
  private events: ExtendedEvent[] = mockEventData;

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Get all events
  async getAllEvents(): Promise<ExtendedEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.events]), 500);
    });
  }

  // Filter events by category
  async getEventsByCategory(category: string): Promise<ExtendedEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = this.events.filter(event => 
          event.category.toLowerCase() === category.toLowerCase()
        );
        resolve(filtered);
      }, 300);
    });
  }

  // Filter events by tags
  async getEventsByTags(tags: string[]): Promise<ExtendedEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = this.events.filter(event =>
          tags.some(tag => event.tags.includes(tag))
        );
        resolve(filtered);
      }, 300);
    });
  }

  // Get upcoming events (next 7 days)
  async getUpcomingEvents(): Promise<ExtendedEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = this.events.filter(event =>
          event.date >= now && event.date <= weekFromNow
        ).sort((a, b) => a.date.getTime() - b.date.getTime());
        
        resolve(upcoming);
      }, 400);
    });
  }

  // Search events by title or description
  async searchEvents(query: string): Promise<ExtendedEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const searchTerm = query.toLowerCase();
        const results = this.events.filter(event =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.tags.some(tag => tag.includes(searchTerm))
        );
        resolve(results);
      }, 200);
    });
  }
}

// Export singleton instance
export const eventService = EventService.getInstance();