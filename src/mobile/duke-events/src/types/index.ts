import { ClassificationResult } from '../services/eventClassifier';

// Base Event interface (keep your original)
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

// Extended Event with additional fields from backend
interface BaseEvent extends Event {
  imageUrl?: string;
  tags: string[];
  capacity?: number;
  registrationUrl?: string;
  contactEmail?: string;
  isRecurring: boolean;
  organization: string;
}

// ExtendedEvent with classification (used in app)
export interface ExtendedEvent extends BaseEvent {
  classification?: ClassificationResult;
  relevanceScore?: number;
}

// User types (keep your originals)
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

// Simple preferences for onboarding (different from UserPreferences above)
export interface SimpleUserPreferences {
  year: string;
  major: string;
  interests: string[];
  setupComplete: boolean;
  createdAt?: string;
}