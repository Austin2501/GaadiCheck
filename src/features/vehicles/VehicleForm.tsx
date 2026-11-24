import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  AppText,
  Banner,
  Button,
  Card,
  ChoiceGroup,
  DateField,
  Screen,
  SectionHeader,
  TextField,
  type Choice,
} from '@/components/ui';
import { BS_NORM_OPTIONS, formatBsNorm, suggestBsNorm } from '@/domain/bsNorm';
import { addDays, isoDateToDate, toIstDateKey } from '@/domain/dates';
import { countFields } from '@/domain/documentParser';
import {
  formatPlate,
  isNcrRegistration,
  parsePlate,
  STATE_NAMES,
  suggestHomeZone,
} from '@/domain/registration';
import type { BsNorm, FuelType, LanguageCode, Vehicle, VehicleType, ZoneId } from '@/domain/types';
import { ZONES } from '@/domain/zones';
import { localize } from '@/i18n';
import { formatCalendarDate } from '@/i18n/format';
import { track } from '@/services/analytics';
import {
  isDocumentScanningAvailable,
  scanPucCertificate,
  scanRegistrationCertificate,
  type ImageSource,
} from '@/services/documentScanner';
import { openLink } from '@/services/links';
import { locateNearestZone } from '@/services/location';
import { useGarage, type VehicleInput } from '@/store/garage';
import { colors, radius, spacing } from '@/theme';

import {
  createVehicleFormSchema,
  toFormValues,
  toVehicleInput,
  type VehicleFormError,
  type VehicleFormValues,
} from './vehicleForm';

interface VehicleFormProps {
  initial?: Vehicle | null;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => void;
  onRemove?: () => void;
}

type Notice = { tone: 'success' | 'warning' | 'danger' | 'info'; message: string } | null;

const VEHICLE_TYPES: VehicleType[] = ['car', 'two-wheeler', 'goods'];
const FUELS: FuelType[] = ['petrol', 'diesel', 'cng', 'electric', 'hybrid'];
const EARLIEST_REGISTRATION = new Date(1990, 0, 1);

export function VehicleForm({ initial, submitLabel, onSubmit, onRemove }: VehicleFormProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const existingPlates = useGarage(
    useShallow((state) =>
      state.vehicles
        .filter((vehicle) => vehicle.id !== initial?.id)
        .map((vehicle) => vehicle.plate),
    ),
  );
  const schema = useMemo(() => createVehicleFormSchema(existingPlates), [existingPlates]);

  const { control, handleSubmit, setValue, getValues, formState } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(initial),
    mode: 'onTouched',
  });
  const { errors, isSubmitting } = formState;

  const [scanNotice, setScanNotice] = useState<Notice>(null);
  const [areaNotice, setAreaNotice] = useState<Notice>(null);
  const [pucNotice, setPucNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<'rc' | 'puc' | 'location' | null>(null);
  const userPickedZone = useRef(Boolean(initial));
  const userPickedNorm = useRef(Boolean(initial?.bsNorm));

  const [plateText, fuel, vehicleType, registrationDate, registeredInDelhi] = useWatch({
    control,
    name: ['plate', 'fuel', 'vehicleType', 'registrationDate', 'registeredInDelhi'],
  });
  const parsedPlate = useMemo(() => parsePlate(plateText), [plateText]);
  const isElectric = fuel === 'electric';

  const bsSuggestion = useMemo(() => {
    if (!registrationDate || isElectric) return null;
    const inNcr = parsedPlate
      ? isNcrRegistration(parsedPlate) || registeredInDelhi === true
      : false;
    return suggestBsNorm({ registrationDate, vehicleType, registeredInNcr: inNcr });
  }, [registrationDate, isElectric, parsedPlate, registeredInDelhi, vehicleType]);

  const errorText = (message: string | undefined) =>
    message ? t(`vehicle.${message as VehicleFormError}`) : undefined;

  const today = toIstDateKey(new Date());
  const todayDate = isoDateToDate(today);

  // ——— Derived updates ———————————————————————————————————————————————

  const applyPlate = (text: string) => {
    const parsed = parsePlate(text);
    if (!parsed) return;
    if (parsed.kind === 'state') {
      setValue('registeredInDelhi', parsed.stateCode === 'DL');
    }
    const zone = suggestHomeZone(parsed);
    if (zone && !userPickedZone.current) setValue('homeZone', zone, { shouldValidate: true });
  };

  const applyRegistrationDate = (date: string | null) => {
    if (!date || userPickedNorm.current || getValues('fuel') === 'electric') return;
    const parsed = parsePlate(getValues('plate'));
    const suggestion = suggestBsNorm({
      registrationDate: date,
      vehicleType: getValues('vehicleType'),
      registeredInNcr: parsed
        ? isNcrRegistration(parsed) || getValues('registeredInDelhi') === true
        : false,
    });
    setValue('bsNorm', suggestion.confidence === 'likely' ? suggestion.norm : null);
  };

  // ——— Device features ———————————————————————————————————————————————

  const runScan = async (source: ImageSource) => {
    setBusy('rc');
    setScanNotice(null);
    try {
      const outcome = await scanRegistrationCertificate(source);
      if (outcome.status === 'cancelled') return;
      if (outcome.status === 'unavailable') {
        setScanNotice({ tone: 'info', message: t('vehicle.scanUnavailable') });
        return;
      }
      if (outcome.status === 'permission-denied') {
        setScanNotice({ tone: 'warning', message: t('vehicle.scanPermissionDenied') });
        return;
      }
      const fields = outcome.fields;
      if (fields.plate) {
        setValue('plate', formatPlate(fields.plate), { shouldValidate: true, shouldDirty: true });
        applyPlate(fields.plate);
      }
      if (fields.vehicleType) setValue('vehicleType', fields.vehicleType, { shouldDirty: true });
      if (fields.fuel) setValue('fuel', fields.fuel, { shouldDirty: true });
      if (fields.bsNorm) {
        userPickedNorm.current = true;
        setValue('bsNorm', fields.bsNorm, { shouldDirty: true });
      }
      if (fields.registrationDate) {
        setValue('registrationDate', fields.registrationDate, { shouldDirty: true });
        applyRegistrationDate(fields.registrationDate);
      }
      const count = countFields(fields);
      track('document_scanned', { kind: 'rc', fields: count });
      setScanNotice(
        count > 0
          ? { tone: 'success', message: t('vehicle.scanSuccess', { count }) }
          : { tone: 'warning', message: t('vehicle.scanNothing') },
      );
    } catch {
      setScanNotice({ tone: 'danger', message: t('vehicle.scanFailed') });
    } finally {
      setBusy(null);
    }
  };

  const runPucScan = async (source: ImageSource) => {
    setBusy('puc');
    setPucNotice(null);
    try {
      const outcome = await scanPucCertificate(source);
      if (outcome.status === 'cancelled') return;
      if (outcome.status !== 'read') {
        setPucNotice({
          tone: 'warning',
          message:
            outcome.status === 'permission-denied'
              ? t('vehicle.scanPermissionDenied')
              : t('vehicle.scanUnavailable'),
        });
        return;
      }
      const expiry = outcome.fields.validUntil;
      track('document_scanned', { kind: 'puc', fields: expiry ? 1 : 0 });
      if (expiry) {
        setValue('pucExpiry', expiry, { shouldDirty: true });
        setPucNotice({
          tone: 'success',
          message: t('vehicle.pucScanSuccess', { date: formatCalendarDate(expiry, language) }),
        });
      } else {
        setPucNotice({ tone: 'warning', message: t('vehicle.pucScanNothing') });
      }
    } catch {
      setPucNotice({ tone: 'danger', message: t('vehicle.scanFailed') });
    } finally {
      setBusy(null);
    }
  };

  const choosePucSource = () => {
    Alert.alert(t('vehicle.pucScan'), undefined, [
      { text: t('vehicle.scanFromGallery'), onPress: () => void runPucScan('library') },
      { text: t('vehicle.scanFromCamera'), onPress: () => void runPucScan('camera') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const detectLocation = async () => {
    setBusy('location');
    setAreaNotice({ tone: 'info', message: t('vehicle.locating') });
    const result = await locateNearestZone();
    setBusy(null);
    track('location_used', { result: result.status });
    switch (result.status) {
      case 'found': {
        userPickedZone.current = true;
        setValue('homeZone', result.zone, { shouldValidate: true, shouldDirty: true });
        const zone = ZONES.find((candidate) => candidate.id === result.zone);
        setAreaNotice({
          tone: 'success',
          message: t('vehicle.locationFound', {
            zone: zone ? localize(zone.shortName, language) : '',
          }),
        });
        break;
      }
      case 'outside':
        setAreaNotice({ tone: 'warning', message: t('vehicle.locationOutside') });
        break;
      case 'denied':
        setAreaNotice({ tone: 'warning', message: t('vehicle.locationDenied') });
        break;
      case 'unavailable':
        setAreaNotice({ tone: 'warning', message: t('vehicle.locationUnavailable') });
        break;
    }
  };

  const submit = handleSubmit((values) => onSubmit(toVehicleInput(values)));

  // ——— Choices ————————————————————————————————————————————————————

  const typeChoices: Choice<VehicleType>[] = VEHICLE_TYPES.map((value) => ({
    value,
    label: t(`vehicle.types.${value}`),
    icon:
      value === 'car'
        ? 'car-sport-outline'
        : value === 'two-wheeler'
          ? 'bicycle-outline'
          : 'bus-outline',
  }));
  const fuelChoices: Choice<FuelType>[] = FUELS.map((value) => ({
    value,
    label: t(`vehicle.fuels.${value}`),
  }));
  const normChoices: Choice<BsNorm | 0>[] = [
    ...BS_NORM_OPTIONS.map((norm) => ({
      value: norm,
      label: norm === 2 ? t('vehicle.bsOlder') : formatBsNorm(norm),
    })),
    { value: 0 as const, label: t('vehicle.bsUnknown') },
  ];
  const zoneChoices: Choice<ZoneId>[] = ZONES.map((zone) => ({
    value: zone.id,
    label: localize(zone.shortName, language),
  }));

  const plateHint = (() => {
    if (!parsedPlate) return undefined;
    if (parsedPlate.kind === 'bharat') return t('vehicle.plateBharat');
    const state = STATE_NAMES[parsedPlate.stateCode];
    const zone = suggestHomeZone(parsedPlate);
    const stateName = state ? localize(state, language) : parsedPlate.stateCode;
    return zone
      ? t('vehicle.plateDetectedZone', {
          state: stateName,
          zone: localize(ZONES.find((candidate) => candidate.id === zone)!.shortName, language),
        })
      : t('vehicle.plateDetected', { state: stateName });
  })();

  const bsHint = bsSuggestion
    ? t(
        bsSuggestion.confidence === 'likely'
          ? 'vehicle.bsSuggested'
          : 'vehicle.bsSuggestedUncertain',
        {
          norm: formatBsNorm(bsSuggestion.norm),
        },
      )
    : t('vehicle.bsHelp');

  return (
    <Screen
      edges={[]}
      footer={<Button label={submitLabel} onPress={() => void submit()} loading={isSubmitting} />}
    >
      {isDocumentScanningAvailable() ? (
        <View style={styles.scanCard}>
          <AppText variant="subheading" color={colors.primary}>
            {t('vehicle.scanTitle')}
          </AppText>
          <AppText variant="callout" color={colors.inkMuted}>
            {t('vehicle.scanBody')}
          </AppText>
          <View style={styles.scanActions}>
            <Button
              label={t('vehicle.scanFromGallery')}
              icon="images-outline"
              variant="secondary"
              compact
              loading={busy === 'rc'}
              onPress={() => void runScan('library')}
              style={styles.flex}
            />
            <Button
              label={t('vehicle.scanFromCamera')}
              icon="camera-outline"
              variant="secondary"
              compact
              disabled={busy === 'rc'}
              onPress={() => void runScan('camera')}
              style={styles.flex}
            />
          </View>
          {scanNotice ? <Banner tone={scanNotice.tone} message={scanNotice.message} /> : null}
        </View>
      ) : null}

      <SectionHeader title={t('vehicle.sectionVehicle')} />
      <Card style={styles.section}>
        <Controller
          control={control}
          name="plate"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label={t('vehicle.plateLabel')}
              placeholder={t('vehicle.platePlaceholder')}
              value={value}
              onChangeText={(text) => {
                onChange(text.toUpperCase());
                applyPlate(text);
              }}
              onBlur={() => {
                onBlur();
                if (parsePlate(value)) onChange(formatPlate(value));
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              maxLength={16}
              emphasis
              hint={plateHint}
              error={errorText(errors.plate?.message)}
            />
          )}
        />
        {parsedPlate?.kind === 'bharat' ? (
          <Controller
            control={control}
            name="registeredInDelhi"
            render={({ field: { value, onChange } }) => (
              <ChoiceGroup
                label={t('vehicle.registeredInDelhiLabel')}
                choices={[
                  { value: 'yes', label: t('common.yes') },
                  { value: 'no', label: t('common.no') },
                ]}
                value={value === null ? null : value ? 'yes' : 'no'}
                onChange={(choice) => onChange(choice === 'yes')}
                error={errorText(errors.registeredInDelhi?.message)}
              />
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="nickname"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label={`${t('vehicle.nicknameLabel')} (${t('common.optional')})`}
              placeholder={t('vehicle.nicknamePlaceholder')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={40}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicleType"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              label={t('vehicle.typeLabel')}
              choices={typeChoices}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="fuel"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              label={t('vehicle.fuelLabel')}
              choices={fuelChoices}
              value={value}
              onChange={(next) => {
                onChange(next);
                if (next === 'electric') {
                  setValue('bsNorm', null);
                  setValue('pucExpiry', null);
                }
              }}
            />
          )}
        />
      </Card>

      <SectionHeader title={t('vehicle.sectionEmission')} />
      <Card style={styles.section}>
        <Controller
          control={control}
          name="registrationDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label={t('vehicle.registrationDateLabel')}
              value={value}
              onChange={(date) => {
                onChange(date);
                applyRegistrationDate(date);
              }}
              hint={t('vehicle.registrationDateHint')}
              minimumDate={EARLIEST_REGISTRATION}
              maximumDate={todayDate}
            />
          )}
        />
        {isElectric ? (
          <Banner tone="neutral" message={t('vehicle.bsNotNeeded')} />
        ) : (
          <>
            <Controller
              control={control}
              name="bsNorm"
              render={({ field: { value, onChange } }) => (
                <ChoiceGroup
                  label={t('vehicle.bsLabel')}
                  choices={normChoices}
                  value={value ?? 0}
                  onChange={(next) => {
                    userPickedNorm.current = true;
                    onChange(next === 0 ? null : next);
                  }}
                  hint={bsHint}
                />
              )}
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => void openLink('mParivahan')}
              hitSlop={8}
            >
              <AppText variant="calloutStrong" color={colors.primary}>
                {t('vehicle.bsHelpLink')}
              </AppText>
            </Pressable>
          </>
        )}
      </Card>

      <SectionHeader title={t('vehicle.sectionArea')} />
      <Card style={styles.section}>
        <Controller
          control={control}
          name="homeZone"
          render={({ field: { value, onChange } }) => (
            <ChoiceGroup
              label={t('vehicle.homeZoneLabel')}
              choices={zoneChoices}
              value={value}
              onChange={(zone) => {
                userPickedZone.current = true;
                onChange(zone);
              }}
              error={errorText(errors.homeZone?.message)}
            />
          )}
        />
        <Button
          label={t('vehicle.useLocation')}
          icon="location-outline"
          variant="ghost"
          compact
          loading={busy === 'location'}
          onPress={() => void detectLocation()}
          style={styles.inlineAction}
        />
        {areaNotice ? <Banner tone={areaNotice.tone} message={areaNotice.message} /> : null}
      </Card>

      <SectionHeader title={t('vehicle.sectionDocuments')} />
      <Card style={styles.section}>
        {isElectric ? (
          <Banner tone="neutral" message={t('vehicle.pucNotNeeded')} />
        ) : (
          <>
            <Controller
              control={control}
              name="pucExpiry"
              render={({ field: { value, onChange } }) => (
                <DateField
                  label={t('vehicle.pucLabel')}
                  value={value}
                  onChange={onChange}
                  hint={t('vehicle.pucHint')}
                  minimumDate={isoDateToDate(addDays(today, -730))}
                  maximumDate={isoDateToDate(addDays(today, 730))}
                />
              )}
            />
            {isDocumentScanningAvailable() ? (
              <Button
                label={t('vehicle.pucScan')}
                icon="scan-outline"
                variant="ghost"
                compact
                loading={busy === 'puc'}
                onPress={choosePucSource}
                style={styles.inlineAction}
              />
            ) : null}
            {pucNotice ? <Banner tone={pucNotice.tone} message={pucNotice.message} /> : null}
          </>
        )}
        <Controller
          control={control}
          name="insuranceExpiry"
          render={({ field: { value, onChange } }) => (
            <DateField
              label={t('vehicle.insuranceLabel')}
              value={value}
              onChange={onChange}
              minimumDate={isoDateToDate(addDays(today, -730))}
              maximumDate={isoDateToDate(addDays(today, 365 * 5))}
            />
          )}
        />
      </Card>

      <SectionHeader title={t('vehicle.sectionMore')} />
      <Card style={styles.section}>
        <Controller
          control={control}
          name="essentialService"
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{t('vehicle.essentialLabel')}</AppText>
                <AppText variant="caption" color={colors.inkSubtle}>
                  {t('vehicle.essentialHint')}
                </AppText>
              </View>
              <Switch
                accessibilityLabel={t('vehicle.essentialLabel')}
                value={value}
                onValueChange={onChange}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.surface}
              />
            </View>
          )}
        />
      </Card>

      {onRemove ? (
        <Button
          label={t('vehicle.remove')}
          icon="trash-outline"
          variant="danger"
          onPress={onRemove}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scanCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
  },
  scanActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.xl,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
