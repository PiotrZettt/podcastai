import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    
    // Auto-switch to next person
    const currentIndex = persons.findIndex(p => p.id === selectedPersonId);
    const nextIndex = (currentIndex + 1) % persons.length;
    setSelectedPersonId(persons[nextIndex].id);
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
      
      // Auto-switch to next person
      const currentIndex = persons.findIndex(p => p.id === selectedPersonId);
      const nextIndex = (currentIndex + 1) % persons.length;
      setSelectedPersonId(persons[nextIndex].id);
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
    <div className="container section">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Build Your Podcast Conversation</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side: Input */}
          <Card>
            <CardHeader>
              <CardTitle>Add Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="speaker-select">Who speaks next?</Label>
                <Select
                  value={selectedPersonId}
                  onValueChange={(value) => {
                    setSelectedPersonId(value);
                    setCurrentText('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name} {person.isAI && '(AI)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPerson && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{selectedPerson.name}</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Age:</strong> {selectedPerson.age} | <strong>Sex:</strong> {selectedPerson.sex}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Personality:</strong> {selectedPerson.personality}
                  </p>
                </div>
              )}

              {isAIPerson ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This person is AI-controlled. Click Generate to create an AI response.
                  </p>
                  <Button 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
                  >
                    {isGenerating ? 'Generating...' : 'Generate AI Response'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="statement-text">What do they say?</Label>
                    <Textarea
                      id="statement-text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Enter what this person says..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleAddTurn}
                    disabled={!currentText.trim()}
                    variant="outline"
                    className="w-full text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
                  >
                    Add Statement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right side: Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation ({turns.length} turns)</CardTitle>
            </CardHeader>
            <CardContent>
              {turns.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-8">
                  No statements yet. Add the first one!
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {[...turns].reverse().map((turn, reversedIndex) => {
                    const index = turns.length - 1 - reversedIndex;
                    const person = getPersonById(turn.personId);
                    const isEditing = editingTurnId === turn.id;

                    return (
                      <div
                        key={turn.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          turn.isGenerated 
                            ? 'bg-blue-50 border-l-blue-500 text-blue-900' 
                            : 'bg-slate-50 border-l-slate-400 text-slate-900'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">
                            {index + 1}. {person?.name} {turn.isGenerated ? '(AI)' : ''}
                          </span>
                          <div className="flex gap-2">
                            {!isEditing && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(turn)}
                                  className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(turn.id)}
                                  className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(turn.id)}
                                className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTurnId(null)}
                                className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{turn.text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={() => onComplete(turns)}
            disabled={turns.length === 0}
            variant="outline"
            size="lg"
            className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
          >
            Generate Podcast ({turns.length} statements)
          </Button>
        </div>
      </div>
    </div>
  );
}
