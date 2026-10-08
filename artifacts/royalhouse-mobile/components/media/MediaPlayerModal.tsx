import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Alert } from '@/utils/alert';
import type { MediaItem } from '@/data/sermons';
import { MediaEmbed } from './MediaEmbed';

type PlaybackState = 'loading' | 'ready' | 'failed';

export function MediaPlayerModal({
  media,
  onClose,
}: {
  media: MediaItem | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<PlaybackState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [openError, setOpenError] = useState<string | null>(null);
  const [failureDetail, setFailureDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!media) return;
    setStatus('loading');
    setRetryCount(0);
    setOpenError(null);
    setFailureDetail(null);
  }, [media?.id]);

  useEffect(() => {
    if (!media || status !== 'loading') return;
    const timeout = setTimeout(() => setStatus('failed'), 20000);
    return () => clearTimeout(timeout);
  }, [media?.id, retryCount, status]);

  const openOfficialSource = async () => {
    if (!media) return;
    try {
      await Linking.openURL(media.sourceUrl);
    } catch {
      const message = 'The official media link could not be opened on this device.';
      setOpenError(message);
      Alert.alert('Could not open media', message);
    }
  };

  const retry = () => {
    setOpenError(null);
    setFailureDetail(null);
    setStatus('loading');
    setRetryCount((value) => value + 1);
  };

  const handlePlayerError = (message: string) => {
    setFailureDetail(message);
    setStatus('failed');
  };

  return (
    <Modal
      visible={media !== null}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      onRequestClose={onClose}
    >
      {media ? (
        <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>{media.provider} · {media.format.toUpperCase()}</Text>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{media.title}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{media.speaker} · {media.duration}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close player" onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={25} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={[styles.player, { backgroundColor: colors.card }]}>
            <MediaEmbed
              key={`${media.id}-${retryCount}`}
              embedUrl={media.embedUrl}
              title={media.title}
              onLoadStart={() => setStatus('loading')}
              onLoad={() => setStatus('ready')}
              onError={handlePlayerError}
            />
            {status === 'loading' ? (
              <View pointerEvents="none" style={[styles.statusOverlay, { backgroundColor: colors.card }]}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={[styles.statusText, { color: colors.foreground }]}>Loading the official player…</Text>
              </View>
            ) : null}
            {status === 'failed' ? (
              <View style={[styles.statusOverlay, styles.failedOverlay, { backgroundColor: colors.card }]}>
                <Ionicons name="cloud-offline-outline" size={28} color={colors.accent} />
                <Text style={[styles.failureTitle, { color: colors.foreground }]}>Player unavailable</Text>
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  {failureDetail || 'The embedded player did not load.'} You can retry or open this item on {media.provider}.
                </Text>
                {openError ? <Text style={[styles.openError, { color: colors.mutedForeground }]}>{openError}</Text> : null}
                <View style={styles.failureActions}>
                  <Pressable onPress={retry} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                    <Text style={[styles.buttonText, { color: colors.foreground }]}>Try again</Text>
                  </Pressable>
                  <Pressable onPress={() => void openOfficialSource()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Open {media.provider}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {status === 'ready' ? 'Tap play in the official player to start.' : 'Playback is served by the official media provider.'}
          </Text>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 100, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 18, lineHeight: 23, fontWeight: '700', marginTop: 5 },
  subtitle: { fontSize: 12, marginTop: 4 },
  closeButton: { padding: 4 },
  player: { width: '100%', aspectRatio: 16 / 9, maxHeight: 430, position: 'relative', justifyContent: 'center', overflow: 'hidden' },
  statusOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  failedOverlay: { paddingHorizontal: 30 },
  failureTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  statusText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  openError: { fontSize: 12, textAlign: 'center', marginTop: 2 },
  failureActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 },
  secondaryButton: { minHeight: 42, paddingHorizontal: 15, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 42, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center', paddingHorizontal: 20, paddingTop: 14 },
});
