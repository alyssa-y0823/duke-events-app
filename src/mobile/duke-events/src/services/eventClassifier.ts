import { ExtendedEvent } from '../types';
import Constants from 'expo-constants';

// If using react-native-dotenv, uncomment this:
// import { GOOGLE_API_KEY } from '@env';

export interface ClassificationResult {
  relevantMajors: string[];
  enhancedTags: string[];
}

class EventClassifier {
  private apiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    this.apiKey = Constants.expoConfig?.extra?.googleApiKey || '';
  }

  /**
   * fallback classifier, rely on major & tag matching
   */
  async classifyEvent(event: ExtendedEvent): Promise<ClassificationResult | undefined> {
    try {
      const prompt = this.buildClassificationPrompt(event);
      const response = await this.callGeminiAPI(prompt);
      return this.parseClassificationResponse(response);
    } catch (error) {
      console.error('Error classifying event:', error);
      return;
    }
  }

  /**
   * classify multiple events in batch
   */
  async classifyEvents(events: ExtendedEvent[]): Promise<Map<string, ClassificationResult>> {
    const classifications = new Map<string, ClassificationResult>();

    // process in batches of 5 to avoid rate limits
    for (let i = 0; i < events.length; i += 5) {
      const batch = events.slice(i, i + 5);
      const batchPromises = batch.map(event =>
        this.classifyEvent(event).then(result => ({
          eventId: event.id,
          result
        }))
      );

      const results = await Promise.all(batchPromises);
      results.forEach(({ eventId, result }) => {
        if (result) {
          classifications.set(eventId, result);
        }
      });

      // small delay between batches
      if (i + 5 < events.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return classifications;
  }

  private buildClassificationPrompt(event: ExtendedEvent): string {
    return `Analyze this Duke University event and classify it. Return ONLY a valid JSON object with no markdown formatting or additional text.

Event Title: ${event.title}
Description: ${event.description}
Category: ${event.category}
Organization: ${event.organization}
Existing Tags: ${event.tags.join(', ')}

Classify this event by:
1. Which majors would find this most relevant? (Choose from: Computer Science, Engineering, Biology, Economics, Psychology, Mathematics, Chemistry, Political Science, English, History, Public Policy, Other)
2. What additional descriptive tags would help students find this?

Return this exact JSON structure with no markdown:
{
  "relevantMajors": ["array of major names"],
  "enhancedTags": ["array of descriptive tags"]
}`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Google API key not configured');
    }

    const url = `${this.apiEndpoint}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Unexpected API response format');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private parseClassificationResponse(response: string): ClassificationResult {
    try {
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      cleanedResponse = cleanedResponse.trim();

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        relevantMajors: Array.isArray(parsed.relevantMajors) ? parsed.relevantMajors : [],
        enhancedTags: Array.isArray(parsed.enhancedTags) ? parsed.enhancedTags : [],
      };
    } catch (error) {
      console.error('Error parsing classification response:', error);
      throw error;
    }
  }
}

export const eventClassifier = new EventClassifier();