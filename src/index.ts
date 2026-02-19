/**
 * index.ts
 *
 * Public API of the rn-floating-button module.
 */

// ---------------------------------------------------------------------------
// Core component
// ---------------------------------------------------------------------------

export { FloatingButton } from './FloatingButton';

// ---------------------------------------------------------------------------
// Scroll wrappers
// ---------------------------------------------------------------------------

export { FloatingButtonScrollView }  from './FloatingButtonScrollView';
export { FloatingButtonFlatList }    from './FloatingButtonFlatList';
export { FloatingButtonSectionList } from './FloatingButtonSectionList';

// ---------------------------------------------------------------------------
// FlashList integration (optional peer dep @shopify/flash-list)
// ---------------------------------------------------------------------------

export {
  FloatingButtonFlashList,
  createFloatingList,
} from './FloatingButtonFlashList';

// ---------------------------------------------------------------------------
// Context (advanced integration)
// ---------------------------------------------------------------------------

export {
  FloatingButtonContext,
  useFloatingButtonContext,
} from './FloatingButtonContext';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export { useScrollHide }     from './useScrollHide';
export { useFloatingInsets } from './useFloatingInsets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  FloatingButtonProps,
  FloatingButtonRef,
  FloatingButtonHorizontalPosition,
  FloatingButtonInsets,
  FloatingButtonAnimationConfig,
  FloatingButtonScrollBehaviour,
  FloatingButtonHiddenTransition,
  ScrollEvent,
} from './types';

export type {
  UseFloatingInsetsOptions,
  UseFloatingInsetsResult,
} from './useFloatingInsets';

export type { FloatingButtonFlashListProps } from './FloatingButtonFlashList';
