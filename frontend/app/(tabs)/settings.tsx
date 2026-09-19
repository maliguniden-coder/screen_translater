import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  Check,
  DeviceMobile,
  Globe,
  Info,
  Moon,
  Sun,
  TextAa,
  Translate,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LANGUAGES, langFlag, LangCode, SourceCode } from "@/src/languages";
import { UILang } from "@/src/i18n";
import { usesNativeTabs } from "@/src/navigation";
import { useStore } from "@/src/store";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type ThemeMode = "system" | "light" | "dark";
interface Option {
  code: string;
  label: string;
  flag?: string;
}

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const {
    t,
    settings,
    setThemeMode,
    setUiLang,
    setDefaultSource,
    setDefaultTarget,
  } = useStore();
  const insets = useSafeAreaInsets();

  const [picker, setPicker] = useState<null | "ui" | "source" | "target">(null);

  const themeOptions: { mode: ThemeMode; label: string; Icon: any }[] = [
    { mode: "system", label: t("themeSystem"), Icon: DeviceMobile },
    { mode: "light", label: t("themeLight"), Icon: Sun },
    { mode: "dark", label: t("themeDark"), Icon: Moon },
  ];

  const langOptions: Option[] = LANGUAGES.map((l) => ({ code: l.code, label: l.native, flag: l.flag }));
  const sourceOptions: Option[] = [{ code: "auto", label: t("auto"), flag: "🌐" }, ...langOptions];

  const pickerData = (): { options: Option[]; current: string; onSelect: (c: string) => void } => {
    if (picker === "ui")
      return { options: langOptions, current: settings.uiLang, onSelect: (c) => setUiLang(c as UILang) };
    if (picker === "source")
      return {
        options: sourceOptions,
        current: settings.defaultSource,
        onSelect: (c) => setDefaultSource(c as SourceCode),
      };
    return {
      options: langOptions,
      current: settings.defaultTarget,
      onSelect: (c) => setDefaultTarget(c as LangCode),
    };
  };

  const valueLabel = (code: SourceCode) =>
    code === "auto" ? t("auto") : LANGUAGES.find((l) => l.code === code)?.native ?? code;

  const Row = ({
    Icon,
    label,
    value,
    onPress,
    testID,
  }: {
    Icon: any;
    label: string;
    value: string;
    onPress: () => void;
    testID: string;
  }) => (
    <Pressable style={styles.row} onPress={onPress} testID={testID}>
      <View style={styles.iconBox}>
        <Icon size={20} color={colors.onBrandTertiary} weight="fill" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );

  const data = pickerData();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title} testID="settings-title">
          {t("settingsTitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl,
          gap: spacing.xl,
        }}
      >
        <View>
          <Text style={styles.groupLabel}>{t("appearance")}</Text>
          <View style={styles.card}>
            <View style={styles.segment}>
              {themeOptions.map(({ mode, label, Icon }) => {
                const active = settings.themeMode === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                    onPress={() => setThemeMode(mode)}
                    testID={`theme-${mode}`}
                  >
                    <Icon
                      size={18}
                      color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary}
                      weight="fill"
                    />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.groupLabel}>{t("defaults")}</Text>
          <View style={styles.card}>
            <Row
              Icon={TextAa}
              label={t("interfaceLanguage")}
              value={valueLabel(settings.uiLang)}
              onPress={() => setPicker("ui")}
              testID="setting-ui-language"
            />
            <View style={styles.divider} />
            <Row
              Icon={Globe}
              label={t("defaultSource")}
              value={valueLabel(settings.defaultSource)}
              onPress={() => setPicker("source")}
              testID="setting-default-source"
            />
            <View style={styles.divider} />
            <Row
              Icon={Translate}
              label={t("defaultTarget")}
              value={valueLabel(settings.defaultTarget)}
              onPress={() => setPicker("target")}
              testID="setting-default-target"
            />
          </View>
        </View>

        <View>
          <Text style={styles.groupLabel}>{t("about")}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Info size={20} color={colors.onBrandTertiary} weight="fill" />
              </View>
              <Text style={styles.aboutText}>{t("aboutText")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={picker !== null} animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(null)}>
          <Pressable style={styles.pickerCard} testID="settings-picker">
            {data.options.map((opt) => {
              const selected = data.current === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  style={styles.pickerRow}
                  onPress={() => {
                    data.onSelect(opt.code);
                    setPicker(null);
                  }}
                  testID={`picker-option-${opt.code}`}
                >
                  <Text style={styles.pickerFlag}>{opt.flag ?? langFlag(opt.code as SourceCode)}</Text>
                  <Text style={styles.pickerLabel}>{opt.label}</Text>
                  {selected && <Check size={20} color={colors.brandPrimary} weight="bold" />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
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
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.onSurface },

  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: fontSize.lg, fontWeight: "600", color: colors.onSurfaceSecondary },
  rowValue: { fontSize: fontSize.base, color: colors.muted, maxWidth: 130 },
  aboutText: { flex: 1, fontSize: fontSize.base, color: colors.onSurfaceTertiary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 64 },

  segment: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  segmentBtnActive: { backgroundColor: colors.brandPrimary },
  segmentText: { fontSize: fontSize.base, fontWeight: "600", color: colors.onSurfaceTertiary },
  segmentTextActive: { color: colors.onBrandPrimary },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  pickerCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  pickerFlag: { fontSize: 22, width: 30, textAlign: "center" },
  pickerLabel: { flex: 1, fontSize: fontSize.lg, fontWeight: "600", color: colors.onSurfaceSecondary },
}));
