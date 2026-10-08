import React from 'react';
import { useRouter } from 'expo-router';
import { EventsScreen } from './(tabs)/index';

export default function EventsPage() {
  const router = useRouter();
  return <EventsScreen close={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }} />;
}
