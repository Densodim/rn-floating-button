/**
 * useScrollHide.ts
 *
 * RU: Хук, содержащий всю логику анимации появления/скрытия кнопки.
 *
 *     Жизненный цикл:
 *     1. FloatingButton создаёт shared values через этот хук.
 *     2. Значения кладутся в FloatingButtonContext.
 *     3. FloatingButtonScrollView читает их из контекста и обновляет
 *        scrollY при каждом scroll-событии (UI thread, без bridge).
 *     4. Worklet следит за scrollY и управляет opacity + translateY кнопки.
 *     5. После остановки скролла — debounce через runOnJS → setTimeout,
 *        кнопка плавно появляется обратно; isScrolling и scrollDirection сбрасываются.
 *
 * EN: Hook containing all animation logic for show/hide behaviour.
 *
 *     Lifecycle:
 *     1. FloatingButton creates shared values via this hook.
 *     2. Values are put into FloatingButtonContext.
 *     3. FloatingButtonScrollView reads them from context and updates
 *        scrollY on every scroll event (UI thread, no bridge).
 *     4. A worklet watches scrollY and drives opacity + translateY.
 *     5. After scroll stops — debounce via runOnJS → setTimeout,
 *        button smoothly reappears; isScrolling and scrollDirection are reset.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type {
  FloatingButtonAnimationConfig,
  FloatingButtonHiddenTransition,
  FloatingButtonScrollBehaviour,
} from './types';

// ---------------------------------------------------------------------------
// Дефолтные значения анимации / Default animation values
// ---------------------------------------------------------------------------

const DEFAULT_SHOW_DELAY = 350;     // мс / ms
const DEFAULT_SHOW_DURATION = 250;  // мс / ms
const DEFAULT_HIDE_DURATION = 150;  // мс / ms
const DEFAULT_TRANSLATE_Y = 24;     // пикселей / pixels

// ---------------------------------------------------------------------------
// Возвращаемый тип / Return type
// ---------------------------------------------------------------------------

export interface UseScrollHideResult {
  /**
   * RU: Shared value текущего Y скролла — передаётся через контекст
   *     во FloatingButtonScrollView.
   * EN: Current scroll Y shared value — forwarded via context
   *     to FloatingButtonScrollView.
   */
  scrollY: ReturnType<typeof useSharedValue<number>>;

  /**
   * RU: Shared value направления скролла (1 вниз, -1 вверх, 0 — нет).
   * EN: Scroll direction shared value (1 down, -1 up, 0 idle).
   */
  scrollDirection: ReturnType<typeof useSharedValue<number>>;

  /**
   * RU: Shared value флага активного скролла.
   * EN: Active scroll flag shared value.
   */
  isScrolling: ReturnType<typeof useSharedValue<boolean>>;

  /**
   * RU: Animated-стиль для контейнера кнопки.
   *     Содержит opacity и transform: translateY.
   *     Подключается напрямую к <Animated.View>.
   *
   * EN: Animated style for the button container.
   *     Contains opacity and transform: translateY.
   *     Attach directly to <Animated.View>.
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;

  /**
   * RU: Программно показать кнопку (вызывается через ref).
   * EN: Programmatically show the button (called via ref).
   */
  show: () => void;

  /**
   * RU: Программно скрыть кнопку (вызывается через ref).
   * EN: Programmatically hide the button (called via ref).
   */
  hide: () => void;
}

// ---------------------------------------------------------------------------
// Хук / Hook
// ---------------------------------------------------------------------------

/**
 * @param config            - Optional animation configuration.
 * @param externalHidden    - Programmatic hidden flag from props.
 * @param scrollBehaviour   - 'hide' (default) or 'none'.
 * @param hiddenTransition  - 'animated' (default) or 'instant'.
 */
export function useScrollHide(
  config?: FloatingButtonAnimationConfig,
  externalHidden?: boolean,
  scrollBehaviour: FloatingButtonScrollBehaviour = 'hide',
  hiddenTransition: FloatingButtonHiddenTransition = 'animated',
): UseScrollHideResult {
  // ---------------------------------------------------------------------------
  // Конфиг с фолбэком на дефолты / Config with fallback to defaults
  // ---------------------------------------------------------------------------
  const showDelay = config?.showDelay ?? DEFAULT_SHOW_DELAY;
  const showDuration = config?.showDuration ?? DEFAULT_SHOW_DURATION;
  const hideDuration = config?.hideDuration ?? DEFAULT_HIDE_DURATION;
  const translateYOffset = config?.translateYOffset ?? DEFAULT_TRANSLATE_Y;

  // ---------------------------------------------------------------------------
  // Shared values (обновляются на UI-потоке)
  // Shared values (updated on the UI thread)
  // ---------------------------------------------------------------------------

  /** RU: Текущая позиция скролла по Y / EN: Current scroll Y position */
  const scrollY = useSharedValue(0);

  /** RU: Направление скролла: 1 = вниз, -1 = вверх, 0 = стоит / EN: Scroll direction: 1 = down, -1 = up, 0 = idle */
  const scrollDirection = useSharedValue(0);

  /** RU: Флаг активного скролла / EN: Active scroll flag */
  const isScrolling = useSharedValue(false);

  /** RU: Текущая opacity кнопки (1 = видима, 0 = скрыта) / EN: Current button opacity (1 = visible, 0 = hidden) */
  const opacity = useSharedValue(1);

  /** RU: Текущий сдвиг вниз / EN: Current downward translation */
  const translateY = useSharedValue(0);

  /**
   * Shared value mirror of the scrollBehaviour prop.
   * Needed so the worklet (UI thread) can read it without a bridge call.
   * Updated via useEffect whenever the prop changes.
   */
  const scrollBehaviourSV = useSharedValue<FloatingButtonScrollBehaviour>(scrollBehaviour);

  useEffect(() => {
    scrollBehaviourSV.value = scrollBehaviour;
  }, [scrollBehaviour, scrollBehaviourSV]);

  // ---------------------------------------------------------------------------
  // Debounce-таймер на JS-потоке / Debounce timer on JS thread
  // ---------------------------------------------------------------------------

  /**
   * RU: useRef вместо useState — не вызывает перерендер,
   *     нужен только для хранения ID таймера между вызовами worklet.
   *
   * EN: useRef instead of useState — no re-render triggered,
   *     only needed to store the timer ID between worklet calls.
   */
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // JS-функции (вызываются через runOnJS из worklet)
  // JS functions (called via runOnJS from worklets)
  // ---------------------------------------------------------------------------

  /**
   * RU: Запускает анимацию показа кнопки с debounce-задержкой.
   *     Если таймер уже висит — сбрасывает и запускает заново.
   *     После показа сбрасывает isScrolling и scrollDirection в idle.
   *
   * EN: Starts the show animation with a debounce delay.
   *     If a timer is already pending — clears and restarts it.
   *     After showing, resets isScrolling and scrollDirection to idle.
   */
  const scheduleShow = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;

      // RU: Анимируем обратно: opacity → 1, translateY → 0
      // EN: Animate back: opacity → 1, translateY → 0
      opacity.value = withTiming(1, { duration: showDuration });
      translateY.value = withTiming(0, { duration: showDuration });

      // RU: Скролл остановился — сбрасываем флаги в idle
      // EN: Scroll has stopped — reset flags to idle
      isScrolling.value = false;
      scrollDirection.value = 0;
    }, showDelay);
  }, [opacity, translateY, isScrolling, scrollDirection, showDelay, showDuration]);

  /**
   * RU: Отменяет debounce-таймер показа (вызывается при новом скролле).
   * EN: Cancels the pending show debounce timer (called on new scroll).
   */
  const cancelScheduledShow = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Worklet-реакция на скролл / Worklet reaction on scroll
  // ---------------------------------------------------------------------------

  /**
   * RU: useAnimatedReaction следит за scrollY на UI-потоке.
   *     При каждом изменении:
   *     - вычисляет направление (delta > 0 → скролл вниз → скрыть)
   *     - при скролле вниз: немедленно скрывает кнопку
   *     - при скролле вверх или остановке: планирует показ через debounce
   *
   *     previous из useAnimatedReaction — встроенное предыдущее значение,
   *     отдельный prevScrollY shared value не нужен.
   *
   * EN: useAnimatedReaction watches scrollY on the UI thread.
   *     On each change:
   *     - computes direction (delta > 0 → scrolling down → hide)
   *     - on scroll down: immediately hides the button
   *     - on scroll up or stop: schedules show via debounce
   *
   *     previous from useAnimatedReaction is the built-in previous value,
   *     a separate prevScrollY shared value is not needed.
   */
  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      'worklet';

      if (previous === null) return;

      const delta = current - previous;

      if (Math.abs(delta) < 1) {
        // Movement too small — ignore
        return;
      }

      // Always track direction and scrolling state so context consumers
      // get accurate values even in 'none' mode.
      if (delta > 0) {
        scrollDirection.value = 1;
        isScrolling.value = true;

        if (scrollBehaviourSV.value === 'hide') {
          // Cancel any pending show and hide the button immediately.
          runOnJS(cancelScheduledShow)();
          cancelAnimation(opacity);
          cancelAnimation(translateY);
          opacity.value = withTiming(0, { duration: hideDuration });
          translateY.value = withTiming(translateYOffset, { duration: hideDuration });
          // Schedule reappear so the button comes back once scrolling stops,
          // even if the user never scrolls back up.
          // Each new scroll-down event resets this timer via clearTimeout inside
          // scheduleShow, so it only fires after showDelay ms of inactivity.
          runOnJS(scheduleShow)();
        }
      } else {
        scrollDirection.value = -1;
        isScrolling.value = true;

        if (scrollBehaviourSV.value === 'hide') {
          // Schedule the reappear animation with debounce.
          // isScrolling will be reset to false inside scheduleShow.
          runOnJS(scheduleShow)();
        } else {
          // 'none' mode: nothing to animate, but still reset state
          // so isScrolling doesn't stay true forever.
          runOnJS(cancelScheduledShow)();
          isScrolling.value = false;
          scrollDirection.value = 0;
        }
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Программное управление / Programmatic control
  // ---------------------------------------------------------------------------

  /**
   * RU: Показать кнопку немедленно (без debounce).
   *     Используется при вызове ref.show() или когда hidden=false.
   *
   * EN: Show the button immediately (no debounce).
   *     Used when ref.show() is called or hidden=false.
   */
  const show = useCallback(() => {
    cancelScheduledShow();
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    opacity.value = withTiming(1, { duration: showDuration });
    translateY.value = withTiming(0, { duration: showDuration });
  }, [opacity, translateY, showDuration, cancelScheduledShow]);

  /**
   * RU: Скрыть кнопку немедленно (без debounce).
   *     Используется при вызове ref.hide() или когда hidden=true.
   *
   * EN: Hide the button immediately (no debounce).
   *     Used when ref.hide() is called or hidden=true.
   */
  const hide = useCallback(() => {
    cancelScheduledShow();
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    opacity.value = withTiming(0, { duration: hideDuration });
    translateY.value = withTiming(translateYOffset, { duration: hideDuration });
  }, [opacity, translateY, hideDuration, translateYOffset, cancelScheduledShow]);

  // ---------------------------------------------------------------------------
  // Реакция на проп hidden / React to hidden prop
  // ---------------------------------------------------------------------------

  /**
   * Watch externalHidden changes.
   *
   * On first mount — store initial state without animation.
   * If hidden=true on mount — snap to hidden instantly (nothing to animate from).
   *
   * On subsequent changes:
   *   hiddenTransition='animated' (default) → call show()/hide() which use withTiming.
   *   hiddenTransition='instant'            → snap opacity/translateY directly.
   *
   * On hidden → false: always reset scrollY, isScrolling, scrollDirection first
   * so the button is guaranteed visible when returning to this screen/tab,
   * even if the list was scrolled down and the button was hidden by scroll.
   */
  const prevHiddenRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    // First call — initialise without animation.
    if (prevHiddenRef.current === undefined) {
      prevHiddenRef.current = externalHidden;
      if (externalHidden) {
        // Snap to hidden on mount — no animation needed.
        opacity.value    = 0;
        translateY.value = translateYOffset;
      }
      return;
    }

    // Only react to actual value changes.
    if (prevHiddenRef.current === externalHidden) return;
    prevHiddenRef.current = externalHidden;

    if (externalHidden) {
      if (hiddenTransition === 'instant') {
        cancelScheduledShow();
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        opacity.value    = 0;
        translateY.value = translateYOffset;
      } else {
        hide();
      }
    } else {
      // Reset scroll state so the button is always shown when re-entering,
      // regardless of where the list was scrolled.
      scrollY.value         = 0;
      isScrolling.value     = false;
      scrollDirection.value = 0;
      cancelScheduledShow();

      if (hiddenTransition === 'instant') {
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        opacity.value    = 1;
        translateY.value = 0;
      } else {
        show();
      }
    }
  }, [
    externalHidden,
    hiddenTransition,
    hide,
    show,
    cancelScheduledShow,
    opacity,
    translateY,
    translateYOffset,
    scrollY,
    isScrolling,
    scrollDirection,
  ]);

  // ---------------------------------------------------------------------------
  // Очистка при анмаунте / Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Animated-стиль / Animated style
  // ---------------------------------------------------------------------------

  /**
   * RU: Стиль для <Animated.View> — обёртки кнопки.
   *     Работает на UI-потоке, не вызывает JS re-render.
   *
   * EN: Style for the <Animated.View> button wrapper.
   *     Runs on the UI thread, no JS re-renders.
   */
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return {
    scrollY,
    scrollDirection,
    isScrolling,
    animatedStyle,
    show,
    hide,
  };
}
