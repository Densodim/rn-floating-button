/**
 * useFloatingInsets.ts
 *
 * RU: Хелпер для вычисления отступа кнопки над таб-баром.
 *
 *     Самый частый вопрос при интеграции: «на сколько поднять кнопку
 *     над таб-баром?». Нужно знать высоту таб-бара и прибавить
 *     insets.bottom (home indicator на iPhone). Этот хук делает это за вас.
 *
 *     Использование / Usage:
 *       const { bottom } = useFloatingInsets({ tabBarHeight: 52 });
 *       <FloatingButton insets={{ bottom }} button={<MyButton />}>
 *         ...
 *       </FloatingButton>
 *
 *     Или с полным объектом отступов / Or with full insets:
 *       const insets = useFloatingInsets({ tabBarHeight: 52, extraBottom: 8 });
 *       <FloatingButton insets={insets} button={<MyButton />}>
 *         ...
 *       </FloatingButton>
 *
 * EN: Helper for computing the button inset above the tab bar.
 *
 *     The most common integration question: "how far above the tab bar
 *     should the button sit?". You need to know the tab bar height and add
 *     insets.bottom (home indicator on iPhone). This hook does it for you.
 */

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FloatingButtonInsets } from './types';

// ---------------------------------------------------------------------------
// Параметры / Parameters
// ---------------------------------------------------------------------------

export interface UseFloatingInsetsOptions {
  /**
   * RU: Высота таб-бара в пикселях.
   *     Типичные значения: 49 (iOS default), 56 (Material Design), 52 (expo-router).
   *
   * EN: Tab bar height in pixels.
   *     Typical values: 49 (iOS default), 56 (Material Design), 52 (expo-router).
   */
  tabBarHeight: number;

  /**
   * RU: Дополнительный отступ сверху таб-бара (зазор между кнопкой и баром).
   * EN: Extra gap above the tab bar (space between button and bar).
   * @default 16
   */
  extraBottom?: number;

  /**
   * RU: Горизонтальный отступ. Если не передан — используется дефолт FloatingButton (24).
   * EN: Horizontal inset. If not provided — FloatingButton default (24) is used.
   */
  horizontal?: number;
}

// ---------------------------------------------------------------------------
// Возвращаемый тип / Return type
// ---------------------------------------------------------------------------

export interface UseFloatingInsetsResult extends FloatingButtonInsets {
  /**
   * RU: Итоговый отступ снизу = tabBarHeight + safeArea.bottom + extraBottom.
   *     safe area уже учтена внутри FloatingButton, поэтому здесь передаём
   *     только tabBarHeight + extraBottom — без дублирования.
   *
   * EN: Final bottom inset = tabBarHeight + extraBottom.
   *     Safe area is already applied inside FloatingButton, so here we only
   *     pass tabBarHeight + extraBottom — no double-counting.
   */
  bottom: number;
}

// ---------------------------------------------------------------------------
// Хук / Hook
// ---------------------------------------------------------------------------

const DEFAULT_EXTRA_BOTTOM = 16;

/**
 * RU: Вычисляет bottom-отступ для FloatingButton так, чтобы кнопка
 *     оказалась над таб-баром с учётом safe area.
 *
 *     Формула: bottom = tabBarHeight + extraBottom
 *     (safe area учитывается самим FloatingButton — не дублируем)
 *
 * EN: Computes the bottom inset for FloatingButton so the button sits
 *     above the tab bar accounting for safe area.
 *
 *     Formula: bottom = tabBarHeight + extraBottom
 *     (safe area is handled by FloatingButton itself — no double-counting)
 */
export function useFloatingInsets({
  tabBarHeight,
  extraBottom = DEFAULT_EXTRA_BOTTOM,
  horizontal,
}: UseFloatingInsetsOptions): UseFloatingInsetsResult {
  // RU: safeArea нужна только для информации — FloatingButton сам её учитывает.
  //     Мы её здесь НЕ прибавляем, иначе получится двойной отступ.
  // EN: safeArea is here for reference only — FloatingButton handles it internally.
  //     We do NOT add it here to avoid double-counting.
  useSafeAreaInsets(); // RU: вызов нужен чтобы хук был реактивным / EN: call ensures reactivity

  const result: UseFloatingInsetsResult = {
    // RU: Кнопка должна быть на tabBarHeight выше дефолтной позиции + зазор
    // EN: Button should be tabBarHeight above default position + gap
    bottom: tabBarHeight + extraBottom,
  };

  if (horizontal !== undefined) {
    result.horizontal = horizontal;
  }

  return result;
}
