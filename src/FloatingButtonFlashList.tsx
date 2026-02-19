/**
 * FloatingButtonFlashList.tsx
 *
 * Two ways to integrate @shopify/flash-list (an optional peer dependency):
 *
 * 1. createFloatingList(FlashList) — factory function.
 *    Creates a fully typed wrapper component once and reuses it.
 *    Best option: preserves all FlashList props and autocomplete.
 *
 *    import { FlashList } from '@shopify/flash-list';
 *    const MyList = createFloatingList(FlashList);
 *    // <MyList data={...} estimatedItemSize={72} />
 *
 * 2. FloatingButtonFlashList — convenience component.
 *    Accepts a `ListComponent` prop so @shopify/flash-list is never
 *    imported at the module level (keeps it optional).
 *    Slightly less type-safe but requires no setup step.
 *
 *    import { FlashList } from '@shopify/flash-list';
 *    // <FloatingButtonFlashList ListComponent={FlashList} data={...} estimatedItemSize={72} />
 */

import React from 'react';
import { useFloatingButtonContext } from './FloatingButtonContext';

// ---------------------------------------------------------------------------
// Minimal scroll-event shape (avoids importing from @shopify/flash-list)
// ---------------------------------------------------------------------------

interface ScrollEventY {
  nativeEvent: { contentOffset: { y: number } };
}

// ---------------------------------------------------------------------------
// createFloatingList — factory
// ---------------------------------------------------------------------------

/**
 * Creates a fully typed FloatingButton-aware wrapper for any scroll component.
 *
 * The returned component intercepts `onScroll` and `scrollEventThrottle`
 * and forwards all other props with their original types intact.
 *
 * @example
 *   import { FlashList } from '@shopify/flash-list';
 *   const FloatingFlashList = createFloatingList(FlashList);
 *
 *   <FloatingFlashList
 *     data={items}
 *     renderItem={({ item }) => <Row item={item} />}
 *     estimatedItemSize={72}          // full FlashList autocomplete
 *   />
 */
export function createFloatingList<P extends {
  onScroll?: (event: ScrollEventY) => void;
  scrollEventThrottle?: number;
}>(
  ListComponent: React.ComponentType<P>,
): React.FC<Omit<P, 'scrollEventThrottle'>> {
  function FloatingList({
    onScroll: userOnScroll,
    ...rest
  }: Omit<P, 'scrollEventThrottle'>) {
    const { scrollY } = useFloatingButtonContext();

    return (
      <ListComponent
        {...(rest as unknown as P)}
        scrollEventThrottle={16}
        onScroll={(event: ScrollEventY) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
          userOnScroll?.(event);
        }}
      />
    );
  }

  FloatingList.displayName = `FloatingList(${
    ListComponent.displayName ?? ListComponent.name ?? 'Component'
  })`;

  return FloatingList;
}

// ---------------------------------------------------------------------------
// FloatingButtonFlashList — convenience component (ListComponent prop)
// ---------------------------------------------------------------------------

export interface FloatingButtonFlashListProps<T> {
  /**
   * The FlashList component passed from outside.
   * Keeps @shopify/flash-list as an optional peer dependency —
   * it is never imported at module level here.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ListComponent: React.ComponentType<any>;
  data?: ReadonlyArray<T> | null;
  onScroll?: (event: ScrollEventY) => void;
  [key: string]: unknown;
}

/**
 * Convenience wrapper. Prefer `createFloatingList` for full type safety.
 *
 * @example
 *   import { FlashList } from '@shopify/flash-list';
 *   <FloatingButtonFlashList
 *     ListComponent={FlashList}
 *     data={items}
 *     estimatedItemSize={72}
 *   />
 */
export function FloatingButtonFlashList<T>({
  ListComponent,
  onScroll: userOnScroll,
  ...rest
}: FloatingButtonFlashListProps<T>) {
  const { scrollY } = useFloatingButtonContext();

  return (
    <ListComponent
      {...rest}
      scrollEventThrottle={16}
      onScroll={(event: ScrollEventY) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
        userOnScroll?.(event);
      }}
    />
  );
}
