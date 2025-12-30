export type Sex = 'male' | 'female';

export interface Person {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  personality: string;
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
