import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import {
  AdminUserRole,
  getListAdminUsersQueryKey,
  useGrantAdminAccess,
  useListAdminUsers,
  useUpdateAdminUser,
} from '@workspace/api-client-react';
import type { AdminUser, AdminUserRole as AdminUserRoleType } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

const assignableRoles = Object.values(AdminUserRole);

export function AdminUsersRolesWorkspace() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const usersQuery = useListAdminUsers();
  const grantAccess = useGrantAdminAccess();
  const updateUser = useUpdateAdminUser();
  const [email, setEmail] = useState('');
  const [grantRole, setGrantRole] = useState<AdminUserRoleType>('Branch Administrator');
  const [filter, setFilter] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const users = usersQuery.data ?? [];
  const editingUser = users.find((user) => user.clerkUserId === editingUserId);
  const modalRole = editingUser?.role ?? grantRole;
  const filteredUsers = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      `${user.email ?? ''} ${user.fullName ?? ''} ${user.role}`.toLowerCase().includes(needle),
    );
  }, [filter, users]);

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  const grant = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address on the person’s verified Clerk account.');
      return;
    }
    try {
      await grantAccess.mutateAsync({ data: { email: email.trim(), role: grantRole } });
      await refreshUsers();
      setEmail('');
      Alert.alert('Admin access saved', `${grantRole} access is now active for this account.`);
    } catch (error) {
      Alert.alert('Could not grant access', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const chooseRole = async (role: AdminUserRoleType) => {
    setRoleModalOpen(false);
    if (!editingUserId) {
      setGrantRole(role);
      return;
    }
    if (role === editingUser?.role) {
      setEditingUserId(null);
      return;
    }
    try {
      await updateUser.mutateAsync({ clerkUserId: editingUserId, data: { role } });
      await refreshUsers();
      setEditingUserId(null);
      Alert.alert('Role updated', `This account now has ${role} access.`);
    } catch (error) {
      Alert.alert('Could not update role', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const setUserActive = async (user: AdminUser, active: boolean) => {
    try {
      await updateUser.mutateAsync({ clerkUserId: user.clerkUserId, data: { active } });
      await refreshUsers();
    } catch (error) {
      Alert.alert(active ? 'Could not restore access' : 'Could not remove access', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const confirmRemove = (user: AdminUser) => {
    Alert.alert(
      'Remove admin access?',
      `This disables ${user.email ?? user.fullName ?? 'this account'}’s admin access. Their Clerk login and password are not changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove access', style: 'destructive', onPress: () => void setUserActive(user, false) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.introCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: '#F8F1D7' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Administrator access</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              Grant roles to existing, verified Clerk accounts. This does not create login credentials or send passwords.
            </Text>
          </View>
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>Account email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
        />
        <Text style={[styles.label, { color: colors.foreground }]}>Role</Text>
        <Pressable
          onPress={() => { setEditingUserId(null); setRoleModalOpen(true); }}
          style={[styles.roleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Text style={[styles.roleButtonText, { color: colors.foreground }]}>{grantRole}</Text>
          <Ionicons name="chevron-down" size={17} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={() => void grant()}
          disabled={grantAccess.isPending}
          style={[styles.primaryButton, { backgroundColor: colors.primary }, grantAccess.isPending && styles.disabled]}
        >
          <Ionicons name="person-add-outline" size={17} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{grantAccess.isPending ? 'Saving…' : 'Grant or update access'}</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Assigned accounts</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{users.length}</Text>
      </View>
      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Search by email, name, or role"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        style={[styles.input, styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
      />

      {usersQuery.isLoading ? (
        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Loading administrator accounts…</Text>
      ) : usersQuery.isError ? (
        <Text style={[styles.statusText, { color: colors.destructive }]}>
          {usersQuery.error instanceof Error ? usersQuery.error.message : 'Could not load administrator accounts.'}
        </Text>
      ) : filteredUsers.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={26} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{users.length ? 'No matching accounts' : 'No assignments yet'}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {users.length ? 'Try another search.' : 'Grant access to a verified Clerk account using the form above.'}
          </Text>
        </View>
      ) : filteredUsers.map((user) => (
        <View key={user.clerkUserId} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.userHeader}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                {user.fullName || user.email || 'Clerk account'}
              </Text>
              {user.fullName && user.email ? <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{user.email}</Text> : null}
              <View style={styles.badges}>
                <Text style={[styles.badge, { color: colors.accent, backgroundColor: '#F8F1D7' }]}>{user.role}</Text>
                <Text style={[styles.statusBadge, { color: user.active ? '#247342' : colors.destructive, backgroundColor: user.active ? '#E7F5EC' : '#FCE8E8' }]}>
                  {user.active ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => { setGrantRole(user.role); setEditingUserId(user.clerkUserId); setRoleModalOpen(true); }}
              style={[styles.secondaryButton, { borderColor: colors.border }]}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Change role</Text>
            </Pressable>
            {user.active ? (
              <Pressable onPress={() => confirmRemove(user)} style={[styles.secondaryButton, { borderColor: '#E5BABA' }]}>
                <Ionicons name="person-remove-outline" size={16} color={colors.destructive} />
                <Text style={[styles.secondaryButtonText, { color: colors.destructive }]}>Remove</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => void setUserActive(user, true)} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Restore</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      <Modal visible={roleModalOpen} transparent animationType="slide" onRequestClose={() => { setRoleModalOpen(false); setEditingUserId(null); }}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>ADMIN ACCESS</Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{editingUserId ? 'Change role' : 'Choose role'}</Text>
              </View>
              <Pressable onPress={() => { setRoleModalOpen(false); setEditingUserId(null); }} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {assignableRoles.map((role) => (
                <Pressable
                  key={role}
                  onPress={() => void chooseRole(role)}
                  style={[styles.roleOption, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.roleOptionText, { color: colors.foreground }]}>{role}</Text>
                  {modalRole === role ? <Ionicons name="checkmark-circle" size={19} color={colors.accent} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12 },
  introCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 13, marginBottom: 6 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  roleButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleButtonText: { fontSize: 13, fontWeight: '600' },
  primaryButton: { minHeight: 44, marginTop: 13, borderRadius: 10, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  listHeader: { marginTop: 22, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '700' },
  searchInput: { marginBottom: 11 },
  statusText: { fontSize: 12, marginVertical: 14 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 3 },
  userCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 13, fontWeight: '700' },
  userEmail: { fontSize: 11, marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  badge: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '700' },
  statusBadge: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 38, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryButtonText: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 25 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  roleOption: { minHeight: 47, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleOptionText: { fontSize: 13, fontWeight: '600' },
});
