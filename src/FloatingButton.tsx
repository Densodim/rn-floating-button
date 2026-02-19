/**
 * FloatingButton.tsx
 *
 * Main provider component. Wraps the screen, creates FloatingButtonContext,
 * and renders the floating button inside an absolutely positioned Animated.View.
 *
 * Accepts TWO separate props:
 *   children — screen content (list / scroll), rendered in normal flow
 *   button   — the floating button, rendered inside <Animated.View position="absolute">
 *              and receives opacity + translateY animation
 *
 * Usage:
 *   <FloatingButton
 *     horizontalPosition="center"
 *     button={<ConfirmButton onPress={handleConfirm} />}
 *   >
 *     <FloatingButtonFlatList<MyItem>
 *       data={items}
 *       renderItem={({ item }) => <ItemRow item={item} />}
 *       keyExtractor={(item) => item.id}
 *     />
 *   </FloatingButton>
 */

import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingButtonContext } from './FloatingButtonContext';
import { useScrollHide } from './useScrollHide';
import type { FloatingButtonProps, FloatingButtonRef } from './types';

// ---------------------------------------------------------------------------
// Default insets
// ---------------------------------------------------------------------------

const DEFAULT_BOTTOM     = 24; // px
const DEFAULT_HORIZONTAL = 24; // px

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Main provider component.
 *
 * Accepts a ref of type FloatingButtonRef for programmatic control:
 *   const ref = useRef<FloatingButtonRef>(null);
 *   ref.current?.hide();
 *   ref.current?.show();
 */
export const FloatingButton = forwardRef<FloatingButtonRef, FloatingButtonProps>(
  (props, ref) => {
    const {
      children,
      button,
      horizontalPosition = 'right',
      insets,
      animationConfig,
      style,
      buttonStyle,
      hidden = false,
      scrollBehaviour  = 'hide',
      hiddenTransition = 'animated',
    } = props;

    const bottom     = insets?.bottom     ?? DEFAULT_BOTTOM;
    const horizontal = insets?.horizontal ?? DEFAULT_HORIZONTAL;

    // Safe area insets (notch, home indicator etc.)
    const safeArea = useSafeAreaInsets();

    // ---------------------------------------------------------------------------
    // Animation logic
    // ---------------------------------------------------------------------------

    const { scrollY, scrollDirection, isScrolling, animatedStyle, show, hide } =
      useScrollHide(animationConfig, hidden, scrollBehaviour, hiddenTransition);

    // ---------------------------------------------------------------------------
    // Ref API
    // ---------------------------------------------------------------------------

    useImperativeHandle(ref, () => ({ show, hide }), [show, hide]);

    // ---------------------------------------------------------------------------
    // Context
    // ---------------------------------------------------------------------------

    /**
     * Memoize context value — shared values are stable references,
     * so this memo practically never re-runs.
     */
    const contextValue = useMemo(
      () => ({ scrollY, scrollDirection, isScrolling }),
      [scrollY, scrollDirection, isScrolling],
    );

    // ---------------------------------------------------------------------------
    // Positioning
    // ---------------------------------------------------------------------------

    /**
     * Compute absolute position style based on horizontalPosition and insets.
     * Safe area bottom (home indicator on iPhone) is added to the bottom offset.
     */
    const positionStyle = useMemo(() => {
      const base = { bottom: bottom + safeArea.bottom };
      switch (horizontalPosition) {
        case 'left':   return { ...base, left: horizontal };
        case 'center': return { ...base, alignSelf: 'center' as const };
        case 'right':
        default:       return { ...base, right: horizontal };
      }
    }, [horizontalPosition, bottom, horizontal, safeArea.bottom]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
      <FloatingButtonContext.Provider value={contextValue}>

        {/*
          children — screen content (FloatingButtonFlatList etc.).
          Rendered in normal flow, takes up all available space.
          Not animated — only `button` below receives animation.
        */}
        {children}

        {/*
          Animated.View — absolutely positioned button container.
          animatedStyle (from useScrollHide) drives opacity and translateY.

          pointerEvents layers:
            Animated.View (box-none) — transparent to touches, doesn't block scroll
            inner View (auto)        — captures button touches

          Without these two layers either the button won't respond to taps,
          or it will block scroll across its entire bounding box.
        */}
        <Animated.View
          style={[styles.container, positionStyle, animatedStyle, style]}
          pointerEvents="box-none"
        >
          {/*
            View with pointerEvents="auto" — the only layer that captures touches.
            buttonStyle allows constraining width (e.g. a fullWidth button would
            otherwise stretch to fill the entire Animated.View bounding box).
          */}
          <View pointerEvents="auto" style={buttonStyle}>
            {button}
          </View>
        </Animated.View>

      </FloatingButtonContext.Provider>
    );
  },
);

FloatingButton.displayName = 'FloatingButton';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    // Button always sits on top of all other screen content.
    position: 'absolute',
    // High enough to be above standard elements but below modals (zIndex 1000+).
    zIndex: 100,
  },
});
