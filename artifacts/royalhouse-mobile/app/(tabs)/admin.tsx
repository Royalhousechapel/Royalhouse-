import React from 'react';
import { useRouter } from 'expo-router';
import { AdminDashboardScreen } from './index';

export default function AdminTab() {
  const router = useRouter();
  return <AdminDashboardScreen standalone close={() => router.back()} />;
}