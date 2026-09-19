import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Broadcast, Eye, Play, Stop, WarningCircle } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  addFrameListener,
  hideFloatingBubble,
  isLiveSupported,
  requestCapturePermission,
  requestOverlayPermission,
  showFloatingBubble,
  startCapture,
  stopCapture,
} from "@/src/liveCapture";
import { translateImage } from "@/src/api";
import { usesNativeTabs } from "@/src/navigation";
import { useStore } from "@/src/store";
import { useToast } from "@/src/toast";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function LiveScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, tl, settings, addHistory, setActiveResult, activeResult } = useStore();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [supported] = useState(() => isLiveSupported());
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const translatingRef = useRef(false);
  const subRef = useRef<{ remove: () => void } | null>(null);

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  useEffect(() => {
    return () => {
      subRef.current?.remove();
      if (running) {
        stopCapture();
        hideFloatingBubble();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFrame = async (e: { filePath: string; width?: number; height?: number }) => {
    if (translatingRef.current) return; // one at a time to save credits
    translatingRef.current = true;
    try {
      const uri = e.filePath.startsWith("file") ? e.filePath : `file://${e.filePath}`;
      const result = await translateImage({
        uri,
        width: e.width ?? 1080,
        height: e.height ?? 1920,
        sourceLang: settings.defaultSource,
        targetLang: settings.defaultTarget,
      });
      if (result.regions.length > 0) {
        addHistory(result);
        setActiveResult(result);
      }
    } catch {
      // ignore individual frame errors during live capture
    } finally {
      translatingRef.current = false;
    }
  };

  const start = async () => {
    setBusy(true);
    try {
      const overlay = await requestOverlayPermission();
      if (!overlay) {
        toast.show(tl("grantOverlay"), "error");
        return;
      }
      const capture = await requestCapturePermission();
      if (!capture) {
        toast.show(tl("grantCapture"), "error");
        return;
      }
      subRef.current = addFrameListener(onFrame);
      await startCapture(4000);
      await showFloatingBubble();
      setRunning(true);
      toast.show(tl("liveRunning"), "success");
    } catch {
      toast.show(t("failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      subRef.current?.remove();
      subRef.current = null;
      await stopCapture();
      hideFloatingBubble();
      setRunning(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title} testID="live-title">
          {tl("liveTitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl,
          gap: spacing.lg,
        }}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Broadcast size={28} color={colors.onBrandPrimary} weight="fill" />
          </View>
          <Text style={styles.heroText}>{tl("liveSubtitle")}</Text>
        </View>

        <View style={styles.noteCard}>
          <WarningCircle size={20} color={colors.warning} weight="fill" />
          <Text style={styles.noteText}>{tl("liveAndroidOnly")}</Text>
        </View>

        {!supported ? (
          <View style={styles.unavailableCard} testID="live-unavailable">
            <Text style={styles.unavailableText}>{tl("liveUnavailable")}</Text>
            <Text style={styles.buildReminder}>{tl("buildReminder")}</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {!running ? (
              <Pressable
                style={styles.startBtn}
                onPress={start}
                disabled={busy}
                testID="live-start-button"
              >
                {busy ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <>
                    <Play size={22} color={colors.onBrandPrimary} weight="fill" />
                    <Text style={styles.startText}>{tl("liveStart")}</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <>
                <View style={styles.runningPill} testID="live-running">
                  <View style={styles.dot} />
                  <Text style={styles.runningText}>{tl("liveRunning")}</Text>
                </View>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => activeResult && router.push("/result")}
                  testID="live-view-result"
                >
                  <Eye size={20} color={colors.onBrandSecondary} weight="fill" />
                  <Text style={styles.viewText}>{t("translated")}</Text>
                </Pressable>
                <Pressable style={styles.stopBtn} onPress={stop} disabled={busy} testID="live-stop-button">
                  <Stop size={22} color={colors.onError} weight="fill" />
                  <Text style={styles.stopText}>{tl("liveStop")}</Text>
                </Pressable>
              </>
            )}
            <Text style={[styles.buildReminder, { paddingHorizontal: spacing.xs, marginTop: bottomChrome > 0 ? 0 : 0 }]}>
              {tl("buildReminder")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.onSurface },

  heroCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    alignItems: "center",
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary, textAlign: "center", lineHeight: 20 },

  noteCard: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurfaceTertiary, lineHeight: 18 },

  unavailableCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  unavailableText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurfaceSecondary },
  buildReminder: { fontSize: fontSize.sm, color: colors.muted, lineHeight: 18 },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  startText: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontWeight: "700" },

  runningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.success },
  runningText: { flex: 1, fontSize: fontSize.base, color: colors.onBrandTertiary, fontWeight: "600" },

  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandSecondary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  viewText: { color: colors.onBrandSecondary, fontSize: fontSize.base, fontWeight: "700" },

  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  stopText: { color: colors.onError, fontSize: fontSize.lg, fontWeight: "700" },
}));
