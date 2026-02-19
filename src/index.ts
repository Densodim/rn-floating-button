/**
 * index.ts
 *
 * RU: Публичное API модуля rn-floating-button.
 *     Всё что здесь экспортируется — доступно потребителям.
 *     Внутренние детали реализации (FloatingButtonContext, useScrollHide)
 *     тоже экспортируются — для продвинутых кейсов интеграции.
 *
 * EN: Public API of the rn-floating-button module.
 *     Everything exported here is available to consumers.
 *     Internal implementation details (FloatingButtonContext, useScrollHide)
 *     are also exported — for advanced integration use-cases.
 */

// ---------------------------------------------------------------------------
// Компоненты / Components
// ---------------------------------------------------------------------------

export {
  FloatingButton,
  FloatingButtonScrollView,
  FloatingButtonFlatList,
  FloatingButtonSectionList,
  FloatingButtonFlashList,
} from './FloatingButton';

// ---------------------------------------------------------------------------
// Контекст (для продвинутой интеграции) / Context (for advanced integration)
// ---------------------------------------------------------------------------

export {
  FloatingButtonContext,
  useFloatingButtonContext,
} from './FloatingButtonContext';

// ---------------------------------------------------------------------------
// Хук анимации (для кастомной интеграции без компонента)
// Animation hook (for custom integration without the component)
// ---------------------------------------------------------------------------

export { useScrollHide } from './useScrollHide';

// ---------------------------------------------------------------------------
// Хук отступов над таб-баром / Tab bar insets helper hook
// ---------------------------------------------------------------------------

export { useFloatingInsets } from './useFloatingInsets';

// ---------------------------------------------------------------------------
// Типы / Types
// ---------------------------------------------------------------------------

export type {
  FloatingButtonProps,
  FloatingButtonRef,
  FloatingButtonHorizontalPosition,
  FloatingButtonInsets,
  FloatingButtonAnimationConfig,
  FloatingButtonScrollBehaviour,
  ScrollEvent,
} from './types';

export type {
  UseFloatingInsetsOptions,
  UseFloatingInsetsResult,
} from './useFloatingInsets';

export type { FloatingButtonFlashListProps } from './FloatingButton';
