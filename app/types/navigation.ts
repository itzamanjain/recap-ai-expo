import { NativeStackScreenProps } from "@react-navigation/native-stack";

export interface Meeting {
  id: string;
  title: string;
  timestamp: string;
  uri: string;
  duration: number;
  hasTranscript: boolean;
  transcript?: string;
  summary?: string;
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