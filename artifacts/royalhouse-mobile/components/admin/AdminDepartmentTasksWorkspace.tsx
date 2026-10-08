import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/utils/alert';
import { useColors } from '@/hooks/useColors';
import {
  getListDepartmentTasksQueryKey,
  useCompleteDepartmentTask,
  useCreateDepartmentTask,
  useListDepartmentTasks,
} from '@workspace/api-client-react';

export function AdminDepartmentTasksWorkspace({ roleName, canManage }: { roleName: string; canManage: boolean }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const tasksQuery = useListDepartmentTasks();
  const createTask = useCreateDepartmentTask();
  const completeTask = useCompleteDepartmentTask();
  const tasks = tasksQuery.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListDepartmentTasksQueryKey() });

  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Task title required', 'Enter a title before adding the task.');
      return;
    }
    try {
      await createTask.mutateAsync({ data: { title: title.trim(), description: description.trim() || undefined } });
      setTitle('');
      setDescription('');
      await refresh();
    } catch (error) {
      Alert.alert('Could not add task', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const markDone = async (id: string) => {
    try {
      await completeTask.mutateAsync({ id });
      await refresh();
    } catch (error) {
      Alert.alert('Could not complete task', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="checkbox-outline" size={22} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={[styles.heading, { color: colors.foreground }]}>{roleName} task queue</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Shared department work items. These are tasks, not finance, event, or media records.</Text>
        </View>
      </View>
      {canManage ? (
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Add a department task</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Details (optional)" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, styles.multiline, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <Pressable onPress={() => void addTask()} disabled={createTask.isPending} style={[styles.primaryButton, { backgroundColor: colors.primary }, createTask.isPending && styles.disabled]}>
            <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" /><Text style={styles.primaryText}>{createTask.isPending ? 'Saving…' : 'Add task'}</Text>
          </Pressable>
        </View>
      ) : null}
      {tasksQuery.isLoading ? <Text style={[styles.body, { color: colors.mutedForeground }]}>Loading department tasks…</Text> : null}
      {tasksQuery.isError ? <Text style={styles.error}>{tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Could not load department tasks.'}</Text> : null}
      {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="checkmark-done-outline" size={26} color={colors.accent} />
          <Text style={[styles.heading, { color: colors.foreground }]}>No tasks yet</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{canManage ? 'Add the first shared item for this department.' : 'Your department’s shared work queue is empty.'}</Text>
        </View>
      ) : null}
      {tasks.map((task) => (
        <View key={task.id} style={[styles.task, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flex}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
              <Text style={[styles.status, { color: task.status === 'completed' ? '#247342' : colors.accent, backgroundColor: task.status === 'completed' ? '#E7F5EC' : '#F8F1D7' }]}>{task.status.toUpperCase()}</Text>
            </View>
            {task.description ? <Text style={[styles.body, { color: colors.mutedForeground }]}>{task.description}</Text> : null}
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>Updated {new Date(task.updatedAt).toLocaleDateString()}</Text>
          </View>
          {canManage && task.status !== 'completed' ? (
            <Pressable onPress={() => void markDone(task.id)} hitSlop={8} style={styles.doneButton}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#247342" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderWidth: 1, borderRadius: 14 },
  flex: { flex: 1, minWidth: 0 },
  heading: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  form: { padding: 12, borderWidth: 1, borderRadius: 14 },
  formTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 42, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, fontSize: 12, marginBottom: 8 },
  multiline: { minHeight: 62, paddingTop: 10, textAlignVertical: 'top' },
  primaryButton: { minHeight: 40, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  empty: { alignItems: 'center', padding: 22, borderRadius: 14, borderWidth: 1 },
  task: { borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  taskTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  status: { overflow: 'hidden', fontSize: 8, fontWeight: '800', letterSpacing: 0.4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10 },
  meta: { fontSize: 9, marginTop: 5 },
  doneButton: { padding: 5 },
  error: { fontSize: 12, color: '#A12D2D', padding: 8 },
});
