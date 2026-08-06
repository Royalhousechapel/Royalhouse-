import React from 'react';
import { useRouter } from 'expo-router';
import { BranchesScreen } from './index';

export default function BranchesTab() {
  const router = useRouter();
  return <BranchesScreen standalone close={() => router.back()} />;
}