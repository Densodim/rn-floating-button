/**
 * FloatingButtonSectionList.tsx
 *
 * Drop-in replacement for SectionList. Supports generic types <ItemT, SectionT>.
 * Reads scrollY from FloatingButtonContext and updates it on every scroll event.
 * All other SectionList props are forwarded unchanged.
 */

import React from 'react';
import { SectionList, SectionListProps } from 'react-native';
import { useFloatingButtonContext } from './FloatingButtonContext';

export function FloatingButtonSectionList<ItemT, SectionT>(
  props: SectionListProps<ItemT, SectionT>,
) {
  const { scrollY } = useFloatingButtonContext();

  return (
    <SectionList<ItemT, SectionT>
      {...props}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
        props.onScroll?.(event);
      }}
    />
  );
}
