import type { Person, ConversationTurn } from '../types';

export async function generateAIResponse(
  person: Person,
  conversationHistory: ConversationTurn[],
  allPersons: Person[]
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable not set');
    }

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

    // Call OpenAI Chat API with GPT-4o
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // OpenAI response format
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }

    throw new Error('Unexpected response format from OpenAI');
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}
