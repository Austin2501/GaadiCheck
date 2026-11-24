import { z } from 'zod';

import type { GrapStatus, RuleBook } from './types';

const localizedText = z.object({ en: z.string().min(1), hi: z.string().min(1) });
const zoneId = z.enum([
  'delhi',
  'gurugram',
  'faridabad',
  'ghaziabad',
  'gautam-buddh-nagar',
  'sonipat',
]);
const grapStage = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const bsNorm = z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected yyyy-MM-dd');

export const grapStatusSchema: z.ZodType<GrapStatus> = z.object({
  stage: grapStage,
  effectiveFrom: z.string().min(1),
  orderUrl: z.url(),
  note: localizedText,
  updatedAt: z.string().min(1),
  rulesVersion: z.number().int().nonnegative(),
});

const ruleSchema = z.object({
  id: z.string().min(1),
  zones: z.array(zoneId).min(1),
  conditions: z.object({
    vehicleTypes: z.array(z.enum(['car', 'two-wheeler', 'goods'])).optional(),
    fuels: z.array(z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid'])).optional(),
    maxBsNorm: bsNorm.optional(),
    registeredInDelhi: z.boolean().optional(),
    minStage: grapStage.optional(),
    validFrom: isoDate.optional(),
    validUntil: isoDate.optional(),
    exceptWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
    oddEven: z.boolean().optional(),
    exemptEssentialServices: z.boolean().optional(),
  }),
  severity: z.enum(['blocked', 'check']),
  fineInr: z.number().int().positive().nullable(),
  alertTopic: z
    .string()
    .regex(/^[a-zA-Z0-9-_.~%]+$/)
    .optional(),
  title: localizedText,
  explanation: localizedText,
  sourceUrl: z.url(),
});

export const ruleBookSchema: z.ZodType<RuleBook> = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string().min(1),
  documents: z.object({
    pucFineInr: z.number().int().positive(),
    newVehiclePucValidityMonths: z.number().int().positive(),
    reminderLeadDays: z.array(z.number().int().positive()).min(1),
    expiringSoonDays: z.number().int().nonnegative(),
    ageLimitYears: z.object({
      diesel: z.number().int().positive(),
      petrol: z.number().int().positive(),
    }),
  }),
  rules: z.array(ruleSchema),
});
