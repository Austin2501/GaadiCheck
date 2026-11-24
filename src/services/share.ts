import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type ShareResult = 'shared' | 'unavailable';

/**
 * Renders a view to PNG and opens the system share sheet. Most social apps ignore captions passed
 * through the share sheet, so the caption is placed on the clipboard as well.
 */
export async function shareViewAsImage(
  view: RefObject<ComponentRef<typeof View> | null>,
  caption: string,
  dialogTitle: string,
): Promise<ShareResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  const uri = await captureRef(view, { format: 'png', quality: 1, result: 'tmpfile' });
  await Clipboard.setStringAsync(caption);
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle, UTI: 'public.png' });
  return 'shared';
}
