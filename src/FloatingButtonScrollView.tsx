/**
 * FloatingButtonScrollView.tsx
 *
 * Drop-in replacement for ScrollView.
 * Reads scrollY from FloatingButtonContext and updates it on every scroll event.
 * All other ScrollView props are forwarded unchanged.
 */

import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useFloatingButtonContext } from './FloatingButtonContext';

export function FloatingButtonScrollView(props: ScrollViewProps) {
  const { scrollY } = useFloatingButtonContext();

  return (
    <ScrollView
      {...props}
      scrollEventThrottle={16}
      onScroll={(event) => {
        // Update shared value on the UI thread — no bridge call.
        scrollY.value = event.nativeEvent.contentOffset.y;
        // Forward original handler if provided.
        props.onScroll?.(event);
      }}
    />
  );
}
