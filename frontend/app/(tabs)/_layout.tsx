import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ClockCounterClockwise, GearSix, Translate } from "phosphor-react-native";

import { usesNativeTabs } from "@/src/navigation";
import { useStore } from "@/src/store";
import { fontSize, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useStore();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="character.bubble" />
          <NativeTabs.Trigger.Label>{t("tabTranslate")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" />
          <NativeTabs.Trigger.Label>{t("tabHistory")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon sf="gearshape" />
          <NativeTabs.Trigger.Label>{t("tabSettings")}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: fontSize.sm, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabTranslate"),
          tabBarIcon: ({ color, focused }) => (
            <Translate size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("tabHistory"),
          tabBarIcon: ({ color, focused }) => (
            <ClockCounterClockwise size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabSettings"),
          tabBarIcon: ({ color, focused }) => (
            <GearSix size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}
