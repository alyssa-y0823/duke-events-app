export interface Event {
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

export interface User {
  id: string;
  email: string;
  name: string;
  year: string;
  major: string;
  interests: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  categories: string[];
  timeSlots: string[];
  locations: string[];
  maxDistance: number;
}