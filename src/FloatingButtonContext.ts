/**
 * FloatingButtonContext.ts
 *
 * RU: Контекст для передачи scroll-хендлера от FloatingButton вниз к
 *     обёртке FloatingButtonScrollView (или любому другому компоненту прокрутки).
 *
 *     Архитектурное решение:
 *     Вместо того чтобы пробрасывать onScroll через пропы по всему дереву,
 *     FloatingButton создаёт контекст и кладёт туда хендлер.
 *     FloatingButtonScrollView читает хендлер из контекста и подключает его
 *     к нативному ScrollView — никакого prop-drilling.
 *
 * EN: Context for passing the scroll handler from FloatingButton down to
 *     FloatingButtonScrollView (or any other scroll component wrapper).
 *
 *     Architectural decision:
 *     Instead of drilling onScroll through props across the whole tree,
 *     FloatingButton creates a context and puts the handler there.
 *     FloatingButtonScrollView reads the handler from context and attaches it
 *     to the native ScrollView — no prop-drilling needed.
 */

import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Форма контекста / Context shape
// ---------------------------------------------------------------------------

export interface FloatingButtonContextValue {
  /**
   * RU: Shared value из reanimated — текущая позиция скролла по Y.
   *     Обновляется на UI-потоке без bridge-вызовов.
   *
   * EN: Reanimated shared value — current scroll Y position.
   *     Updated on the UI thread without bridge calls.
   */
  scrollY: SharedValue<number>;

  /**
   * RU: Shared value — направление последнего скролла.
   *     1  = вниз (down), -1 = вверх (up), 0 = нет движения (idle).
   *
   * EN: Shared value — direction of the last scroll.
   *     1  = down, -1 = up, 0 = idle.
   */
  scrollDirection: SharedValue<number>;

  /**
   * RU: Shared value — флаг «скролл сейчас активен».
   *     true пока пользователь скроллит; false после остановки.
   *
   * EN: Shared value — flag "scroll is currently active".
   *     true while the user is scrolling; false after it stops.
   */
  isScrolling: SharedValue<boolean>;
}

// ---------------------------------------------------------------------------
// Создание контекста / Creating the context
// ---------------------------------------------------------------------------

/**
 * RU: Дефолтное значение — null, чтобы можно было проверить,
 *     используется ли хук вне провайдера.
 *
 * EN: Default value is null so we can detect usage outside a provider.
 */
export const FloatingButtonContext =
  createContext<FloatingButtonContextValue | null>(null);

// ---------------------------------------------------------------------------
// Хук-потребитель / Consumer hook
// ---------------------------------------------------------------------------

/**
 * RU: Хук для чтения контекста внутри FloatingButtonScrollView.
 *     Выбрасывает понятную ошибку, если компонент использован вне
 *     FloatingButton-провайдера.
 *
 * EN: Hook for reading the context inside FloatingButtonScrollView.
 *     Throws a descriptive error if the component is used outside
 *     a FloatingButton provider.
 */
export function useFloatingButtonContext(): FloatingButtonContextValue {
  const ctx = useContext(FloatingButtonContext);

  if (!ctx) {
    throw new Error(
      '[rn-floating-button] useFloatingButtonContext: ' +
        'FloatingButtonScrollView должен быть вложен внутрь <FloatingButton>. ' +
        'FloatingButtonScrollView must be nested inside <FloatingButton>.',
    );
  }

  return ctx;
}
