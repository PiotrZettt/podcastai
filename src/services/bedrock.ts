import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Person, ConversationTurn } from '../types';

export async function generateAIResponse(
  person: Person,
  conversationHistory: ConversationTurn[],
  allPersons: Person[]
): Promise<string> {
  try {
    // Get credentials from Amplify Auth
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error('No credentials available');
    }

    const client = new BedrockRuntimeClient({
      region: import.meta.env.VITE_AWS_REGION || 'eu-west-2',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    // Build context from conversation history
    const conversationContext = conversationHistory.map(turn => {
      const speaker = allPersons.find(p => p.id === turn.personId);
      return `${speaker?.name}: ${turn.text}`;
    }).join('\n\n');

    // Build the system prompt
    const personalityDescription = person.personality ||
      `${person.personalityType} character (${person.age} years old)`;

    const systemPrompt = `You are ${person.name}, a ${person.age}-year-old ${person.sex} with the following personality: ${personalityDescription}

You are participating in a podcast conversation. Stay in character and respond naturally based on the conversation so far.

Keep your response concise and conversational (10-12 sentences max). Speak as if you're in a real podcast.`;

    const userPrompt = conversationContext
      ? `Here's the conversation so far:\n\n${conversationContext}\n\nNow respond as ${person.name}:`
      : `Start the conversation as ${person.name}. Introduce yourself or make an opening statement.`;

    // Prepare the request for Amazon Nova
    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      inferenceConfig: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      }
    };

    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-pro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Nova response format
    if (responseBody.output && responseBody.output.message && responseBody.output.message.content) {
      const content = responseBody.output.message.content[0];
      if (content.text) {
        return content.text;
      }
    }

    throw new Error('Unexpected response format from Bedrock');
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}
