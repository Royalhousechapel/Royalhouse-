import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/utils/alert';
import { useColors } from '@/hooks/useColors';
import {
  getListAdminMembersQueryKey,
  useCreateAdminMember,
  useListAdminMembers,
  useListBranches,
  useUpdateAdminMember,
} from '@workspace/api-client-react';
import type { ConnectPerson } from '@workspace/api-client-react';

type MemberDraft = { fullName: string; phone: string; email: string; branchId: string };
const emptyDraft: MemberDraft = { fullName: '', phone: '', email: '', branchId: '' };

export function AdminMembersWorkspace({ canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ConnectPerson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(emptyDraft);
  const membersQuery = useListAdminMembers(search.trim() ? { search: search.trim() } : undefined);
  const branchesQuery = useListBranches();
  const createMember = useCreateAdminMember();
  const updateMember = useUpdateAdminMember();
  const branches = branchesQuery.data?.filter((branch) => !branch.archived) ?? [];
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };
  const openEdit = (member: ConnectPerson) => {
    setEditing(member);
    setDraft({ fullName: member.fullName, phone: member.phone ?? '', email: member.email ?? '', branchId: member.branchId ?? '' });
    setShowForm(true);
  };
  const save = async () => {
    if (!draft.fullName.trim()) {
      Alert.alert('Name required', 'Enter the member’s name before saving.');
      return;
    }
    try {
      if (editing) {
        await updateMember.mutateAsync({ id: editing.id, data: {
          fullName: draft.fullName.trim(),
          phone: draft.phone.trim() || null,
          email: draft.email.trim().toLowerCase() || null,
          branchId: draft.branchId || null,
        } });
      } else {
        await createMember.mutateAsync({ data: {
          fullName: draft.fullName.trim(),
          phone: draft.phone.trim() || undefined,
          email: draft.email.trim().toLowerCase() || undefined,
          branchId: draft.branchId || null,
        } });
      }
      await queryClient.invalidateQueries({ queryKey: getListAdminMembersQueryKey() });
      setEditing(null);
      setDraft(emptyDraft);
      setShowForm(false);
      Alert.alert(editing ? 'Member updated' : 'Member added', 'The shared member record has been saved.');
    } catch (error) {
      Alert.alert('Could not save member', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="people-outline" size={21} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Member records</Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>Search and update the shared people directory.</Text>
        </View>
        {canCreate ? <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.addText}>Add</Text></Pressable> : null}
      </View>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Name, email, phone, or member ID" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
      </View>
      {membersQuery.isLoading ? <Text style={[styles.muted, styles.status, { color: colors.mutedForeground }]}>Loading member records…</Text> : null}
      {membersQuery.isError ? <Text style={[styles.error, styles.status]}>{membersQuery.error instanceof Error ? membersQuery.error.message : 'Could not load members.'}</Text> : null}
      {!membersQuery.isLoading && !membersQuery.isError && members.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={25} color={colors.accent} />
          <Text style={[styles.heading, { color: colors.foreground }]}>No members found</Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>{search ? 'Try another search.' : 'Member profiles will appear here when they are added.'}</Text>
        </View>
      ) : null}
      {members.map((member) => (
        <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={[styles.avatarText, { color: colors.accent }]}>{member.fullName.slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.flex}>
            <Text style={[styles.memberName, { color: colors.foreground }]}>{member.fullName}</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>{member.memberId || member.membershipStatus.replaceAll('_', ' ')}</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>{member.phone || member.email || 'Contact details not set'}</Text>
          </View>
          {canUpdate ? <Pressable onPress={() => openEdit(member)} hitSlop={10} style={styles.editButton}><Ionicons name="create-outline" size={19} color={colors.accent} /><Text style={[styles.editText, { color: colors.accent }]}>Edit</Text></Pressable> : null}
        </View>
      ))}

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => { setEditing(null); setDraft(emptyDraft); setShowForm(false); }}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <View><Text style={[styles.eyebrow, { color: colors.accent }]}>SHARED DIRECTORY</Text><Text style={[styles.heading, { color: colors.foreground }]}>{editing ? 'Edit member' : 'Add member'}</Text></View>
              <Pressable onPress={() => { setEditing(null); setDraft(emptyDraft); setShowForm(false); }} hitSlop={10}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: colors.foreground }]}>Full name</Text>
              <TextInput value={draft.fullName} onChangeText={(value) => setDraft((current) => ({ ...current, fullName: value }))} placeholder="Member name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <Text style={[styles.label, { color: colors.foreground }]}>Phone</Text>
              <TextInput value={draft.phone} onChangeText={(value) => setDraft((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" placeholder="Optional" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput value={draft.email} onChangeText={(value) => setDraft((current) => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <Text style={[styles.label, { color: colors.foreground }]}>Branch</Text>
              <View style={styles.branchOptions}>
                <Pressable onPress={() => setDraft((current) => ({ ...current, branchId: '' }))} style={[styles.branchChip, { backgroundColor: draft.branchId === '' ? colors.accent : colors.background, borderColor: draft.branchId === '' ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: draft.branchId === '' ? '#FFFFFF' : colors.foreground }]}>Unassigned</Text></Pressable>
                {branches.map((branch) => <Pressable key={branch.id} onPress={() => setDraft((current) => ({ ...current, branchId: branch.id }))} style={[styles.branchChip, { backgroundColor: draft.branchId === branch.id ? colors.accent : colors.background, borderColor: draft.branchId === branch.id ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: draft.branchId === branch.id ? '#FFFFFF' : colors.foreground }]}>{branch.name}</Text></Pressable>)}
              </View>
              {(editing ? canUpdate : canCreate) ? <Pressable onPress={() => void save()} disabled={createMember.isPending || updateMember.isPending} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" /><Text style={styles.saveText}>{createMember.isPending || updateMember.isPending ? 'Saving…' : editing ? 'Save member' : 'Create member'}</Text></Pressable> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  intro: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  heading: { fontSize: 14, fontWeight: '700' },
  muted: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  addText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  search: { borderWidth: 1, borderRadius: 10, minHeight: 43, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 8 },
  status: { padding: 8 },
  error: { color: '#A12D2D', fontSize: 12 },
  empty: { alignItems: 'center', gap: 7, padding: 22, borderRadius: 14, borderWidth: 1 },
  memberCard: { borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  memberName: { fontSize: 13, fontWeight: '700' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 11, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 26 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 5 },
  input: { minHeight: 42, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, fontSize: 12 },
  branchOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  branchChip: { borderWidth: 1, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 9 },
  chipText: { fontSize: 10, fontWeight: '600' },
  saveButton: { minHeight: 43, borderRadius: 10, marginTop: 17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  saveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
