import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { OfficialMediaLinks } from '@/components/visitors/OfficialMediaLinks';
import {
  getGetVisitorProfileQueryKey,
  useGetVisitorProfile,
  useRegisterVisitor,
  useRequestVisitorMembership,
} from '@workspace/api-client-react';
import type { VisitorIdentity } from '@workspace/api-client-react';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

function Identity() {
  const colors = useColors();
  const { user } = useUser();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const key = [...getGetVisitorProfileQueryKey(), userId] as const;
  const q = useGetVisitorProfile({ query: { queryKey: key, enabled: Boolean(userId), refetchInterval: 30000, refetchOnMount: 'always' } });
  const register = useRegisterVisitor();
  const request = useRequestVisitorMembership();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const profile = q.data?.profile ?? null;
  const set = (p: VisitorIdentity) => { qc.setQueryData(key, { profile: p }); void qc.invalidateQueries({ queryKey: getGetVisitorProfileQueryKey() }); };

  const doRegister = async () => {
    setError('');
    try {
      const p = await register.mutateAsync({ data: { fullName: fullName.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) } });
      set(p);
    } catch (e) { setError(errMsg(e)); }
  };
  const doRequest = async () => {
    setError('');
    try { set(await request.mutateAsync()); } catch (e) { setError(errMsg(e)); }
  };
  const card = [st.card, { backgroundColor: colors.card, borderColor: colors.border }];

  if (q.isLoading) return <View style={card}><Text style={{ color: colors.mutedForeground }}>Loading your identity…</Text></View>;
  if (q.isError) return <View style={card}><Text style={st.err}>{errMsg(q.error)}</Text><Pressable onPress={() => void q.refetch()}><Text style={[st.link, { color: colors.accent }]}>Retry</Text></Pressable></View>;

  if (!profile) {
    return (
      <View style={card}>
        <Text style={[st.h, { color: colors.foreground }]}>Register as a visitor</Text>
        <Text style={[st.label, { color: colors.foreground }]}>Full name</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={colors.mutedForeground} style={[st.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
        <Text style={[st.label, { color: colors.foreground }]}>Phone (optional, with country code)</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+233 24 000 0000" placeholderTextColor={colors.mutedForeground} style={[st.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
        {error ? <Text style={st.err}>{error}</Text> : null}
        <Pressable disabled={register.isPending || fullName.trim().length < 2} onPress={() => void doRegister()} style={[st.btn, { backgroundColor: colors.primary }, (register.isPending || fullName.trim().length < 2) && { opacity: 0.55 }]}>
          <Text style={st.bt}>{register.isPending ? 'Saving…' : 'Register'}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={card}>
      <Text style={[st.h, { color: colors.foreground }]}>{profile.fullName}</Text>
      <Text style={[st.label, { color: colors.mutedForeground }]}>Visitor ID</Text>
      <Text selectable style={[st.id, { color: colors.accent }]}>{profile.visitorId ?? 'Not issued'}</Text>
      {profile.registrationState === 'member' ? (
        <>
          <Text style={[st.label, { color: colors.mutedForeground }]}>Permanent member ID</Text>
          <Text selectable style={[st.id, { color: colors.accent }]}>{profile.memberId ?? 'Not issued'}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Membership approved. Your original visitor ID is retained.</Text>
        </>
      ) : profile.registrationState === 'requested' ? (
        <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 8 }}>Membership request pending staff approval. This page updates automatically.</Text>
      ) : (
        <>
          {error ? <Text style={st.err}>{error}</Text> : null}
          <Pressable disabled={request.isPending} onPress={() => void doRequest()} style={[st.btn, { backgroundColor: colors.primary }, request.isPending && { opacity: 0.55 }]}>
            <Text style={st.bt}>{request.isPending ? 'Sending…' : 'Request permanent membership'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={st.c}>
      <Stack.Screen options={{ title: 'Welcome' }} />
      <Text style={[st.eye, { color: colors.accent }]}>WELCOME</Text>
      <Text style={[st.title, { color: colors.foreground }]}>Royalhouse Chapel International</Text>
      <Text style={[st.body, { color: colors.mutedForeground }]}>Founded in 1992 by Apostle General Sam Korankye Ankrah. Our headquarters is at Ahenfie, Accra, Ghana. Explore the branch directory and our service and live content to find your place in the house.</Text>
      <Pressable onPress={() => router.push('/branches' as never)} style={[st.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="location-outline" size={20} color={colors.accent} /><Text style={[st.rt, { color: colors.foreground }]}>Branch directory</Text></Pressable>
      <Pressable onPress={() => router.push('/sermons' as never)} style={[st.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="play-circle-outline" size={20} color={colors.accent} /><Text style={[st.rt, { color: colors.foreground }]}>Services and live content</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://royalhousechapel.org/')} style={[st.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="globe-outline" size={20} color={colors.accent} /><Text style={[st.rt, { color: colors.foreground }]}>Official website</Text></Pressable>
      <OfficialMediaLinks />
      {isSignedIn ? <Identity /> : (
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[st.h, { color: colors.foreground }]}>Become a registered visitor</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Create an account with a verified email to receive your visitor ID.</Text>
          <Pressable onPress={() => router.push('/sign-up' as never)} style={[st.btn, { backgroundColor: colors.primary }]}><Text style={st.bt}>Sign up</Text></Pressable>
          <Pressable onPress={() => router.push('/sign-in' as never)}><Text style={[st.link, { color: colors.accent }]}>Sign in</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}
const st = StyleSheet.create({
  c: { padding: 20, gap: 10, paddingBottom: 50 },
  eye: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 27, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 21, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 13 },
  rt: { fontSize: 14, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6, marginTop: 6 },
  h: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  input: { height: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  id: { fontSize: 13, lineHeight: 20, fontWeight: '700', letterSpacing: 0.2 },
  err: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
  btn: { height: 48, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  bt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  link: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
