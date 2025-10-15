# Duke Events Matching App

An AI-powered React Native mobile application that helps Duke University students discover personalized campus events using intelligent matching algorithms and Google's Gemini AI.

## Overview

Duke Events Matching App revolutionizes how students engage with campus life by providing personalized event recommendations based on their academic interests, major, year, and preferences. The app uses Google's Gemini AI to intelligently classify events and match them to individual student profiles, ensuring every student finds events that matter to them.

### Key Features

- **AI-Powered Event Classification**: Leverages Google Gemini AI to automatically categorize events by major relevance, interest areas, and year level appropriateness
- **Personalized Recommendations**: Smart matching algorithm that calculates relevance scores based on user preferences
- **Multiple Event Views**: Browse events through "For You" (personalized), "Upcoming", or "All Events" filters
- **Intelligent Caching**: Event classifications are cached locally to improve performance and reduce API calls
- **Real-time Updates**: Pull-to-refresh functionality keeps event data current
- **Detailed Event Information**: Rich event cards showing title, description, location, time, organization, tags, and match percentage

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Storage**: AsyncStorage for local data persistence
- **AI/ML**: Google Gemini Pro API for event classification
- **Styling**: React Native StyleSheet
- **State Management**: React Hooks (useState, useEffect)

## Project Structure

```
src/
├── screens/
│   ├── AuthScreen.tsx           # Authentication/login screen
│   ├── HomeScreen.tsx            # Main event listing with recommendations
│   ├── PreferencesSetupScreen.tsx # User onboarding and preference setup
│   └── EventDetailScreen.tsx     # Detailed event view (implied)
├── services/
│   ├── eventService.ts           # Event data fetching and management
│   └── eventClassifier.ts        # AI classification service using Gemini
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Google Cloud account with Gemini API access
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/duke-events-app.git
cd duke-events-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure your Google Gemini API key:

Create an `app.config.js` file in the root directory:
```javascript
export default {
  expo: {
    // ... other config
    extra: {
      googleApiKey: 'YOUR_GOOGLE_GEMINI_API_KEY'
    }
  }
};
```

4. Start the development server:
```bash
npx expo start
```

5. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Core Features Explained

### AI Event Classification

The app uses Google's Gemini Pro API to intelligently analyze each event and determine:
- **Relevant Majors**: Which academic programs would benefit most (CS, Engineering, Biology, etc.)
- **Interest Categories**: Academic, sports, arts, social, professional, service, wellness, tech
- **Enhanced Tags**: Additional descriptive keywords for better searchability
- **Year Relevance**: Appropriateness ratings (0-10) for Freshman, Sophomore, Junior, Senior, and Graduate students

### Relevance Scoring Algorithm

Events are scored based on multiple factors:
- **Interest Matching**: 10 points per matching interest
- **Major Matching**: 15 points for exact major match
- **Year Relevance**: Up to 10 points based on class year
- **Tag Matching**: 5 points per matching tag
- **Recency Boost**: Additional points for events happening within 3-7 days
- **Maximum Score**: Capped at 100 for normalization

Events with scores ≥ 40% receive a "⭐ Recommended" badge.

### Fallback Classification

If the Gemini API is unavailable, the app uses keyword-based heuristics to classify events, ensuring the app remains functional even without AI access.

## User Flow

1. **Authentication**: Users sign in through the Duke authentication screen
2. **Preferences Setup**: First-time users select their year, major, and interests
3. **Home Screen**: Browse personalized event recommendations
4. **Event Details**: Tap any event to view full information
5. **Continuous Personalization**: Update preferences anytime via settings

## Configuration

### Available Preferences

- **Year**: Freshman, Sophomore, Junior, Senior, Graduate
- **Majors**: Computer Science, Engineering, Biology, Economics, Psychology, Mathematics, Chemistry, Political Science, English, History, Public Policy, Other
- **Interests**: Academic, Sports, Arts & Culture, Social Events, Career & Professional, Community Service, Health & Wellness, Technology

## Data Management

- **Local Storage**: User preferences and event classifications cached using AsyncStorage
- **Background Classification**: Unclassified events are automatically analyzed in the background
- **Batch Processing**: Events classified in batches of 5 to respect API rate limits
- **Cache Invalidation**: Pull-to-refresh reloads events and checks for new classifications

## Future Enhancements

- [ ] Firebase authentication integration for Duke SSO
- [ ] Event RSVP and calendar integration
- [ ] Social features (see which friends are attending)
- [ ] Push notifications for highly relevant events
- [ ] Event creation and management for student organizations
- [ ] Analytics dashboard for event organizers
- [ ] Map integration for event locations
- [ ] Advanced filtering (by location, time, capacity)

## Known Issues

- Firebase authentication not yet implemented (currently using placeholder auth)
- API key should be stored more securely (consider using environment variables with proper encryption)
- Rate limiting on Gemini API may cause delays during initial classification of many events

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows TypeScript best practices and includes appropriate error handling.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/yourusername/duke-events-app](https://github.com/yourusername/duke-events-app)

## Acknowledgments

- Google Gemini AI for intelligent event classification
- Duke University for inspiration and color scheme
- React Native and Expo communities for excellent documentation
- All contributors who help improve campus engagement

---

**Note**: This app is designed specifically for Duke University students. API keys and authentication should be properly secured before deploying to production.
