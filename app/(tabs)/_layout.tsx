import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { colors, fontForLanguage, fonts } from '@/theme';

/**
 * The navigator's default bar is sized for 10pt labels. Ours are 12pt on a 16pt line, so the
 * bar needs room for a 28pt icon slot, the label and the item's own padding.
 */
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_PADDING = 4;

function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    const tint = typeof color === 'string' ? color : colors.inkSubtle;
    return <Icon name={focused ? filled : outline} size={24} color={tint} />;
  };
}

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const labelFont = fontForLanguage(fonts.bodyMedium, i18n.language === 'hi' ? 'hi' : 'en');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSubtle,
        tabBarLabelStyle: { fontFamily: labelFont, fontSize: 12, lineHeight: 16 },
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: TAB_BAR_PADDING,
          paddingBottom: TAB_BAR_PADDING + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: tabIcon('shield-checkmark-outline', 'shield-checkmark'),
        }}
      />
      <Tabs.Screen
        name="air"
        options={{ title: t('tabs.air'), tabBarIcon: tabIcon('leaf-outline', 'leaf') }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: t('tabs.garage'), tabBarIcon: tabIcon('car-sport-outline', 'car-sport') }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t('tabs.more'), tabBarIcon: tabIcon('grid-outline', 'grid') }}
      />
    </Tabs>
  );
}
