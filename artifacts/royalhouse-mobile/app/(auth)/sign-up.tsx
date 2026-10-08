import React, { useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAuth, useSignUp } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const busy = fetchStatus === 'fetching';

  useEffect(() => {
    if (isSignedIn) router.replace('/(tabs)');
  }, [isSignedIn, router]);

  const submit = async () => {
    setErrorMessage('');
    const result = await signUp.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) {
      setErrorMessage(result.error.message ?? 'Unable to create your account.');
      return;
    }
    await signUp.verifications.sendEmailCode();
  };

  const verify = async () => {
    setErrorMessage('');
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) {
      setErrorMessage(result.error.message ?? 'That verification code is not valid.');
      return;
    }
    if (signUp.status === 'complete') {
      await signUp.finalize({ navigate: () => router.replace('/welcome' as never) });
    }
  };

  const verifying = signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address');
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Ionicons name="flame" size={30} color={colors.accent} /></View>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>JOIN THE HOUSE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{verifying ? 'Verify your email.' : 'Create your account.'}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{verifying ? `We sent a verification code to ${emailAddress}.` : 'Create a secure account for your Royalhouse journey.'}</Text>
      {!verifying ? <><Text style={[styles.label, { color: colors.foreground }]}>Email address</Text><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={emailAddress} onChangeText={setEmailAddress} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.label, { color: colors.foreground }]}>Password</Text><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><View nativeID="clerk-captcha" /></> : <><Text style={[styles.label, { color: colors.foreground }]}>Verification code</Text><TextInput keyboardType="number-pad" value={code} onChangeText={setCode} placeholder="Enter the code from your email" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /></>}
      {(errorMessage || errors?.fields?.emailAddress?.message) ? <Text style={styles.error}>{errorMessage || errors?.fields?.emailAddress?.message}</Text> : null}
      <Pressable disabled={busy || (!verifying && (!emailAddress || !password)) || (verifying && !code)} onPress={verifying ? verify : submit} style={[styles.primaryButton, { backgroundColor: colors.accent }, busy && styles.disabled]}><Text style={styles.primaryButtonText}>{busy ? 'Please wait…' : verifying ? 'Verify email' : 'Create account'}</Text></Pressable>
      {verifying ? <Pressable disabled={busy} onPress={() => signUp.verifications.sendEmailCode()} style={styles.resend}><Text style={[styles.resendText, { color: colors.accent }]}>Send me a new code</Text></Pressable> : null}
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text><Pressable onPress={() => router.push('./sign-in')}><Text style={[styles.link, { color: colors.accent }]}>Sign in</Text></Pressable></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 86, paddingBottom: 40 },
  brandMark: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: '700', marginTop: 10 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 15, marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 10 },
  primaryButton: { height: 51, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  resend: { alignItems: 'center', marginTop: 18 },
  resendText: { fontSize: 12, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 12 },
  link: { fontSize: 12, fontWeight: '800' },
});