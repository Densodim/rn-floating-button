/**
 * types.ts
 *
 * RU: Все публичные типы и интерфейсы модуля rn-floating-button.
 *     Вынесены в отдельный файл, чтобы их было удобно переиспользовать
 *     в любом месте проекта без импорта самого компонента.
 *
 * EN: All public types and interfaces for the rn-floating-button module.
 *     Placed in a separate file so they can be reused anywhere
 *     without importing the component itself.
 */

import type { ReactNode } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Scroll behaviour
// ---------------------------------------------------------------------------

/**
 * Controls how the button reacts to scroll events.
 *
 * - `'hide'`  — default. Button hides on scroll down and reappears on scroll up
 *               (after the debounce delay). Driven by react-native-reanimated on the UI thread.
 * - `'none'`  — button is always visible regardless of scroll position.
 *               The scroll handler is still connected so `scrollY` / `isScrolling` /
 *               `scrollDirection` in context remain up-to-date for custom use.
 */
export type FloatingButtonScrollBehaviour = 'hide' | 'none';

// ---------------------------------------------------------------------------
// Позиционирование / Positioning
// ---------------------------------------------------------------------------

/**
 * RU: Горизонтальное выравнивание кнопки.
 *     'left'   — прижата к левому краю
 *     'center' — по центру экрана
 *     'right'  — прижата к правому краю (по умолчанию)
 *
 * EN: Horizontal alignment of the floating button.
 *     'left'   — pinned to the left edge
 *     'center' — centered on screen
 *     'right'  — pinned to the right edge (default)
 */
export type FloatingButtonHorizontalPosition = 'left' | 'center' | 'right';

/**
 * RU: Настройки отступов от краёв экрана (в пикселях).
 *     Если bottom не передан — используется DEFAULT_BOTTOM (24).
 *     Если horizontal не передан — используется DEFAULT_HORIZONTAL (24).
 *
 * EN: Edge insets for the button position (in pixels).
 *     If bottom is not provided — DEFAULT_BOTTOM (24) is used.
 *     If horizontal is not provided — DEFAULT_HORIZONTAL (24) is used.
 */
export interface FloatingButtonInsets {
  /** RU: Отступ снизу / EN: Bottom offset */
  bottom?: number;
  /** RU: Отступ по горизонтали (от левого или правого края) / EN: Horizontal offset (from left or right edge) */
  horizontal?: number;
}

// ---------------------------------------------------------------------------
// Настройки анимации / Animation config
// ---------------------------------------------------------------------------

/**
 * RU: Тонкая настройка анимаций появления/скрытия.
 *     Все поля опциональны — есть разумные дефолты.
 *
 * EN: Fine-tuning for show/hide animations.
 *     All fields are optional — sensible defaults are provided.
 */
export interface FloatingButtonAnimationConfig {
  /**
   * RU: Задержка (мс) после остановки скролла перед появлением кнопки.
   * EN: Delay (ms) after scroll stops before the button appears.
   * @default 350
   */
  showDelay?: number;

  /**
   * RU: Длительность анимации появления (мс).
   * EN: Duration of the show animation (ms).
   * @default 250
   */
  showDuration?: number;

  /**
   * RU: Длительность анимации скрытия (мс).
   * EN: Duration of the hide animation (ms).
   * @default 150
   */
  hideDuration?: number;

  /**
   * RU: На сколько пикселей кнопка сдвигается вниз при скрытии.
   * EN: How many pixels the button slides down when hiding.
   * @default 24
   */
  translateYOffset?: number;
}

// ---------------------------------------------------------------------------
// Пропы компонента / Component props
// ---------------------------------------------------------------------------

/**
 * RU: Полный набор пропов компонента FloatingButton.
 *
 * EN: Full props interface for the FloatingButton component.
 */
export interface FloatingButtonProps {
  /**
   * RU: Контент экрана — обычно FloatingButtonFlatList / ScrollView / SectionList.
   *     Рендерится в нормальном потоке, занимает всё доступное пространство.
   *     НЕ анимируется — анимируется только `button`.
   *
   * EN: Screen content — typically FloatingButtonFlatList / ScrollView / SectionList.
   *     Rendered in normal flow, takes up all available space.
   *     NOT animated — only `button` is animated.
   */
  children: ReactNode;

  /**
   * RU: Сама парящая кнопка — любой React-элемент (твоя стилизованная кнопка).
   *     Рендерится внутри <Animated.View position="absolute"> и получает
   *     анимацию opacity + translateY при скролле.
   *
   *     Пример / Example:
   *       button={<ConfirmButton onPress={handleConfirm} />}
   *
   * EN: The floating button itself — any React element (your styled button).
   *     Rendered inside <Animated.View position="absolute"> and receives
   *     opacity + translateY animation on scroll.
   */
  button: ReactNode;

  /**
   * RU: Горизонтальное положение кнопки на экране.
   * EN: Horizontal position of the button on screen.
   * @default 'right'
   */
  horizontalPosition?: FloatingButtonHorizontalPosition;

  /**
   * RU: Отступы от краёв экрана.
   * EN: Insets from screen edges.
   */
  insets?: FloatingButtonInsets;

  /**
   * RU: Конфигурация анимации. Переопределяет дефолтные значения.
   * EN: Animation configuration. Overrides default values.
   */
  animationConfig?: FloatingButtonAnimationConfig;

  /**
   * RU: Дополнительные стили для контейнера (position: absolute уже задан внутри).
   * EN: Additional styles for the container (position: absolute is already set internally).
   */
  style?: StyleProp<ViewStyle>;

  /**
   * RU: Скрыть кнопку программно (независимо от скролла).
   * EN: Hide the button programmatically (regardless of scroll state).
   * @default false
   */
  hidden?: boolean;

  /**
   * Controls how the button reacts to scroll events.
   *
   * - `'hide'` — button hides on scroll down and reappears on scroll up (default).
   * - `'none'` — button is always visible; scroll tracking still runs so context
   *              values (`scrollY`, `isScrolling`, `scrollDirection`) remain usable.
   *
   * @default 'hide'
   */
  scrollBehaviour?: FloatingButtonScrollBehaviour;
}

// ---------------------------------------------------------------------------
// Тип ref / Ref type
// ---------------------------------------------------------------------------

/**
 * RU: Методы, доступные через ref на FloatingButton.
 *     Позволяют управлять видимостью из родительского компонента.
 *
 * EN: Methods available via ref on FloatingButton.
 *     Allow controlling visibility from a parent component.
 */
export interface FloatingButtonRef {
  /** RU: Показать кнопку / EN: Show the button */
  show: () => void;
  /** RU: Скрыть кнопку / EN: Hide the button */
  hide: () => void;
}

// ---------------------------------------------------------------------------
// Тип onScroll-хендлера / onScroll handler type
// ---------------------------------------------------------------------------

/**
 * RU: Тип нативного scroll-события, пробрасываемого в хук.
 * EN: Native scroll event type forwarded to the hook.
 */
export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;
