import { useState } from 'react';
import AuthWrapper from './components/AuthWrapper';
import PersonSetup from './components/PersonSetup';
import ConversationBuilder from './components/ConversationBuilder';
import PodcastPlayer from './components/PodcastPlayer';
import type { Person, ConversationTurn } from './types';
import { generateAIResponse } from './services/bedrock';
import { generatePodcast } from './services/polly';
import './App.css';

type AppStage = 'setup' | 'conversation' | 'player';

function App() {
  const [stage, setStage] = useState<AppStage>('setup');
  const [persons, setPersons] = useState<Person[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePersonsComplete = (completedPersons: Person[]) => {
    setPersons(completedPersons);
    setStage('conversation');
  };

  const handleGenerateAI = async (
    personId: string,
    conversationHistory: ConversationTurn[]
  ): Promise<string> => {
    const person = persons.find(p => p.id === personId);
    if (!person) {
      throw new Error('Person not found');
    }

    return await generateAIResponse(person, conversationHistory, persons);
  };

  const handleConversationComplete = async (turns: ConversationTurn[]) => {
    setIsGenerating(true);
    try {
      const url = await generatePodcast(persons, turns);
      setAudioUrl(url);
      setStage('player');
    } catch (error) {
      alert('Failed to generate podcast: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStage('setup');
    setPersons([]);
    setAudioUrl('');
  };

  return (
    <AuthWrapper>
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {isGenerating && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            color: 'white',
            fontSize: '1.5rem',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>Generating your podcast...</div>
            <div style={{ fontSize: '1rem', color: '#ccc' }}>
              This may take a minute
            </div>
          </div>
        )}

        {stage === 'setup' && <PersonSetup onComplete={handlePersonsComplete} />}

        {stage === 'conversation' && (
          <ConversationBuilder
            persons={persons}
            onComplete={handleConversationComplete}
            onGenerateAI={handleGenerateAI}
          />
        )}

        {stage === 'player' && (
          <PodcastPlayer audioUrl={audioUrl} onReset={handleReset} />
        )}
      </div>
    </AuthWrapper>
  );
}

export default App;
