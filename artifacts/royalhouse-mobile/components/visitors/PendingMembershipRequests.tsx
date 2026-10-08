import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { Alert } from '@/utils/alert';
import {
  getGetConnectSummaryQueryKey,
  getGetVisitorProfileQueryKey,
  getGetAdminProfileQueryKey,
  getListAdminMembersQueryKey,
  getListAdminVisitorsQueryKey,
  getListConnectPeopleQueryKey,
  useApproveVisitorMembership,
  useListAdminVisitors,
} from '@workspace/api-client-react';

export function PendingMembershipRequests({ canApprove }: { canApprove: boolean }) {
  const colors = useColors();
  const qc = useQueryClient();
  const q = useListAdminVisitors({ pendingOnly: true }, { query: { queryKey: getListAdminVisitorsQueryKey({ pendingOnly: true }), refetchInterval: 30000 } });
  const approve = useApproveVisitorMembership();
  const rows = q.data ?? [];
  const onApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListAdminVisitorsQueryKey() }),
        qc.invalidateQueries({ queryKey: getListAdminMembersQueryKey() }),
        qc.invalidateQueries({ queryKey: getListConnectPeopleQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetConnectSummaryQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetAdminProfileQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetVisitorProfileQueryKey() }),
      ]);
    } catch (e) {
      Alert.alert('Could not approve', e instanceof Error ? e.message : 'Please try again.');
    }
  };
  return (
    <View style={[s.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[s.h, { color: colors.foreground }]}>Pending membership approvals</Text>
      {q.isLoading ? <Text style={[s.m, { color: colors.mutedForeground }]}>Loading requests…</Text> : null}
      {q.isError ? <Pressable onPress={() => void q.refetch()}><Text style={s.err}>{q.error instanceof Error ? q.error.message : 'Could not load requests.'} Tap to retry.</Text></Pressable> : null}
      {!q.isLoading && !q.isError && rows.length === 0 ? <Text style={[s.m, { color: colors.mutedForeground }]}>No pending requests.</Text> : null}
      {rows.map((v) => (
        <View key={v.id} style={[s.row, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.n, { color: colors.foreground }]}>{v.fullName}</Text>
            <Text style={[s.m, { color: colors.mutedForeground }]}>{v.visitorId ?? 'No visitor ID'} · {v.email ?? v.phone ?? 'No contact'}</Text>
          </View>
          {canApprove ? (
            <Pressable accessibilityRole="button" disabled={approve.isPending} onPress={() => void onApprove(v.id)} style={[s.btn, { backgroundColor: colors.primary }, approve.isPending && { opacity: 0.6 }]}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" /><Text style={s.bt}>Approve</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 8 },
  h: { fontSize: 14, fontWeight: '700' },
  m: { fontSize: 11, lineHeight: 16 },
  err: { color: '#A12D2D', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 8 },
  n: { fontSize: 13, fontWeight: '700' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  bt: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
