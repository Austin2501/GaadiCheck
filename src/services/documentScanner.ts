import { requireOptionalNativeModule } from 'expo';
import * as ImagePicker from 'expo-image-picker';

import { parsePucText, parseRcText, type PucFields, type RcFields } from '@/domain/documentParser';

interface TextExtractor {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
}

let cachedExtractor: TextExtractor | null | undefined;

/**
 * On-device OCR is a native module, so it is missing in Expo Go and on the web. The package
 * throws while loading when that happens, and Metro reports a failed lazy require as an error
 * even when it is caught, so the native side is probed before the package is touched.
 */
function extractor(): TextExtractor | null {
  if (cachedExtractor !== undefined) return cachedExtractor;
  if (!requireOptionalNativeModule('ExpoTextExtractor')) {
    cachedExtractor = null;
    return cachedExtractor;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-text-extractor') as TextExtractor;
    cachedExtractor = module.isSupported ? module : null;
  } catch {
    cachedExtractor = null;
  }
  return cachedExtractor;
}

export function isDocumentScanningAvailable(): boolean {
  return extractor() !== null;
}

export type ImageSource = 'library' | 'camera';

export type ScanOutcome<T> =
  | { status: 'cancelled' }
  | { status: 'permission-denied' }
  | { status: 'unavailable' }
  | { status: 'read'; fields: T };

async function pickImage(source: ImageSource): Promise<ScanOutcome<string>> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'permission-denied' };

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  const uri = result.canceled ? null : result.assets[0]?.uri;
  return uri ? { status: 'read', fields: uri } : { status: 'cancelled' };
}

async function scan<T>(
  source: ImageSource,
  parse: (lines: string[]) => T,
): Promise<ScanOutcome<T>> {
  const ocr = extractor();
  if (!ocr) return { status: 'unavailable' };

  const picked = await pickImage(source);
  if (picked.status !== 'read') return picked;

  const lines = await ocr.extractTextFromImage(picked.fields);
  return { status: 'read', fields: parse(lines) };
}

export function scanRegistrationCertificate(source: ImageSource): Promise<ScanOutcome<RcFields>> {
  return scan(source, parseRcText);
}

export function scanPucCertificate(source: ImageSource): Promise<ScanOutcome<PucFields>> {
  return scan(source, parsePucText);
}
