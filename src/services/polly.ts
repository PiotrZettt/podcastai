import { fetchAuthSession } from 'aws-amplify/auth';
import type { Person, ConversationTurn, PersonalityType } from '../types';

interface GeneratePodcastRequest {
  persons: Person[];
  turns: ConversationTurn[];
}

interface PersonalityVoiceMap {
  male: string;
  female: string;
}

// Personality-to-voice mapping for OpenAI TTS
const PERSONALITY_VOICES: Record<PersonalityType, PersonalityVoiceMap> = {
  energetic: {
    male: 'echo',      // Clear, energetic male voice
    female: 'shimmer', // Soft, youthful female voice
  },
  calm: {
    male: 'onyx',      // Deep, authoritative male voice
    female: 'nova',    // Warm, calm female voice
  },
  sophisticated: {
    male: 'fable',     // British, sophisticated male voice
    female: 'alloy',   // Neutral, balanced female voice
  },
};

function selectVoice(person: Person): string {
  return PERSONALITY_VOICES[person.personalityType][person.sex];
}

export async function generatePodcast(
  persons: Person[],
  turns: ConversationTurn[]
): Promise<string> {
  try {
    // Get auth session for credentials
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    // Create voice mapping for each person based on personality type
    const personVoiceMap: Record<string, string> = {};
    persons.forEach((person) => {
      personVoiceMap[person.id] = selectVoice(person);
    });

    const requestBody: GeneratePodcastRequest = {
      persons: persons.map(p => ({
        ...p,
        voiceId: personVoiceMap[p.id],
      })) as any,
      turns,
    };

    const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
    if (!apiEndpoint) {
      throw new Error('API endpoint not configured');
    }

    const response = await fetch(`${apiEndpoint}/generate-podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate podcast: ${errorText}`);
    }

    const data = await response.json();

    if (!data.audioUrl) {
      throw new Error('No audio URL in response');
    }

    return data.audioUrl;
  } catch (error) {
    console.error('Error generating podcast:', error);
    throw error;
  }
}

export function getVoiceForPerson(person: Person): string {
  return selectVoice(person);
}

// Helper to get voice description for UI display
export function getVoiceDescription(personalityType: PersonalityType, sex: 'male' | 'female'): string {
  const voiceDescriptions = {
    energetic: {
      male: 'Echo - Clear, energetic voice',
      female: 'Shimmer - Soft, youthful voice',
    },
    calm: {
      male: 'Onyx - Deep, authoritative voice',
      female: 'Nova - Warm, calm voice',
    },
    sophisticated: {
      male: 'Fable - British, sophisticated voice',
      female: 'Alloy - Neutral, balanced voice',
    },
  };
  return voiceDescriptions[personalityType][sex];
}
