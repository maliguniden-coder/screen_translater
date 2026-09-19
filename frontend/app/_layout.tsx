import { QueryClientProvider } from "@tanstack/react-query";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { StoreProvider } from "@/src/store";
import { ToastProvider } from "@/src/toast";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <StoreProvider>
                <BottomSheetModalProvider>
                  <ToastProvider>
                    <StatusBar style="auto" />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen
                        name="result"
                        options={{ presentation: "fullScreenModal", animation: "fade" }}
                      />
                    </Stack>
                  </ToastProvider>
                </BottomSheetModalProvider>
              </StoreProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
