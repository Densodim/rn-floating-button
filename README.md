# rn-floating-button

Floating action button for React Native with automatic scroll-hide behaviour.
Built on `react-native-reanimated` — all animations run on the UI thread, no bridge, 60 fps.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Components](#components)
  - [FloatingButton](#floatingbutton)
  - [FloatingButtonScrollView](#floatingbuttonscrollview)
  - [FloatingButtonFlatList](#floatingbuttonflatlist)
  - [FloatingButtonSectionList](#floatingbuttonsectionlist)
  - [FloatingButtonFlashList](#floatingbuttonflashlist)
- [Props](#props)
- [Ref API](#ref-api)
- [Animation Config](#animation-config)
- [Scroll Behaviour](#scroll-behaviour)
- [useFloatingInsets — Tab Bar Helper](#usefloatinginsets--tab-bar-helper)
- [Examples](#examples)
  - [FlatList — basic](#flatlist--basic)
  - [FlashList](#flashlist)
  - [ScrollView — centered](#scrollview--centered)
  - [SectionList — left](#sectionlist--left)
  - [Always-visible button (scrollBehaviour none)](#always-visible-button-scrollbehaviour-none)
  - [Button above tab bar](#button-above-tab-bar)
  - [Programmatic control via ref](#programmatic-control-via-ref)
  - [Declarative hide via hidden prop](#declarative-hide-via-hidden-prop)
  - [Custom animation](#custom-animation)
  - [With React Navigation](#with-react-navigation)
- [File Structure](#file-structure)

---

## Installation

```bash
# The module is local — connect via workspaces or a relative path.

# In your app's package.json:
"dependencies": {
  "rn-floating-button": "workspace:*"
}
```

**Peer dependencies** (must already be installed):

```bash
react-native-reanimated >= 3.0.0
react-native-safe-area-context >= 4.0.0

# Optional — only required if you use FloatingButtonFlashList
@shopify/flash-list >= 1.0.0
```

> Safe area is handled automatically — the button won't be covered by the iPhone home indicator.

---

## Quick Start

```tsx
import { FloatingButton, FloatingButtonFlatList } from 'rn-floating-button';
import { ConfirmButton } from '@/shared/ui';

export function SpecialtiesScreen() {
  return (
    // FloatingButton accepts two separate props:
    //   children — screen content (list / scroll)
    //   button   — the floating button (rendered inside Animated.View)
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 24 }}
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      {/* Replace FlatList with FloatingButtonFlatList */}
      <FloatingButtonFlatList
        data={specialties}
        renderItem={({ item }) => <SpecialtyRow item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </FloatingButton>
  );
}
```

---

## How It Works

```
┌──────────────────────────────────────────────────┐
│  FloatingButton (Context.Provider)               │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  FloatingButtonFlatList                    │  │
│  │  (reads scrollY from context)              │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  <Animated.View position="absolute">             │
│    <YourButton />   ← floats on top              │
│  </Animated.View>                                │
└──────────────────────────────────────────────────┘
```

Data flow:
1. User scrolls → `FloatingButtonFlatList` updates `SharedValue<scrollY>` on the **UI thread**
2. `useAnimatedReaction` inside `useScrollHide` reacts to `scrollY` — also on the **UI thread**
3. Scroll **down** → `opacity` and `translateY` animate to hidden state (`withTiming`, 150 ms)
4. Scroll **up** → `runOnJS` triggers a debounce timer (350 ms), after which the button reappears; `isScrolling` and `scrollDirection` reset to idle
5. Zero extra JS re-renders during scrolling

---

## Components

### FloatingButton

Main component. Wraps the whole screen, creates the context, and renders the button on top.

```tsx
<FloatingButton
  horizontalPosition="center"              // 'left' | 'center' | 'right'  (default: 'right')
  scrollBehaviour="hide"                   // 'hide' | 'none'               (default: 'hide')
  insets={{ bottom: 24, horizontal: 24 }}
  animationConfig={{ showDelay: 400 }}
  hidden={false}
  style={{ /* extra container styles */ }}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

### FloatingButtonScrollView

Drop-in replacement for `ScrollView`. Automatically connects scroll tracking.

```tsx
// Before:
<ScrollView>...</ScrollView>

// After:
<FloatingButtonScrollView>...</FloatingButtonScrollView>
```

All `ScrollView` props work unchanged.

---

### FloatingButtonFlatList

Drop-in replacement for `FlatList`. Supports generic data types.

```tsx
// Before:
<FlatList<Specialty> data={items} renderItem={...} />

// After:
<FloatingButtonFlatList<Specialty> data={items} renderItem={...} />
```

---

### FloatingButtonSectionList

Drop-in replacement for `SectionList`. Supports generic types `<ItemT, SectionT>`.

```tsx
// Before:
<SectionList<City, Region> sections={data} renderItem={...} />

// After:
<FloatingButtonSectionList<City, Region> sections={data} renderItem={...} />
```

---

### FloatingButtonFlashList

Wrapper for `FlashList` from `@shopify/flash-list`.

`@shopify/flash-list` is an optional dependency — pass the component in via the `ListComponent` prop. This keeps `@shopify/flash-list` out of the direct dependency graph and won't break builds for users who don't install it.

```tsx
import { FlashList } from '@shopify/flash-list';
import { FloatingButton, FloatingButtonFlashList } from 'rn-floating-button';

<FloatingButton
  horizontalPosition="center"
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlashList
    ListComponent={FlashList}       // pass FlashList from outside
    data={items}
    renderItem={({ item }) => <Row item={item} />}
    keyExtractor={(item) => item.id}
    estimatedItemSize={72}          // required by FlashList
    contentContainerStyle={{ paddingBottom: 100 }}
  />
</FloatingButton>
```

All FlashList props are forwarded via `...rest` and work unchanged.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Screen content (list or scroll). Rendered in normal flow, not animated. |
| `button` | `ReactNode` | — | The floating button. Rendered inside `<Animated.View>` — receives opacity + translateY animation. |
| `horizontalPosition` | `'left' \| 'center' \| 'right'` | `'right'` | Horizontal alignment of the button. |
| `scrollBehaviour` | `'hide' \| 'none'` | `'hide'` | Whether the button hides on scroll down or stays always visible. |
| `insets` | `FloatingButtonInsets` | `{ bottom: 24, horizontal: 24 }` | Edge offsets from the screen. |
| `animationConfig` | `FloatingButtonAnimationConfig` | see below | Animation timing settings. |
| `hidden` | `boolean` | `false` | Programmatically hide the button regardless of scroll state. |
| `style` | `StyleProp<ViewStyle>` | — | Extra styles for the `Animated.View` container. |

### FloatingButtonInsets

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bottom` | `number` | `24` | Bottom offset in pixels (safe area is added on top). |
| `horizontal` | `number` | `24` | Offset from the left or right edge. |

---

## Ref API

Allows programmatic control from a parent component.

```tsx
import { useRef } from 'react';
import { FloatingButton, type FloatingButtonRef } from 'rn-floating-button';

const floatingRef = useRef<FloatingButtonRef>(null);

floatingRef.current?.hide();
floatingRef.current?.show();

<FloatingButton
  ref={floatingRef}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

| Method | Description |
|--------|-------------|
| `show()` | Show the button immediately (no debounce). |
| `hide()` | Hide the button immediately. |

---

## Animation Config

All fields are optional — only override what you pass.

```tsx
<FloatingButton
  animationConfig={{
    showDelay: 350,       // ms after scroll stops before the button appears
    showDuration: 250,    // ms for the show animation
    hideDuration: 150,    // ms for the hide animation
    translateYOffset: 24, // pixels the button slides down when hiding
  }}
>
```

| Option | Default | Description |
|--------|---------|-------------|
| `showDelay` | `350` ms | Delay before appearing after scroll stops. |
| `showDuration` | `250` ms | Duration of the show animation. |
| `hideDuration` | `150` ms | Duration of the hide animation. |
| `translateYOffset` | `24` px | Downward slide distance when hiding. |

---

## Scroll Behaviour

The `scrollBehaviour` prop controls how the button reacts to scroll events.

| Value | Description |
|-------|-------------|
| `'hide'` | **(default)** Button hides on scroll down and reappears on scroll up after the debounce delay. Fully driven by Reanimated on the UI thread. |
| `'none'` | Button is always visible regardless of scroll position. The scroll handler still runs, so `scrollY`, `isScrolling`, and `scrollDirection` in context remain accurate for custom use. |

```tsx
// Always-visible button — useful for simple screens or when
// you want to control visibility entirely via the `hidden` prop.
<FloatingButton
  scrollBehaviour="none"
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

> Switching `scrollBehaviour` at runtime is supported — the shared value is updated immediately on the UI thread via `useEffect`.

---

## useFloatingInsets — Tab Bar Helper

The most common integration question: "how far above the tab bar should the button sit?".
`useFloatingInsets` calculates the correct `bottom` inset automatically.

> Safe area is **not** double-counted — `FloatingButton` handles it internally.

```tsx
import { FloatingButton, FloatingButtonFlatList, useFloatingInsets } from 'rn-floating-button';

export function CatalogScreen() {
  // Pass tab bar height — the hook adds a default gap of 16 px on top
  const insets = useFloatingInsets({ tabBarHeight: 52 });

  return (
    <FloatingButton
      insets={insets}
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlatList data={items} renderItem={...} keyExtractor={...} />
    </FloatingButton>
  );
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tabBarHeight` | `number` | — | Tab bar height in pixels. |
| `extraBottom` | `number` | `16` | Gap between the button and the top of the tab bar. |
| `horizontal` | `number` | — | Horizontal inset (optional). |

```tsx
const insets = useFloatingInsets({
  tabBarHeight: 56,
  extraBottom: 8,
  horizontal: 16,
});
```

---

## Examples

### FlatList — basic

```tsx
import { FloatingButton, FloatingButtonFlatList } from 'rn-floating-button';

export function SpecialtiesScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 24 }}
      button={
        <ConfirmButton
          onPress={() => console.log('confirmed:', selected)}
          disabled={!selected}
        />
      }
    >
      <FloatingButtonFlatList<Specialty>
        data={specialties}
        renderItem={({ item }) => (
          <SpecialtyRow
            item={item}
            selected={selected === item.id}
            onPress={() => setSelected(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </FloatingButton>
  );
}
```

---

### FlashList

For projects using `@shopify/flash-list` (up to 10× faster than FlatList on large lists).

```tsx
import { FlashList } from '@shopify/flash-list';
import { FloatingButton, FloatingButtonFlashList } from 'rn-floating-button';

export function CatalogScreen() {
  return (
    <FloatingButton
      horizontalPosition="center"
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlashList
        ListComponent={FlashList}
        data={items}
        renderItem={({ item }) => <CatalogRow item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={72}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </FloatingButton>
  );
}
```

---

### ScrollView — centered

```tsx
import { FloatingButton, FloatingButtonScrollView } from 'rn-floating-button';

export function FormScreen() {
  return (
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 32 }}
      animationConfig={{ showDelay: 200 }}
      button={<SubmitButton onPress={handleSubmit} />}
    >
      <FloatingButtonScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <FormFields />
      </FloatingButtonScrollView>
    </FloatingButton>
  );
}
```

---

### SectionList — left

```tsx
import { FloatingButton, FloatingButtonSectionList } from 'rn-floating-button';

export function CitiesScreen() {
  return (
    <FloatingButton
      horizontalPosition="left"
      insets={{ bottom: 24, horizontal: 16 }}
      button={<FilterButton onPress={openFilters} />}
    >
      <FloatingButtonSectionList<City, Region>
        sections={regions}
        renderItem={({ item }) => <CityRow city={item} />}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
      />
    </FloatingButton>
  );
}
```

---

### Always-visible button (scrollBehaviour none)

Useful for simple screens or when you want to drive visibility entirely through the `hidden` prop or `ref`.

```tsx
<FloatingButton
  scrollBehaviour="none"
  horizontalPosition="center"
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList
    data={items}
    renderItem={...}
    keyExtractor={...}
    contentContainerStyle={{ paddingBottom: 100 }}
  />
</FloatingButton>
```

---

### Button above tab bar

```tsx
import { FloatingButton, FloatingButtonFlatList, useFloatingInsets } from 'rn-floating-button';

export function HomeScreen() {
  // expo-router and most navigators use ~49–56 px for the tab bar
  const insets = useFloatingInsets({ tabBarHeight: 52 });

  return (
    <FloatingButton
      horizontalPosition="center"
      insets={insets}
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlatList
        data={items}
        renderItem={...}
        keyExtractor={...}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </FloatingButton>
  );
}
```

---

### Programmatic control via ref

```tsx
import { useRef } from 'react';
import { FloatingButton, FloatingButtonFlatList, type FloatingButtonRef } from 'rn-floating-button';

export function SelectionScreen() {
  const floatingRef = useRef<FloatingButtonRef>(null);

  return (
    <FloatingButton
      ref={floatingRef}
      horizontalPosition="center"
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlatList
        data={items}
        renderItem={({ item }) => (
          <SelectableRow
            item={item}
            onSelect={() => floatingRef.current?.show()}
            onDeselect={() => floatingRef.current?.hide()}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </FloatingButton>
  );
}
```

---

### Declarative hide via hidden prop

```tsx
export function MultiSelectScreen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <FloatingButton
      horizontalPosition="center"
      hidden={selectedIds.size === 0}   // button visible only when something is selected
      insets={{ bottom: 24 }}
      button={<ConfirmButton onPress={handleConfirm} label={`Selected: ${selectedIds.size}`} />}
    >
      <FloatingButtonFlatList
        data={items}
        renderItem={({ item }) => (
          <CheckableRow
            item={item}
            checked={selectedIds.has(item.id)}
            onToggle={(id) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              });
            }}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </FloatingButton>
  );
}
```

---

### Custom animation

```tsx
<FloatingButton
  horizontalPosition="right"
  animationConfig={{
    showDelay: 500,       // wait longer after scroll stops
    showDuration: 400,    // slow appear
    hideDuration: 80,     // instant hide
    translateYOffset: 40, // slides further down
  }}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

### With React Navigation

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useRef, useCallback } from 'react';

export function CatalogScreen() {
  const floatingRef = useRef<FloatingButtonRef>(null);

  useFocusEffect(
    useCallback(() => {
      floatingRef.current?.show();
      return () => floatingRef.current?.hide();
    }, []),
  );

  return (
    <FloatingButton
      ref={floatingRef}
      horizontalPosition="center"
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlatList data={items} renderItem={...} keyExtractor={...} />
    </FloatingButton>
  );
}
```

---

## File Structure

```
rn-floating-button/
├── package.json
└── src/
    ├── index.ts                   # Public exports
    ├── types.ts                   # All types and interfaces
    ├── FloatingButtonContext.ts   # React Context + useFloatingButtonContext
    ├── useScrollHide.ts           # Reanimated animation logic
    ├── useFloatingInsets.ts       # Tab bar insets helper
    └── FloatingButton.tsx         # Components:
                                   #   FloatingButton
                                   #   FloatingButtonScrollView
                                   #   FloatingButtonFlatList
                                   #   FloatingButtonSectionList
                                   #   FloatingButtonFlashList
```

### Imports reference

```tsx
import {
  // Components
  FloatingButton,
  FloatingButtonScrollView,
  FloatingButtonFlatList,
  FloatingButtonSectionList,
  FloatingButtonFlashList,

  // Hooks
  useFloatingInsets,
  useFloatingButtonContext,
  useScrollHide,

  // Types
  type FloatingButtonRef,
  type FloatingButtonProps,
  type FloatingButtonAnimationConfig,
  type FloatingButtonScrollBehaviour,
  type FloatingButtonHorizontalPosition,
  type FloatingButtonInsets,
  type FloatingButtonFlashListProps,
  type UseFloatingInsetsOptions,
  type UseFloatingInsetsResult,
} from 'rn-floating-button';
```

---

## Important Notes

- All scroll wrapper components (`FloatingButtonScrollView`, `FlatList`, `SectionList`, `FlashList`) **must** be nested inside `<FloatingButton>` — a descriptive error is thrown in dev mode otherwise.
- Add enough `paddingBottom` in `contentContainerStyle` so the last list item isn't covered by the button.
- Safe area is handled automatically — no need to call `useSafeAreaInsets` separately.
- The button does not block scroll (`pointerEvents="box-none"` on the container).
- `isScrolling` and `scrollDirection` are correctly reset to `false` / `0` after scroll stops, in both `'hide'` and `'none'` modes.
- `scrollBehaviour` can be changed at runtime — the update propagates to the UI thread immediately.
