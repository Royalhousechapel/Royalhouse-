import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from './index';

export default function ProfileTab() {
  const router = useRouter();
  return <ProfileScreen navigate={(screen) => {
    if (screen === 'give') router.push('/(tabs)/give');
    if (screen === 'sermons') router.push('/(tabs)/sermons');
    if (screen === 'home') router.push('/(tabs)');
  }} />;
}