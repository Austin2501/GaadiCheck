import rawGrapStatus from '../../data/grap-status.json';
import rawRuleBook from '../../data/rules.json';
import { grapStatusSchema, ruleBookSchema } from '../domain/schemas';
import type { GrapStatus, RuleBook } from '../domain/types';

/**
 * Snapshot shipped inside the app. It is the offline fallback and the starting point before the
 * first network refresh. The same files are served remotely from the repository's data folder.
 */
export const BUNDLED_GRAP_STATUS: GrapStatus = grapStatusSchema.parse(rawGrapStatus);
export const BUNDLED_RULE_BOOK: RuleBook = ruleBookSchema.parse(rawRuleBook);
