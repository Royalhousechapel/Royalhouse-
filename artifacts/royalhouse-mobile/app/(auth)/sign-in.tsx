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
  const [recoveryStep, setRecoveryStep] = useState<'idle' | 'code' | 'new-password'>('idle');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
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

  const beginPasswordRecovery = async () => {
    if (!emailAddress.trim()) {
      setErrorMessage('Enter your account email address first.');
      return;
    }
    setErrorMessage('');
    setResetMessage('');
    try {
      const created = await signIn.create({ identifier: emailAddress.trim() });
      if (created.error) {
        setErrorMessage(created.error.message ?? 'Could not start password recovery.');
        return;
      }
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        setErrorMessage(error.message ?? 'Could not send a reset code. Check the email and try again.');
        return;
      }
      setRecoveryStep('code');
      setResetMessage('Check your email for a password reset code.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send a reset code. Try again.');
    }
  };

  const verifyResetCode = async () => {
    setErrorMessage('');
    setResetMessage('');
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode.trim() });
      if (error) {
        setErrorMessage(error.message ?? 'That code could not be verified. Check it and try again.');
        return;
      }
      if (signIn.status === 'needs_new_password') {
        setRecoveryStep('new-password');
      } else {
        setErrorMessage('The code was not accepted. Request a new code and try again.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'That code could not be verified. Try again.');
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setErrorMessage('Choose a password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }
    setErrorMessage('');
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (error) {
        setErrorMessage(error.message ?? 'Could not update the password. Try again.');
        return;
      }
      if (signIn.status === 'complete') {
        await finishSignIn();
      } else {
        setErrorMessage('Password updated, but sign-in could not be completed. Return to sign in and use your new password.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update the password. Try again.');
    }
  };

  const exitPasswordRecovery = () => {
    signIn.reset();
    setRecoveryStep('idle');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetMessage('');
    setErrorMessage('');
  };

  const resendResetCode = async () => {
    setErrorMessage('');
    setResetMessage('');
    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        setErrorMessage(error.message ?? 'Could not send a new code. Try again.');
        return;
      }
      setResetMessage('A new reset code was sent. Check your email.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send a new code. Try again.');
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
      {recoveryStep === 'idle' ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Pressable disabled={busy} onPress={() => void beginPasswordRecovery()} style={styles.forgotPassword}>
            <Text style={[styles.link, { color: colors.accent }]}>Forgot password?</Text>
          </Pressable>
        </>
      ) : recoveryStep === 'code' ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Password reset code</Text>
          <Text style={[styles.resetHint, { color: colors.mutedForeground }]}>Enter the code sent to the email address on your account.</Text>
          <TextInput keyboardType="number-pad" autoCapitalize="none" value={resetCode} onChangeText={setResetCode} placeholder="Enter reset code" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Pressable disabled={!resetCode.trim() || busy} onPress={() => void verifyResetCode()} style={[styles.primaryButton, { backgroundColor: colors.accent }, busy && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{busy ? 'Checking code…' : 'Verify code'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => void resendResetCode()} style={styles.recoveryAction}>
            <Text style={[styles.link, { color: colors.accent }]}>Send a new code</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>New password</Text>
          <TextInput secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>Confirm new password</Text>
          <TextInput secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter the new password again" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Pressable disabled={!newPassword || !confirmPassword || busy} onPress={() => void submitNewPassword()} style={[styles.primaryButton, { backgroundColor: colors.accent }, busy && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{busy ? 'Updating…' : 'Update password'}</Text>
          </Pressable>
        </>
      )}
      {(errorMessage || errors?.fields?.identifier?.message) ? <Text style={styles.error}>{errorMessage || errors?.fields?.identifier?.message}</Text> : null}
      {resetMessage ? <Text style={[styles.resetMessage, { color: colors.mutedForeground }]}>{resetMessage}</Text> : null}
      {recoveryStep === 'idle' ? (
        <>
          <Pressable disabled={!emailAddress || !password || busy} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.accent }, busy && styles.disabled]}><Text style={styles.primaryButtonText}>{busy ? 'Signing in…' : 'Sign in'}</Text></Pressable>
          <View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /><Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text><View style={[styles.dividerLine, { backgroundColor: colors.border }]} /></View>
          <Pressable disabled={busy} onPress={googleSignIn} style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="logo-google" size={18} color={colors.foreground} /><Text style={[styles.googleText, { color: colors.foreground }]}>Continue with Google</Text></Pressable>
          <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>New to Royalhouse? </Text><Pressable onPress={() => router.push('./sign-up')}><Text style={[styles.link, { color: colors.accent }]}>Create an account</Text></Pressable></View>
        </>
      ) : (
        <Pressable disabled={busy} onPress={exitPasswordRecovery} style={styles.recoveryAction}>
          <Text style={[styles.link, { color: colors.accent }]}>Back to sign in</Text>
        </Pressable>
      )}
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
  forgotPassword: { alignSelf: 'flex-end', paddingVertical: 10 },
  resetHint: { fontSize: 12, lineHeight: 17, marginTop: -2, marginBottom: 8 },
  resetMessage: { fontSize: 12, lineHeight: 17, marginTop: 12 },
  recoveryAction: { alignSelf: 'center', paddingVertical: 13 },
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