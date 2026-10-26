import type { CacaoProfile, Packaging } from '../../../../contracts/index.js';
import { photos, type PhotoAsset } from '../../shared/photos.js';

/**
 * Contract enum values in display order. Values are sent to the API untranslated; visible labels
 * live in b2b.cacao.<value>.* and b2b.packaging.<value>.* in this feature's locale files.
 */
export const CACAO_PROFILES: readonly CacaoProfile[] = ['dark70', 'dark85', 'milk45'];
export const PACKAGING_OPTIONS: readonly Packaging[] = ['sleeve', 'giftBox', 'bulk'];

/** Example photo for each packaging option (shared library: client/src/shared/photos.ts). */
export const PACKAGING_PHOTOS: Record<Packaging, PhotoAsset> = {
  sleeve: photos.packagingSleeve,
  giftBox: photos.packagingGiftBox,
  bulk: photos.packagingBulk,
};

/** Decision D06 bounds, mirrored from quoteSchema so the UI can explain them before submission. */
export const QUANTITY_MIN = 50;
export const QUANTITY_MAX = 100000;

/** Decision D07: one required PDF branding file, at most 5 MiB. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** String limits from quoteSchema (contracts/validation.ts). */
export const COMPANY_MAX = 120;
export const EMAIL_MAX = 254;
export const NOTES_MAX = 2000;
