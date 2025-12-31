import { fetchAuthSession } from 'aws-amplify/auth';
import type { Person, ConversationTurn } from '../types';

interface GeneratePodcastRequest {
  persons: Person[];
  turns: ConversationTurn[];
}

interface VoiceMapping {
  male: string[];
  female: string[];
}

// Standard engine voices - universally supported in all regions
const VOICES: VoiceMapping = {
  male: ['Matthew', 'Joey', 'Justin'],
  female: ['Joanna', 'Kendra', 'Kimberly', 'Salli'],
};

function selectVoice(person: Person, index: number): string {
  const voiceList = VOICES[person.sex];
  return voiceList[index % voiceList.length];
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

    // Create voice mapping for each person
    const personVoiceMap: Record<string, string> = {};
    persons.forEach((person, index) => {
      personVoiceMap[person.id] = selectVoice(person, index);
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

export function getVoiceForPerson(person: Person, index: number): string {
  return selectVoice(person, index);
}
