/**
 * FloatingButtonFlatList.tsx
 *
 * Drop-in replacement for FlatList. Supports generic data types.
 * Reads scrollY from FloatingButtonContext and updates it on every scroll event.
 * All other FlatList props are forwarded unchanged.
 *
 * Usage:
 *   <FloatingButtonFlatList<MyItem>
 *     data={items}
 *     renderItem={({ item }) => <Row item={item} />}
 *     keyExtractor={(item) => item.id}
 *   />
 */

import React from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { useFloatingButtonContext } from './FloatingButtonContext';

export function FloatingButtonFlatList<T>(props: FlatListProps<T>) {
  const { scrollY } = useFloatingButtonContext();

  return (
    <FlatList<T>
      {...props}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
        props.onScroll?.(event);
      }}
    />
  );
}
