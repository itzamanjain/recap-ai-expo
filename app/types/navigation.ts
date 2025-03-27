// navigation.ts
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface Meeting {
  id: string;
  title: string;
  timestamp: string;
  uri: string;
  duration: number;
  language?: string;
  hasTranscript: boolean;
  transcript?: string;
  summary?: string;
  icon?: string;
  addons?: string;
}

export type RootStackParamList = {
  '(tabs)': {
    screen: 'index' | 'record' | 'transcripts';
    params?: {
      newMeeting?: Meeting;
      meetingId?: string;
    };
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Dummy default export to silence the warning
export default {};