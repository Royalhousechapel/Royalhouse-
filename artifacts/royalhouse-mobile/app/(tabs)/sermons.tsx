import React from 'react';
import { useRouter } from 'expo-router';
import { SermonsScreen } from './index';

export default function SermonsTab() {
  const router = useRouter();
  return <SermonsScreen navigate={(screen) => {
    if (screen === 'give') router.push('/(tabs)/give');
    if (screen === 'profile') router.push('/(tabs)/profile');
    if (screen === 'home') router.push('/(tabs)');
  }} />;
}