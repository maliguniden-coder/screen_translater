import React, { useState } from "react";
import { Pressable, ScrollView, Share, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { CaretLeft, ShareNetwork, X } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { langLabel } from "@/src/languages";
import { Region } from "@/src/api";
import { useStore } from "@/src/store";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ResultScreen() {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const { activeResult, t } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [selected, setSelected] = useState<Region | null>(null);

  if (!activeResult) {
    router.back();
    return null;
  }

  const ratio = activeResult.imageHeight / activeResult.imageWidth || 1;
  const imgW = screenW;
  const imgH = imgW * ratio;

  const onShare = () => {
    const body = activeResult.regions
      .map((r) => (r.original ? `${r.original}\n→ ${r.translated}` : r.translated))
      .join("\n\n");
    Share.share({ message: body });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: imgW, height: imgH }}>
          <Image source={{ uri: activeResult.imageUri }} style={{ width: imgW, height: imgH }} contentFit="cover" />
          {activeResult.regions.map((r, i) => {
            const boxHpx = (r.box.h / 100) * imgH;
            const fs = Math.max(10, Math.min(15, boxHpx * 0.42));
            return (
              <Pressable
                key={i}
                testID={`bubble-${i}`}
                onPress={() => setSelected(r)}
                style={[
                  styles.bubble,
                  {
                    left: (r.box.x / 100) * imgW,
                    top: (r.box.y / 100) * imgH,
                    maxWidth: Math.max((r.box.w / 100) * imgW, 56),
                    minWidth: Math.min(48, imgW * 0.2),
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { fontSize: fs }]}>{r.translated}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hintWrap}>
          <Text style={styles.hint}>{t("tapBubbleHint")}</Text>
        </View>
      </ScrollView>

      <BlurView intensity={40} tint={scheme === "dark" ? "dark" : "light"} style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} testID="result-back">
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeResult.detectedSource} → {langLabel(activeResult.targetLang)}
          </Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onShare} testID="result-share">
          <ShareNetwork size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
      </BlurView>

      {selected && (
        <View style={[styles.detailWrap, { paddingBottom: insets.bottom + spacing.lg }]} testID="bubble-detail">
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailBadge}>{t("original")}</Text>
              <Pressable onPress={() => setSelected(null)} testID="detail-close" hitSlop={10}>
                <X size={20} color={colors.muted} weight="bold" />
              </Pressable>
            </View>
            {!!selected.original && <Text style={styles.detailOriginal}>{selected.original}</Text>}
            <Text style={styles.detailBadge}>{t("translated")}</Text>
            <Text style={styles.detailTranslated}>{selected.translated}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    ...({ position: "absolute", top: 0, left: 0, right: 0 } as const),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: spacing.sm },
  headerTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.onSurface },

  bubble: {
    ...({ position: "absolute" } as const),
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.onSurfaceInverse,
  },
  bubbleText: { color: colors.onSurfaceInverse, fontWeight: "700", lineHeight: 16 },

  hintWrap: { alignItems: "center", padding: spacing.lg },
  hint: { fontSize: fontSize.sm, color: colors.muted },

  detailWrap: {
    ...({ position: "absolute", left: 0, right: 0, bottom: 0 } as const),
    paddingHorizontal: spacing.lg,
  },
  detailCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailBadge: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailOriginal: {
    fontSize: fontSize.lg,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.sm,
  },
  detailTranslated: { fontSize: fontSize.lg, fontWeight: "700", color: colors.brandPrimary },
}));
