import type { AssetStatus } from '../api/types';

/// Mirrors AssetsService's VALID_TRANSITIONS matrix. UNDER_REPAIR
/// deliberately can't go straight to ASSIGNED — it has to pass back
/// through AVAILABLE first. RETIRED is terminal (assets are never
/// deleted once retired).
export function nextAssetStatuses(current: AssetStatus): AssetStatus[] {
  switch (current) {
    case 'AVAILABLE':
      return ['ASSIGNED', 'UNDER_REPAIR', 'RETIRED'];
    case 'ASSIGNED':
      return ['AVAILABLE', 'UNDER_REPAIR', 'RETIRED'];
    case 'UNDER_REPAIR':
      return ['AVAILABLE', 'RETIRED'];
    case 'RETIRED':
      return [];
  }
}
