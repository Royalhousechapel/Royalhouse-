import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export function WelcomeLink() {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable testID="link-welcome" accessibilityRole="button" onPress={() => router.push('/welcome' as never)} style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="id-card-outline" size={22} color={colors.accent} />
      <View style={{ flex: 1 }}><Text style={[s.t, { color: colors.foreground }]}>New here? Register as a visitor</Text><Text style={[s.m, { color: colors.mutedForeground }]}>Get your visitor ID and request membership</Text></View>
      <Ionicons name="chevron-forward" size={18} color={colors.accent} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 13, marginVertical: 8 },
  t: { fontSize: 14, fontWeight: '700' }, m: { fontSize: 12, marginTop: 2 },
});
