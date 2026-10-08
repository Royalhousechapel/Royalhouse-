import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/utils/alert';
import { useColors } from '@/hooks/useColors';
import {
  getGetAdminRoleConfigQueryKey,
  useCreateAdminDepartment,
  useCreateAdminRole,
  useGetAdminRoleConfig,
  useUpdateAdminDepartment,
  useUpdateAdminRole,
} from '@workspace/api-client-react';
import type { AdminDepartment, AdminRole } from '@workspace/api-client-react';

type RoleDraft = { departmentId: string; name: string; modules: string[]; capabilities: string[]; grantable: boolean };
const blankRole = (departmentId = ''): RoleDraft => ({ departmentId, name: '', modules: [], capabilities: [], grantable: true });
const capabilityLabels: Record<string, string> = {
  'members.create': 'Add members',
  'members.update': 'Edit member records',
  'connect.view_all': 'View all Connect people',
  'connect.create_people': 'Add Connect people',
  'connect.assign': 'Assign Connect people',
  'connect.log_interactions': 'Log calls and care',
  'connect.complete_follow_ups': 'Complete follow-ups',
  'branches.manage': 'Add, edit, and archive branches',
  'tasks.manage': 'Create and complete department tasks',
  'tasks.view_all_departments': 'View tasks across departments',
  'audit.view': 'Read administrative activity',
};

export function AdminRoleConfigWorkspace() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const configQuery = useGetAdminRoleConfig();
  const createDepartment = useCreateAdminDepartment();
  const updateDepartment = useUpdateAdminDepartment();
  const createRole = useCreateAdminRole();
  const updateRole = useUpdateAdminRole();
  const [departmentFormOpen, setDepartmentFormOpen] = useState(false);
  const [departmentEditing, setDepartmentEditing] = useState<AdminDepartment | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState<AdminRole | null>(null);
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(blankRole());
  const departments = configQuery.data?.departments ?? [];
  const modules = configQuery.data?.availableModules ?? [];
  const capabilities = configQuery.data?.availableCapabilities ?? [];
  const activeDepartments = useMemo(() => departments.filter((department) => department.active), [departments]);

  const refresh = async () => queryClient.invalidateQueries({ queryKey: getGetAdminRoleConfigQueryKey() });
  const openDepartment = (department?: AdminDepartment) => {
    setDepartmentEditing(department ?? null);
    setDepartmentName(department?.name ?? '');
    setDepartmentFormOpen(true);
  };
  const saveDepartment = async () => {
    const name = departmentName.trim();
    if (!name) {
      Alert.alert('Department name required', 'Enter a name before saving.');
      return;
    }
    try {
      if (departmentEditing) await updateDepartment.mutateAsync({ id: departmentEditing.id, data: { name } });
      else await createDepartment.mutateAsync({ data: { name } });
      await refresh();
      setDepartmentFormOpen(false);
    } catch (error) {
      Alert.alert('Could not save department', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const changeDepartmentActive = async (department: AdminDepartment) => {
    try {
      await updateDepartment.mutateAsync({ id: department.id, data: { active: !department.active } });
      await refresh();
    } catch (error) {
      Alert.alert('Could not update department', error instanceof Error ? error.message : 'Move active admin assignments before deactivating this department.');
    }
  };
  const openNewRole = (departmentId = activeDepartments[0]?.id ?? '') => {
    setRoleEditing(null);
    setRoleDraft(blankRole(departmentId));
    setRoleFormOpen(true);
  };
  const openRole = (role: AdminRole) => {
    setRoleEditing(role);
    setRoleDraft({ departmentId: role.departmentId, name: role.name, modules: role.modules, capabilities: role.capabilities, grantable: role.grantable });
    setRoleFormOpen(true);
  };
  const toggle = (key: 'modules' | 'capabilities', value: string) => {
    setRoleDraft((current) => {
      const selected = current[key].includes(value);
      const nextValues = selected ? current[key].filter((item) => item !== value) : [...current[key], value];
      if (key === 'modules' && selected) {
        const moduleName = value;
        const capabilityPrefix: Record<string, string> = {
          Members: 'members.',
          'Connect Team': 'connect.',
          Branches: 'branches.',
          'Department Tasks': 'tasks.',
          'Audit Logs': 'audit.',
        };
        const prefix = capabilityPrefix[moduleName];
        return { ...current, modules: nextValues, capabilities: prefix ? current.capabilities.filter((item) => !item.startsWith(prefix)) : current.capabilities };
      }
      return { ...current, [key]: nextValues };
    });
  };
  const saveRole = async () => {
    if (!roleDraft.name.trim() || !roleDraft.departmentId) {
      Alert.alert('Role details required', 'Choose a department and enter a role name.');
      return;
    }
    try {
      const data = { ...roleDraft, name: roleDraft.name.trim() };
      if (roleEditing) await updateRole.mutateAsync({ id: roleEditing.id, data });
      else await createRole.mutateAsync({ data });
      await refresh();
      setRoleFormOpen(false);
    } catch (error) {
      Alert.alert('Could not save role', error instanceof Error ? error.message : 'Please check the selected permissions.');
    }
  };
  const changeRoleActive = async (role: AdminRole) => {
    try {
      await updateRole.mutateAsync({ id: role.id, data: { active: !role.active } });
      await refresh();
    } catch (error) {
      Alert.alert('Could not update role', error instanceof Error ? error.message : 'Move or remove active assignments before deactivating this role.');
    }
  };

  if (configQuery.isLoading) return <Text style={[styles.status, { color: colors.mutedForeground }]}>Loading department and role settings…</Text>;
  if (configQuery.isError) return <Text style={[styles.status, styles.error]}>{configQuery.error instanceof Error ? configQuery.error.message : 'Could not load role settings.'}</Text>;

  return (
    <View style={styles.container}>
      <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.iconBox, { backgroundColor: '#F8F1D7' }]}><Ionicons name="shield-checkmark-outline" size={21} color={colors.accent} /></View>
        <View style={styles.flex}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Departments & role access</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Configure saved role permissions. Previewing a role never changes the signed-in account’s actual access.</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Departments</Text>
        <Pressable onPress={() => openDepartment()} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={16} color="#FFFFFF" /><Text style={styles.smallButtonText}>Add</Text></Pressable>
      </View>
      {departments.map((department) => (
        <View key={department.id} style={[styles.departmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flex}>
            <View style={styles.departmentTitleRow}>
              <Text style={[styles.departmentTitle, { color: colors.foreground }]}>{department.name}</Text>
              <Text style={[styles.statusPill, { color: department.active ? '#247342' : colors.destructive, backgroundColor: department.active ? '#E7F5EC' : '#FCE8E8' }]}>{department.active ? 'ACTIVE' : 'INACTIVE'}</Text>
            </View>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{department.roles.length} configured {department.roles.length === 1 ? 'role' : 'roles'}</Text>
          </View>
          <Pressable onPress={() => openDepartment(department)} hitSlop={8}><Ionicons name="create-outline" size={18} color={colors.accent} /></Pressable>
          <Pressable onPress={() => void changeDepartmentActive(department)} hitSlop={8}><Ionicons name={department.active ? 'pause-circle-outline' : 'play-circle-outline'} size={19} color={department.active ? colors.destructive : '#247342'} /></Pressable>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Department roles</Text>
        <Pressable onPress={() => openNewRole()} disabled={activeDepartments.length === 0} style={[styles.smallButton, { backgroundColor: colors.primary }, activeDepartments.length === 0 && styles.disabled]}><Ionicons name="add" size={16} color="#FFFFFF" /><Text style={styles.smallButtonText}>Add role</Text></Pressable>
      </View>
      {departments.map((department) => (
        <View key={`${department.id}-roles`} style={styles.roleGroup}>
          <Text style={[styles.departmentLabel, { color: colors.accent }]}>{department.name}</Text>
          {department.roles.map((role) => (
            <View key={role.id} style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.flex}>
                <View style={styles.departmentTitleRow}>
                  <Text style={[styles.roleTitle, { color: colors.foreground }]}>{role.name}</Text>
                  {role.system ? <Text style={[styles.statusPill, { color: colors.accent, backgroundColor: '#F8F1D7' }]}>SYSTEM</Text> : null}
                  {!role.active ? <Text style={[styles.statusPill, { color: colors.destructive, backgroundColor: '#FCE8E8' }]}>INACTIVE</Text> : null}
                </View>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>{role.modules.length ? role.modules.join(' · ') : 'No administration modules'}{role.grantable ? ' · Grantable' : ''}</Text>
              </View>
              {!role.system ? <Pressable onPress={() => openRole(role)} hitSlop={8}><Ionicons name="create-outline" size={18} color={colors.accent} /></Pressable> : null}
              {!role.system ? <Pressable onPress={() => void changeRoleActive(role)} hitSlop={8}><Ionicons name={role.active ? 'pause-circle-outline' : 'play-circle-outline'} size={19} color={role.active ? colors.destructive : '#247342'} /></Pressable> : null}
            </View>
          ))}
        </View>
      ))}

      <Modal visible={departmentFormOpen} transparent animationType="slide" onRequestClose={() => setDepartmentFormOpen(false)}>
        <View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>ORGANIZATION</Text><Text style={[styles.heading, { color: colors.foreground }]}>{departmentEditing ? 'Edit department' : 'Add department'}</Text></View><Pressable onPress={() => setDepartmentFormOpen(false)} hitSlop={8}><Ionicons name="close" size={21} color={colors.foreground} /></Pressable></View>
          <TextInput value={departmentName} onChangeText={setDepartmentName} placeholder="Department name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
          <Pressable onPress={() => void saveDepartment()} disabled={createDepartment.isPending || updateDepartment.isPending} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Save department</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={roleFormOpen} transparent animationType="slide" onRequestClose={() => setRoleFormOpen(false)}>
        <View style={styles.backdrop}><View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>SAVED ACCESS CONFIGURATION</Text><Text style={[styles.heading, { color: colors.foreground }]}>{roleEditing ? 'Edit role' : 'Create role'}</Text></View><Pressable onPress={() => setRoleFormOpen(false)} hitSlop={8}><Ionicons name="close" size={21} color={colors.foreground} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.foreground }]}>Department</Text>
            <View style={styles.chipWrap}>{activeDepartments.map((department) => <Pressable key={department.id} onPress={() => setRoleDraft((current) => ({ ...current, departmentId: department.id }))} style={[styles.chip, { backgroundColor: roleDraft.departmentId === department.id ? colors.accent : colors.background, borderColor: roleDraft.departmentId === department.id ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: roleDraft.departmentId === department.id ? '#FFFFFF' : colors.foreground }]}>{department.name}</Text></Pressable>)}</View>
            <Text style={[styles.label, { color: colors.foreground }]}>Role name</Text>
            <TextInput value={roleDraft.name} onChangeText={(name) => setRoleDraft((current) => ({ ...current, name }))} placeholder="e.g. Welcome Team Lead" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Modules</Text>
            <View style={styles.permissionList}>{modules.map((module) => {
              const selected = roleDraft.modules.includes(module);
              const reserved = module === 'Users & Roles' || module === 'Settings';
              return <Pressable key={module} onPress={() => reserved ? Alert.alert('Super Admin only', `${module} access is reserved for the protected Super Admin role.`) : toggle('modules', module)} style={[styles.permissionRow, { borderColor: colors.border }]}><View style={[styles.checkbox, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.background }]}>{selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}</View><Text style={[styles.permissionText, { color: colors.foreground }]}>{module}</Text>{reserved ? <Text style={[styles.reserved, { color: colors.mutedForeground }]}>Super Admin only</Text> : null}</Pressable>;
            })}</View>
            <Text style={[styles.label, { color: colors.foreground }]}>Capabilities</Text>
            <View style={styles.permissionList}>{capabilities.map((capability) => {
              const selected = roleDraft.capabilities.includes(capability);
              const requiredModule = capability.startsWith('members.') ? 'Members' : capability.startsWith('connect.') ? 'Connect Team' : capability.startsWith('branches.') ? 'Branches' : capability.startsWith('tasks.') ? 'Department Tasks' : 'Audit Logs';
              const unavailable = !roleDraft.modules.includes(requiredModule);
              return <Pressable key={capability} disabled={unavailable} onPress={() => toggle('capabilities', capability)} style={[styles.permissionRow, { borderColor: colors.border }, unavailable && styles.unavailable]}><View style={[styles.checkbox, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.background }]}>{selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}</View><Text style={[styles.permissionText, { color: unavailable ? colors.mutedForeground : colors.foreground }]}>{capabilityLabels[capability] ?? capability}</Text></Pressable>;
            })}</View>
            <Pressable onPress={() => setRoleDraft((current) => ({ ...current, grantable: !current.grantable }))} style={[styles.permissionRow, styles.grantableRow, { borderColor: colors.border }]}><View style={[styles.checkbox, { borderColor: roleDraft.grantable ? colors.accent : colors.border, backgroundColor: roleDraft.grantable ? colors.accent : colors.background }]}>{roleDraft.grantable ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}</View><View style={styles.flex}><Text style={[styles.permissionText, { color: colors.foreground }]}>Assignable admin role</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Allow Super Admins to grant this role to an account.</Text></View></Pressable>
            <Pressable onPress={() => void saveRole()} disabled={createRole.isPending || updateRole.isPending} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>{createRole.isPending || updateRole.isPending ? 'Saving…' : 'Save role permissions'}</Text></Pressable>
          </ScrollView>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  intro: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 39, height: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  heading: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  sectionHeader: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  smallButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  departmentCard: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  departmentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  departmentTitle: { fontSize: 12, fontWeight: '700' },
  statusPill: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, fontSize: 7, fontWeight: '800' },
  roleGroup: { gap: 7 },
  departmentLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 5 },
  roleCard: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  roleTitle: { fontSize: 11, fontWeight: '700' },
  status: { fontSize: 12, paddingVertical: 15 },
  error: { color: '#A12D2D' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 26 },
  roleSheet: { maxHeight: '92%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  input: { minHeight: 42, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, fontSize: 12 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 7 },
  chipText: { fontSize: 9, fontWeight: '600' },
  permissionList: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, borderColor: '#E3E6ED' },
  permissionRow: { minHeight: 37, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  permissionText: { flex: 1, fontSize: 10, fontWeight: '600' },
  reserved: { fontSize: 8, fontWeight: '600' },
  unavailable: { opacity: 0.45 },
  grantableRow: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9 },
  primaryButton: { minHeight: 43, marginTop: 14, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
