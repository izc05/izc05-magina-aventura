import { useLocalSearchParams } from 'expo-router';

import AdventureEngineScreen from '../../src/features/adventure-engine/AdventureEngineScreen';

export default function ActiveAdventureRoute() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  return <AdventureEngineScreen slug={slug ?? ''} />;
}
