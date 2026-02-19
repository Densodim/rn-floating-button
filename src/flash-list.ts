/**
 * flash-list.ts
 *
 * Sub-export entry point for the FlashList integration.
 *
 * Import from 'rn-floating-button/flash-list' instead of the main bundle
 * when you want cleaner imports and your project uses @shopify/flash-list:
 *
 *   import { FloatingButtonFlashList, createFloatingList } from 'rn-floating-button/flash-list';
 */

export {
  FloatingButtonFlashList,
  createFloatingList,
} from './FloatingButtonFlashList';

export type { FloatingButtonFlashListProps } from './FloatingButtonFlashList';
