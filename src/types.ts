/**
 * types.ts
 *
 * All public types and interfaces for the rn-floating-button module.
 * Placed in a separate file so they can be reused anywhere
 * without importing the component itself.
 */

import type { ReactNode } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Scroll behaviour
// ---------------------------------------------------------------------------

/**
 * Controls how the button reacts to scroll events.
 *
 * - `'hide'` — default. Button hides on scroll down and reappears on scroll up
 *              (after the debounce delay). Driven by react-native-reanimated on the UI thread.
 * - `'none'` — button is always visible regardless of scroll position.
 *              The scroll handler is still connected so `scrollY` / `isScrolling` /
 *              `scrollDirection` in context remain up-to-date for custom use.
 */
export type FloatingButtonScrollBehaviour = 'hide' | 'none';

// ---------------------------------------------------------------------------
// Hidden transition
// ---------------------------------------------------------------------------

/**
 * Controls how the button animates when the `hidden` prop changes.
 *
 * - `'animated'` — default. Button fades + slides in/out using `withTiming`.
 * - `'instant'`  — opacity and translateY are set immediately without animation.
 *                  Useful when switching tabs so the hide/show does not add
 *                  visual delay on top of the navigation transition.
 */
export type FloatingButtonHiddenTransition = 'animated' | 'instant';

// ---------------------------------------------------------------------------
// Positioning
// ---------------------------------------------------------------------------

/**
 * Horizontal alignment of the floating button.
 * - `'left'`   — pinned to the left edge
 * - `'center'` — centered on screen
 * - `'right'`  — pinned to the right edge (default)
 */
export type FloatingButtonHorizontalPosition = 'left' | 'center' | 'right';

/**
 * Edge insets for the button position (in pixels).
 * If `bottom` is not provided — DEFAULT_BOTTOM (24) is used.
 * If `horizontal` is not provided — DEFAULT_HORIZONTAL (24) is used.
 */
export interface FloatingButtonInsets {
  /** Bottom offset in pixels (safe area is added on top internally). */
  bottom?: number;
  /** Horizontal offset from the left or right edge. */
  horizontal?: number;
}

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

/**
 * Fine-tuning for show/hide animations.
 * All fields are optional — sensible defaults are provided.
 */
export interface FloatingButtonAnimationConfig {
  /**
   * Delay (ms) after scroll stops before the button appears.
   * @default 350
   */
  showDelay?: number;

  /**
   * Duration of the show animation (ms).
   * @default 250
   */
  showDuration?: number;

  /**
   * Duration of the hide animation (ms).
   * @default 150
   */
  hideDuration?: number;

  /**
   * How many pixels the button slides down when hiding.
   * @default 24
   */
  translateYOffset?: number;
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

/**
 * Full props interface for the FloatingButton component.
 */
export interface FloatingButtonProps {
  /**
   * Screen content — typically FloatingButtonFlatList / ScrollView / SectionList.
   * Rendered in normal flow, takes up all available space.
   * NOT animated — only `button` is animated.
   */
  children: ReactNode;

  /**
   * The floating button itself — any React element (your styled button).
   * Rendered inside `<Animated.View position="absolute">` and receives
   * opacity + translateY animation on scroll.
   *
   * Example:
   *   button={<ConfirmButton onPress={handleConfirm} />}
   */
  button: ReactNode;

  /**
   * Horizontal position of the button on screen.
   * @default 'right'
   */
  horizontalPosition?: FloatingButtonHorizontalPosition;

  /**
   * Insets from screen edges.
   */
  insets?: FloatingButtonInsets;

  /**
   * Animation configuration. Overrides default values.
   */
  animationConfig?: FloatingButtonAnimationConfig;

  /**
   * Additional styles for the outer `Animated.View` container.
   * `position: 'absolute'` is already set internally.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Styles applied to the inner `View` that wraps `button`.
   * Use this to control the button width, e.g. `{ width: 200 }` or
   * `{ alignSelf: 'center' }`. Without this, a `fullWidth` button
   * would stretch to fill the entire `Animated.View` bounding box.
   *
   * Example:
   *   buttonStyle={{ width: 220 }}
   */
  buttonStyle?: StyleProp<ViewStyle>;

  /**
   * Hide the button programmatically (regardless of scroll state).
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

  /**
   * Controls whether the `hidden` prop change is animated or instant.
   *
   * - `'animated'` — button fades + slides in/out (default).
   * - `'instant'`  — no animation; opacity and position snap immediately.
   *                   Recommended when switching tabs to avoid visual delay.
   *
   * @default 'animated'
   */
  hiddenTransition?: FloatingButtonHiddenTransition;
}

// ---------------------------------------------------------------------------
// Ref type
// ---------------------------------------------------------------------------

/**
 * Methods available via ref on FloatingButton.
 * Allow controlling visibility from a parent component.
 */
export interface FloatingButtonRef {
  /** Show the button immediately (no debounce). */
  show: () => void;
  /** Hide the button immediately. */
  hide: () => void;
}

// ---------------------------------------------------------------------------
// onScroll handler type
// ---------------------------------------------------------------------------

/**
 * Native scroll event type forwarded to the hook.
 */
export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;
