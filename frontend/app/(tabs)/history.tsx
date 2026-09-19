import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { Trash } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { langFlag, langLabel } from "@/src/languages";
import { usesNativeTabs } from "@/src/navigation";
import { TranslateResult } from "@/src/api";
import { useStore } from "@/src/store";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const EMPTY_IMG =
  "https://images.pexels.com/photos/8165596/pexels-photo-8165596.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function HistoryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, history, clearHistory, setActiveResult } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const open = (item: TranslateResult) => {
    setActiveResult(item);
    router.push("/result");
  };

  const renderItem = ({ item }: { item: TranslateResult }) => {
    const snippet = item.regions[0]?.translated ?? "";
    return (
      <Pressable style={styles.row} onPress={() => open(item)} testID={`history-row-${item.id}`}>
        <Image source={{ uri: item.imageUri }} style={styles.thumb} contentFit="cover" />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {snippet}
          </Text>
          <Text style={styles.rowSub}>
            {langFlag(item.sourceLang)} {item.sourceLang === "auto" ? item.detectedSource : langLabel(item.sourceLang)}
            {"  →  "}
            {langFlag(item.targetLang)} {langLabel(item.targetLang)}
          </Text>
          <Text style={styles.rowMeta}>
            {dayjs(item.createdAt).format("DD MMM, HH:mm")} · {item.regions.length} {t("regions")}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title} testID="history-title">
          {t("historyTitle")}
        </Text>
        {history.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={clearHistory} testID="clear-history-button">
            <Trash size={18} color={colors.error} weight="bold" />
            <Text style={styles.clearText}>{t("clearHistory")}</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty} testID="history-empty">
          <Image source={{ uri: EMPTY_IMG }} style={styles.emptyImg} contentFit="cover" />
          <Text style={styles.emptyTitle}>{t("noHistory")}</Text>
          <Text style={styles.emptySub}>{t("noHistorySub")}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl,
            gap: spacing.md,
          }}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.onSurface },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  clearText: { color: colors.error, fontSize: fontSize.base, fontWeight: "600" },

  row: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  rowText: { flex: 1 },
  rowTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurfaceSecondary },
  rowSub: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
  rowMeta: { fontSize: fontSize.sm, color: colors.muted, marginTop: 2 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  emptyImg: { width: 160, height: 160, borderRadius: radius.lg, opacity: 0.9 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface, marginTop: spacing.md },
  emptySub: { fontSize: fontSize.base, color: colors.muted, textAlign: "center" },
}));
