import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function OfficialMediaLinks() {
  const colors = useColors();
  return (
    <View style={{ gap: 8, marginVertical: 8 }}>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.youtube.com/@powerlinetv')} style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="logo-youtube" size={22} color={colors.accent} />
        <View style={s.flex}><Text style={[s.title, { color: colors.foreground }]}>Official YouTube</Text><Text style={[s.meta, { color: colors.mutedForeground }]}>Powerline TV, verified on royalhousechapel.org</Text></View>
        <Ionicons name="open-outline" size={18} color={colors.accent} />
      </Pressable>
      <View style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="mic-outline" size={22} color={colors.mutedForeground} />
        <View style={s.flex}><Text style={[s.title, { color: colors.foreground }]}>Rev. Thomas podcast and media</Text><Text style={[s.meta, { color: colors.mutedForeground }]}>Coming soon</Text></View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 13 },
  flex: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
});
