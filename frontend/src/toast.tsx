import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, radius, spacing, useTheme } from "@/src/theme";

type ToastType = "info" | "success" | "error";
interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback((message: string, type: ToastType = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const bg =
    toast?.type === "error"
      ? colors.error
      : toast?.type === "success"
        ? colors.success
        : colors.surfaceInverse;
  const fg =
    toast?.type === "error"
      ? colors.onError
      : toast?.type === "success"
        ? colors.onSuccess
        : colors.onSurfaceInverse;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOutDown.duration(200)}
          style={[
            styles.toast,
            { backgroundColor: bg, bottom: insets.bottom + spacing["3xl"], pointerEvents: "none" },
          ]}
          testID="app-toast"
        >
          <Text style={[styles.text, { color: fg }]} testID="app-toast-text">
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  text: { fontSize: fontSize.base, fontWeight: "600", textAlign: "center" },
});
