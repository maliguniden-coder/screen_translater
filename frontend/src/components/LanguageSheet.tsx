import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Check, GlobeHemisphereWest } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { LANGUAGES, LangCode, SourceCode } from "@/src/languages";
import { useStore } from "@/src/store";

export type SheetMode = "source" | "target";

export interface LanguageSheetRef {
  present: (mode: SheetMode) => void;
}

interface Props {
  sourceValue: SourceCode;
  targetValue: LangCode;
  onSelectSource: (code: SourceCode) => void;
  onSelectTarget: (code: LangCode) => void;
}

export const LanguageSheet = forwardRef<LanguageSheetRef, Props>(function LanguageSheet(
  { sourceValue, targetValue, onSelectSource, onSelectTarget },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useStore();
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<SheetMode>("source");

  useImperativeHandle(ref, () => ({
    present: (m: SheetMode) => {
      setMode(m);
      modalRef.current?.present();
    },
  }));

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const activeValue: SourceCode = mode === "source" ? sourceValue : targetValue;

  const choose = (code: SourceCode) => {
    if (mode === "source") onSelectSource(code);
    else onSelectTarget(code as LangCode);
    modalRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
      backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.title} testID="language-sheet-title">
          {mode === "source" ? t("from") : t("to")}
        </Text>

        {mode === "source" && (
          <Pressable
            testID="lang-option-auto"
            onPress={() => choose("auto")}
            style={[styles.row, styles.autoRow]}
          >
            <GlobeHemisphereWest size={22} color={colors.onBrandSecondary} weight="fill" />
            <Text style={[styles.rowLabel, styles.autoLabel]}>{t("auto")}</Text>
            {activeValue === "auto" && (
              <Check size={20} color={colors.brandPrimary} weight="bold" />
            )}
          </Pressable>
        )}

        {LANGUAGES.map((lang) => {
          const selected = activeValue === lang.code;
          return (
            <Pressable
              key={lang.code}
              testID={`lang-option-${lang.code}`}
              onPress={() => choose(lang.code)}
              style={styles.row}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{lang.native}</Text>
                <Text style={styles.rowSub}>{lang.english}</Text>
              </View>
              {selected && <Check size={20} color={colors.brandPrimary} weight="bold" />}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const useStyles = makeStyles((colors) => ({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  autoRow: {
    backgroundColor: colors.brandSecondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  autoLabel: { color: colors.onBrandSecondary, fontWeight: "700", flex: 1 },
  flag: { fontSize: 24, width: 32, textAlign: "center" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: fontSize.lg, fontWeight: "600", color: colors.onSurfaceSecondary },
  rowSub: { fontSize: fontSize.sm, color: colors.muted, marginTop: 1 },
}));
