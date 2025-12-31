export type Sex = 'male' | 'female';

export type PersonalityType = 'energetic' | 'calm' | 'sophisticated';

export interface Person {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  personalityType: PersonalityType;
  personality?: string; // Optional detailed description for future ElevenLabs use
  isAI: boolean;
}

export interface ConversationTurn {
  id: string;
  personId: string;
  text: string;
  isGenerated: boolean;
}

export interface Conversation {
  id: string;
  persons: Person[];
  turns: ConversationTurn[];
}

export type AuthScreen = 'login' | 'register' | 'forgotPassword';

export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}
