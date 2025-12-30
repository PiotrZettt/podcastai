import { useState } from 'react';
import type { Person, Sex } from '../types';

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
      sex: 'male',
      age: 30,
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
    const hasAI = persons.some(p => p.isAI);
    const aiCount = persons.filter(p => p.isAI).length;

    if (aiCount > 1) {
      alert('Please select only one AI participant');
      return;
    }

    if (persons.some(p => !p.name || !p.personality)) {
      alert('Please fill in all person details');
      return;
    }

    onComplete(persons);
  };

  if (currentStep === 'count') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2>How many persons in the conversation?</h2>
        <input
          type="number"
          min="2"
          max="10"
          value={numberOfPersons}
          onChange={(e) => setNumberOfPersons(parseInt(e.target.value))}
          style={{ padding: '0.5rem', fontSize: '1rem', marginRight: '1rem' }}
        />
        <button onClick={handleNumberSubmit} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          Next
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Define Each Person</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {persons.map((person, index) => (
          <div key={person.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h3>Person {index + 1}</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Name:
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                  style={{ marginLeft: '1rem', padding: '0.5rem', width: '200px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Sex:
                <select
                  value={person.sex}
                  onChange={(e) => updatePerson(person.id, { sex: e.target.value as Sex })}
                  style={{ marginLeft: '1rem', padding: '0.5rem' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Age:
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={person.age}
                  onChange={(e) => updatePerson(person.id, { age: parseInt(e.target.value) })}
                  style={{ marginLeft: '1rem', padding: '0.5rem', width: '100px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Personality:
                <textarea
                  value={person.personality}
                  onChange={(e) => updatePerson(person.id, { personality: e.target.value })}
                  placeholder="Describe the personality, speaking style, expertise..."
                  style={{ marginLeft: '1rem', padding: '0.5rem', width: '100%', minHeight: '80px', display: 'block', marginTop: '0.5rem' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={person.isAI}
                  onChange={(e) => updatePerson(person.id, { isAI: e.target.checked })}
                />
                AI-controlled participant
              </label>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setCurrentStep('count')}
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Start Conversation
        </button>
      </div>
    </div>
  );
}
