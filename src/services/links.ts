import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { LINKS, type LinkKey } from '@/config/links';
import { colors } from '@/theme';

import { track } from './analytics';

/** Maps and store links belong in their native apps; everything else opens in an in-app browser. */
const EXTERNAL_APP_LINKS: ReadonlySet<LinkKey> = new Set(['pucCentresNearby', 'mParivahan']);

export async function openUrl(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url, {
    toolbarColor: colors.surface,
    controlsColor: colors.primary,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

export async function openLink(key: LinkKey): Promise<void> {
  track('link_opened', { link: key });
  if (EXTERNAL_APP_LINKS.has(key)) {
    await Linking.openURL(LINKS[key]);
    return;
  }
  await openUrl(LINKS[key]);
}
