import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getVoiceDescription } from '../services/polly';
import type { Person, Sex, PersonalityType } from '../types';

interface PersonSetupProps {
  onComplete: (persons: Person[]) => void;
}

export default function PersonSetup({ onComplete }: PersonSetupProps) {
  const [numberOfPersons, setNumberOfPersons] = useState<number>(2);
  const [persons, setPersons] = useState<Person[]>([]);
  const [currentStep, setCurrentStep] = useState<'count' | 'details'>('count');

  const handleNumberSubmit = () => {
    const initialPersons: Person[] = Array.from({ length: numberOfPersons }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Person ${i + 1}`,
      sex: 'male' as Sex,
      age: 30,
      personalityType: 'calm' as PersonalityType,
      personality: '',
      isAI: false,
    }));
    setPersons(initialPersons);
    setCurrentStep('details');
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPersons(persons.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleComplete = () => {
    const aiCount = persons.filter(p => p.isAI).length;

    if (aiCount > 1) {
      alert('Please select only one AI participant');
      return;
    }

    if (persons.some(p => !p.name)) {
      alert('Please fill in all person names');
      return;
    }

    onComplete(persons);
  };

  if (currentStep === 'count') {
    return (
      <div className="container section">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">How many persons in the conversation?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="person-count">Number of participants (2-10)</Label>
              <Input
                id="person-count"
                type="number"
                min="2"
                max="10"
                value={numberOfPersons}
                onChange={(e) => setNumberOfPersons(parseInt(e.target.value))}
                className="w-32"
              />
            </div>
            <Button onClick={handleNumberSubmit} variant="outline" className="w-full text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white">
              Next
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Define Each Person</h2>
        <div className="form-section">
          {persons.map((person, index) => (
            <Card key={person.id}>
              <CardHeader>
                <CardTitle>Person {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`name-${person.id}`}>Name</Label>
                  <Input
                    id={`name-${person.id}`}
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`sex-${person.id}`}>Sex</Label>
                  <Select
                    value={person.sex}
                    onValueChange={(value: Sex) => updatePerson(person.id, { sex: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`age-${person.id}`}>Age</Label>
                  <Input
                    id={`age-${person.id}`}
                    type="number"
                    min="18"
                    max="100"
                    value={person.age}
                    onChange={(e) => updatePerson(person.id, { age: parseInt(e.target.value) })}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`personality-type-${person.id}`}>Voice Character</Label>
                  <Select
                    value={person.personalityType}
                    onValueChange={(value: PersonalityType) => updatePerson(person.id, { personalityType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice character" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="energetic">Energetic & Young</SelectItem>
                      <SelectItem value="calm">Calm & Authoritative</SelectItem>
                      <SelectItem value="sophisticated">Sophisticated & British</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getVoiceDescription(person.personalityType, person.sex)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      id={`ai-${person.id}`}
                      type="checkbox"
                      checked={person.isAI}
                      onChange={(e) => updatePerson(person.id, { isAI: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`ai-${person.id}`}>AI-controlled participant</Label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={`personality-${person.id}`}>
                    Personality Details
                    <span className="text-muted-foreground text-sm ml-2">(optional, for AI generation)</span>
                  </Label>
                  <Textarea
                    id={`personality-${person.id}`}
                    value={person.personality || ''}
                    onChange={(e) => updatePerson(person.id, { personality: e.target.value })}
                    placeholder="Describe the personality, speaking style, expertise... (used for AI conversation generation)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('count')}
            className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
          >
            Back
          </Button>
          <Button
            onClick={handleComplete}
            variant="outline"
            className="sm:ml-auto text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
          >
            Start Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
