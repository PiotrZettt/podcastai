import { useState } from 'react';
import type { Person, ConversationTurn } from '../types';

interface ConversationBuilderProps {
  persons: Person[];
  onComplete: (turns: ConversationTurn[]) => void;
  onGenerateAI: (personId: string, conversationHistory: ConversationTurn[]) => Promise<string>;
}

export default function ConversationBuilder({
  persons,
  onComplete,
  onGenerateAI
}: ConversationBuilderProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(persons[0]?.id || '');
  const [currentText, setCurrentText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const selectedPerson = persons.find(p => p.id === selectedPersonId);
  const isAIPerson = selectedPerson?.isAI || false;

  const handleAddTurn = () => {
    if (!currentText.trim()) {
      alert('Please enter some text');
      return;
    }

    const newTurn: ConversationTurn = {
      id: crypto.randomUUID(),
      personId: selectedPersonId,
      text: currentText.trim(),
      isGenerated: false,
    };

    setTurns([...turns, newTurn]);
    setCurrentText('');
  };

  const handleGenerateAI = async () => {
    if (!selectedPerson?.isAI) return;

    setIsGenerating(true);
    try {
      const generatedText = await onGenerateAI(selectedPersonId, turns);

      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        personId: selectedPersonId,
        text: generatedText,
        isGenerated: true,
      };

      setTurns([...turns, newTurn]);
    } catch (error) {
      alert('Failed to generate AI response: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (turn: ConversationTurn) => {
    setEditingTurnId(turn.id);
    setEditText(turn.text);
  };

  const handleSaveEdit = (turnId: string) => {
    setTurns(turns.map(t =>
      t.id === turnId ? { ...t, text: editText } : t
    ));
    setEditingTurnId(null);
    setEditText('');
  };

  const handleDelete = (turnId: string) => {
    setTurns(turns.filter(t => t.id !== turnId));
  };

  const getPersonById = (id: string) => persons.find(p => p.id === id);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Build Your Podcast Conversation</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Left side: Input */}
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Add Statement</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Who speaks next?
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => {
                setSelectedPersonId(e.target.value);
                setCurrentText('');
              }}
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            >
              {persons.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name} {person.isAI ? '(AI)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isAIPerson ? (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                This is an AI participant. Click Generate to create a response.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate AI Response'}
              </button>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Statement:
              </label>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Type or paste the statement..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
              <button
                onClick={handleAddTurn}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Add Statement
              </button>
            </div>
          )}
        </div>

        {/* Right side: Conversation */}
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', maxHeight: '600px', overflowY: 'auto' }}>
          <h3>Conversation ({turns.length} turns)</h3>

          {turns.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No statements yet. Add the first one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {turns.map((turn, index) => {
                const person = getPersonById(turn.personId);
                const isEditing = editingTurnId === turn.id;

                return (
                  <div
                    key={turn.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: turn.isGenerated ? '#e7f3ff' : '#f8f9fa',
                      borderRadius: '6px',
                      borderLeft: '4px solid ' + (turn.isGenerated ? '#007bff' : '#6c757d')
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong>
                        {index + 1}. {person?.name} {turn.isGenerated ? '(AI)' : ''}
                      </strong>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => handleEdit(turn)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(turn.id)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{ width: '100%', minHeight: '80px', padding: '0.5rem', marginBottom: '0.5rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSaveEdit(turn.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTurnId(null)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{turn.text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onComplete(turns)}
          disabled={turns.length === 0}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: turns.length === 0 ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: turns.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Generate Podcast ({turns.length} statements)
        </button>
      </div>
    </div>
  );
}
