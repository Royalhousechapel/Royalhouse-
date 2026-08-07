import React, { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link, useRouter } from 'expo-router';
import { useAuth, useSignIn, useSSO } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const busy = fetchStatus === 'fetching';

  useEffect(() => {
    if (isSignedIn) router.replace('/(tabs)');
  }, [isSignedIn, router]);

  const finishSignIn = useCallback(async () => {
    await signIn.finalize({
      navigate: () => router.replace('/(tabs)'),
    });
  }, [router, signIn]);

  const submit = async () => {
    setErrorMessage('');
    const result = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) {
      setErrorMessage(result.error.message ?? 'Unable to sign in. Check your details and try again.');
      return;
    }
    if (signIn.status === 'complete') {
      await finishSignIn();
    } else {
      setErrorMessage('This account needs an additional verification step before it can continue.');
    }
  };

  const googleSignIn = async () => {
    setErrorMessage('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'royalhouse-mobile' }),
      });
      if (createdSessionId) await setActive!({ session: createdSessionId });
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in was not completed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Ionicons name="flame" size={30} color={colors.accent} /></View>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>ROYALHOUSE CHAPEL WORLDWIDE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Welcome back.</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to continue your kingdom journey.</Text>
      <Text style={[styles.label, { color: colors.foreground }]}>Email address</Text>
      <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={emailAddress} onChangeText={setEmailAddress} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
      {(errorMessage || errors?.fields?.identifier?.message) ? <Text style={styles.error}>{errorMessage || errors?.fields?.identifier?.message}</Text> : null}
      <Pressable disabled={!emailAddress || !password || busy} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.accent }, busy && styles.disabled]}><Text style={styles.primaryButtonText}>{busy ? 'Signing in…' : 'Sign in'}</Text></Pressable>
      <View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /><Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /></View>
      <Pressable disabled={busy} onPress={googleSignIn} style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="logo-google" size={18} color={colors.foreground} /><Text style={[styles.googleText, { color: colors.foreground }]}>Continue with Google</Text></Pressable>
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>New to Royalhouse? </Text><Pressable onPress={() => router.push('./sign-up')}><Text style={[styles.link, { color: colors.accent }]}>Create an account</Text></Pressable></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 86, paddingBottom: 40 },
  brandMark: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '700', marginTop: 10 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 15, marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 10 },
  primaryButton: { height: 51, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 24 },
  dividerLine: { height: 1, flex: 1 },
  dividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  googleButton: { height: 50, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  googleText: { fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 12 },
  link: { fontSize: 12, fontWeight: '800' },
});