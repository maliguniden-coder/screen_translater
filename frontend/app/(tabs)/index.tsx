import React, { useRef, useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowsLeftRight, Camera, CaretDown, ImageSquare, Lightning } from "phosphor-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageSheet, LanguageSheetRef, SheetMode } from "@/src/components/LanguageSheet";
import { langFlag, langLabel, LangCode, SourceCode } from "@/src/languages";
import { pickFromCamera, pickFromGallery, pickLatest, PickOutcome } from "@/src/imagePicker";
import { translateImage } from "@/src/api";
import { usesNativeTabs } from "@/src/navigation";
import { useStore } from "@/src/store";
import { useToast } from "@/src/toast";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const HERO =
  "https://images.pexels.com/photos/36772029/pexels-photo-36772029.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function TranslateScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, tl, settings, addHistory, setActiveResult } = useStore();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<LanguageSheetRef>(null);

  const [source, setSource] = useState<SourceCode>(settings.defaultSource);
  const [target, setTarget] = useState<LangCode>(settings.defaultTarget);
  const [loading, setLoading] = useState(false);
  const [permModal, setPermModal] = useState<null | "camera" | "gallery">(null);

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const openSheet = (mode: SheetMode) => {
    Haptics.selectionAsync();
    sheetRef.current?.present(mode);
  };

  const swap = () => {
    if (source === "auto") {
      toast.show(t("auto"), "info");
      return;
    }
    Haptics.selectionAsync();
    const prevSource = source;
    setSource(target);
    setTarget(prevSource as LangCode);
  };

  const handleOutcome = async (outcome: PickOutcome, which: "camera" | "gallery") => {
    if (outcome.status === "denied") {
      setPermModal(which);
      return;
    }
    if (outcome.status !== "ok") return;

    setLoading(true);
    try {
      const result = await translateImage({
        uri: outcome.asset.uri,
        width: outcome.asset.width,
        height: outcome.asset.height,
        sourceLang: source,
        targetLang: target,
      });
      if (result.regions.length === 0) {
        toast.show(t("noText"), "info");
        return;
      }
      addHistory(result);
      setActiveResult(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/result");
    } catch {
      toast.show(t("failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const onGallery = async () => handleOutcome(await pickFromGallery(), "gallery");
  const onCamera = async () => handleOutcome(await pickFromCamera(), "camera");
  const onQuick = async () => {
    try {
      handleOutcome(await pickLatest(), "gallery");
    } catch {
      toast.show(t("failed"), "error");
    }
  };

  const LangChip = ({ label, value, mode }: { label: string; value: SourceCode; mode: SheetMode }) => (
    <Pressable style={styles.chip} onPress={() => openSheet(mode)} testID={`lang-chip-${mode}`}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipValueRow}>
        <Text style={styles.chipFlag}>{langFlag(value)}</Text>
        <Text style={styles.chipValue} numberOfLines={1}>
          {value === "auto" ? t("auto") : langLabel(value)}
        </Text>
        <CaretDown size={14} color={colors.muted} weight="bold" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.appName} testID="home-title">
          {t("appName")}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.langRow}>
          <LangChip label={t("from")} value={source} mode="source" />
          <Pressable style={styles.swapBtn} onPress={swap} testID="swap-langs">
            <ArrowsLeftRight size={18} color={colors.onBrandPrimary} weight="bold" />
          </Pressable>
          <LangChip label={t("to")} value={target} mode="target" />
        </View>

        <View style={styles.dropzone}>
          <Image source={{ uri: HERO }} style={styles.hero} contentFit="cover" transition={250} />
          <View style={styles.dropText}>
            <Text style={styles.dropTitle}>{t("dropTitle")}</Text>
            <Text style={styles.dropSub}>{t("dropSubtitle")}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomChrome + spacing.lg }]}>
        <Pressable style={styles.quickBtn} onPress={onQuick} testID="quick-latest-button">
          <Lightning size={20} color={colors.onBrandTertiary} weight="fill" />
          <View style={styles.quickTextWrap}>
            <Text style={styles.quickTitle}>{tl("quickLatest")}</Text>
            <Text style={styles.quickHint} numberOfLines={1}>
              {tl("quickHint")}
            </Text>
          </View>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onGallery} testID="pick-gallery-button">
          <ImageSquare size={22} color={colors.onBrandPrimary} weight="fill" />
          <Text style={styles.primaryText}>{t("gallery")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onCamera} testID="pick-camera-button">
          <Camera size={22} color={colors.onBrandSecondary} weight="fill" />
          <Text style={styles.secondaryText}>{t("camera")}</Text>
        </Pressable>
      </View>

      <LanguageSheet
        ref={sheetRef}
        sourceValue={source}
        targetValue={target}
        onSelectSource={setSource}
        onSelectTarget={setTarget}
      />

      {loading && (
        <Animated.View entering={FadeIn} style={styles.loadingOverlay} testID="translate-loading">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={styles.loadingText}>{t("detecting")}</Text>
          </View>
        </Animated.View>
      )}

      <Modal transparent visible={permModal !== null} animationType="fade" onRequestClose={() => setPermModal(null)}>
        <View style={styles.permBackdrop}>
          <View style={styles.permCard} testID="permission-modal">
            <Text style={styles.permTitle}>{t("permTitle")}</Text>
            <Text style={styles.permBody}>
              {permModal === "camera" ? t("permCamera") : t("permGallery")}
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                setPermModal(null);
                Linking.openSettings();
              }}
              testID="open-settings-button"
            >
              <Text style={styles.primaryText}>{t("openSettings")}</Text>
            </Pressable>
            <Pressable style={styles.permCancel} onPress={() => setPermModal(null)}>
              <Text style={styles.permCancelText}>{t("cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  appName: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.onSurface },
  body: { flex: 1, paddingHorizontal: spacing.lg },

  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  chipLabel: { fontSize: fontSize.sm, color: colors.muted, fontWeight: "600", marginBottom: 2 },
  chipValueRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  chipFlag: { fontSize: 18 },
  chipValue: { flex: 1, fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurfaceSecondary },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },

  dropzone: {
    flex: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surfaceSecondary,
  },
  hero: { width: "100%", flex: 1 },
  dropText: { padding: spacing.xl, backgroundColor: colors.surfaceSecondary },
  dropTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurfaceSecondary },
  dropSub: { fontSize: fontSize.base, color: colors.muted, marginTop: spacing.xs, lineHeight: 20 },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  primaryText: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandSecondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  secondaryText: { color: colors.onBrandSecondary, fontSize: fontSize.lg, fontWeight: "700" },

  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  quickTextWrap: { flex: 1 },
  quickTitle: { color: colors.onBrandTertiary, fontSize: fontSize.base, fontWeight: "700" },
  quickHint: { color: colors.onBrandTertiary, fontSize: fontSize.sm, opacity: 0.8, marginTop: 1 },

  loadingOverlay: {
    ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const),
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: { color: colors.onSurfaceSecondary, fontSize: fontSize.lg, fontWeight: "600" },

  permBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  permCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  permTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurfaceSecondary },
  permBody: { fontSize: fontSize.base, color: colors.muted, lineHeight: 20 },
  permCancel: { alignItems: "center", paddingVertical: spacing.sm },
  permCancelText: { color: colors.muted, fontSize: fontSize.base, fontWeight: "600" },
}));
