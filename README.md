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
  - [FlashList integration](#flashlist-integration)
- [Props](#props)
- [Ref API](#ref-api)
- [Animation Config](#animation-config)
- [Scroll Behaviour](#scroll-behaviour)
- [Hidden Transition](#hidden-transition)
- [useFloatingInsets — Tab Bar Helper](#usefloatinginsets--tab-bar-helper)
- [Examples](#examples)
- [File Structure](#file-structure)

---

## Installation

```bash
# The module is local — connect via workspaces or a relative path.
"dependencies": {
  "rn-floating-button": "workspace:*"
}
```

**Peer dependencies** (must already be installed):

```
react-native-reanimated >= 3.0.0
react-native-safe-area-context >= 4.0.0

# Optional — only required for FlashList integration
@shopify/flash-list >= 1.0.0
```

> Safe area is handled automatically — the button won't be covered by the iPhone home indicator.

---

## Quick Start

```tsx
import { FloatingButton, FloatingButtonFlatList } from 'rn-floating-button';

export function SpecialtiesScreen() {
  return (
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 24 }}
      button={<ConfirmButton onPress={handleConfirm} />}
    >
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
1. User scrolls → wrapper updates `SharedValue<scrollY>` on the **UI thread**
2. `useAnimatedReaction` reacts to `scrollY` — also on the **UI thread**
3. Scroll **down** → opacity + translateY animate to hidden state (150 ms)
4. Scroll **up** → debounce timer (350 ms), then button reappears; `isScrolling` and `scrollDirection` reset
5. Zero extra JS re-renders during scrolling

---

## Components

### FloatingButton

Main provider component. Creates the context, positions the button absolutely on top of content.

```tsx
<FloatingButton
  horizontalPosition="center"      // 'left' | 'center' | 'right'   (default: 'right')
  scrollBehaviour="hide"           // 'hide' | 'none'                (default: 'hide')
  hiddenTransition="animated"      // 'animated' | 'instant'         (default: 'animated')
  insets={{ bottom: 24, horizontal: 24 }}
  animationConfig={{ showDelay: 400 }}
  buttonStyle={{ width: 220 }}     // constrains the inner button wrapper
  hidden={false}
  style={{ /* extra Animated.View styles */ }}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

### FloatingButtonScrollView

Drop-in replacement for `ScrollView`. All props forwarded unchanged.

```tsx
<FloatingButtonScrollView contentContainerStyle={{ padding: 16 }}>
  <Content />
</FloatingButtonScrollView>
```

---

### FloatingButtonFlatList

Drop-in replacement for `FlatList`. Supports generic data types.

```tsx
<FloatingButtonFlatList<Item>
  data={items}
  renderItem={({ item }) => <Row item={item} />}
  keyExtractor={(item) => item.id}
/>
```

---

### FloatingButtonSectionList

Drop-in replacement for `SectionList`. Supports generic types `<ItemT, SectionT>`.

```tsx
<FloatingButtonSectionList<City, Region>
  sections={regions}
  renderItem={({ item }) => <CityRow city={item} />}
  renderSectionHeader={({ section }) => <Header title={section.title} />}
  keyExtractor={(item) => item.id}
/>
```

---

### FlashList integration

`@shopify/flash-list` is an optional peer dependency — it is never imported at module
level so builds without it are unaffected.

**Option A — `createFloatingList` factory (recommended, full type safety)**

```tsx
import { FlashList } from '@shopify/flash-list';
import { createFloatingList } from 'rn-floating-button';
// or: import { createFloatingList } from 'rn-floating-button/flash-list';

// Create once, outside the component.
const FloatingFlashList = createFloatingList(FlashList);

export function CatalogScreen() {
  return (
    <FloatingButton button={<ConfirmButton onPress={handleConfirm} />}>
      <FloatingFlashList
        data={items}
        renderItem={({ item }) => <Row item={item} />}
        estimatedItemSize={72}   // full FlashList autocomplete preserved
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </FloatingButton>
  );
}
```

**Option B — `FloatingButtonFlashList` convenience component**

No setup step, but props are typed as `[key: string]: unknown` so autocomplete is limited.

```tsx
import { FlashList } from '@shopify/flash-list';
import { FloatingButtonFlashList } from 'rn-floating-button';

<FloatingButtonFlashList
  ListComponent={FlashList}
  data={items}
  renderItem={({ item }) => <Row item={item} />}
  estimatedItemSize={72}
/>
```

**Sub-path import**

```tsx
import { FloatingButtonFlashList, createFloatingList } from 'rn-floating-button/flash-list';
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Screen content. Rendered in normal flow, not animated. |
| `button` | `ReactNode` | — | The floating button. Rendered inside `Animated.View` — receives opacity + translateY animation. |
| `horizontalPosition` | `'left' \| 'center' \| 'right'` | `'right'` | Horizontal alignment. |
| `scrollBehaviour` | `'hide' \| 'none'` | `'hide'` | Whether the button hides on scroll down or stays always visible. |
| `hiddenTransition` | `'animated' \| 'instant'` | `'animated'` | How the button appears/disappears when the `hidden` prop changes. |
| `insets` | `FloatingButtonInsets` | `{ bottom: 24, horizontal: 24 }` | Edge offsets from the screen. |
| `animationConfig` | `FloatingButtonAnimationConfig` | see below | Animation timing settings. |
| `buttonStyle` | `StyleProp<ViewStyle>` | — | Styles for the inner `View` wrapping `button`. Use `{ width: 220 }` to prevent a full-width button from stretching. |
| `hidden` | `boolean` | `false` | Programmatically hide the button. |
| `style` | `StyleProp<ViewStyle>` | — | Extra styles for the outer `Animated.View` container. |

### FloatingButtonInsets

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bottom` | `number` | `24` | Bottom offset in pixels (safe area is added on top). |
| `horizontal` | `number` | `24` | Offset from the left or right edge. |

---

## Ref API

```tsx
import { useRef } from 'react';
import { FloatingButton, type FloatingButtonRef } from 'rn-floating-button';

const ref = useRef<FloatingButtonRef>(null);
ref.current?.show();
ref.current?.hide();

<FloatingButton ref={ref} button={<ConfirmButton onPress={handleConfirm} />}>
  ...
</FloatingButton>
```

| Method | Description |
|--------|-------------|
| `show()` | Show the button immediately (no debounce). |
| `hide()` | Hide the button immediately. |

---

## Animation Config

```tsx
<FloatingButton
  animationConfig={{
    showDelay: 350,       // ms after scroll stops before appearing
    showDuration: 250,    // ms for the show animation
    hideDuration: 150,    // ms for the hide animation
    translateYOffset: 24, // px the button slides down when hiding
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

| Value | Description |
|-------|-------------|
| `'hide'` | **(default)** Hides on scroll down, reappears on scroll up after the debounce delay. |
| `'none'` | Always visible. Scroll tracking still runs so `scrollY`, `isScrolling`, `scrollDirection` in context remain accurate. |

```tsx
<FloatingButton scrollBehaviour="none" button={<ConfirmButton onPress={handleConfirm} />}>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

## Hidden Transition

Controls the animation when the `hidden` prop changes (e.g. switching tabs).

| Value | Description |
|-------|-------------|
| `'animated'` | **(default)** Button fades + slides in/out using `withTiming`. |
| `'instant'` | Opacity and translateY snap immediately — no animation. Use when switching tabs to avoid visual delay layered on top of the navigation transition. On show, `scrollY` is also reset to `0` so the button is always visible when returning to a scrolled screen. |

```tsx
// Tab A — button animates on normal hide/show
<FloatingButton hiddenTransition="animated" hidden={!isTabA} button={...}>
  ...
</FloatingButton>

// Tab B — instant snap, no animation delay during tab switch
<FloatingButton hiddenTransition="instant" hidden={!isTabB} button={...}>
  ...
</FloatingButton>
```

---

## useFloatingInsets — Tab Bar Helper

Calculates the correct `bottom` inset so the button sits above the tab bar.
Safe area is **not** double-counted — `FloatingButton` handles it internally.

```tsx
import { useFloatingInsets } from 'rn-floating-button';

const insets = useFloatingInsets({ tabBarHeight: 52 });

<FloatingButton insets={insets} button={<ConfirmButton onPress={handleConfirm} />}>
  ...
</FloatingButton>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tabBarHeight` | `number` | — | Tab bar height in pixels. |
| `extraBottom` | `number` | `16` | Gap between the button and the top of the tab bar. |
| `horizontal` | `number` | — | Horizontal inset (optional). |

---

## Examples

### FlatList — basic

```tsx
<FloatingButton
  horizontalPosition="center"
  insets={{ bottom: 24 }}
  button={<ConfirmButton onPress={handleConfirm} disabled={!selected} />}
>
  <FloatingButtonFlatList<Item>
    data={items}
    renderItem={({ item }) => <Row item={item} onPress={() => setSelected(item.id)} />}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{ paddingBottom: 100 }}
  />
</FloatingButton>
```

---

### FlashList — createFloatingList

```tsx
import { FlashList } from '@shopify/flash-list';
import { createFloatingList } from 'rn-floating-button/flash-list';

const FloatingFlashList = createFloatingList(FlashList);

<FloatingButton button={<ConfirmButton onPress={handleConfirm} />}>
  <FloatingFlashList
    data={items}
    renderItem={({ item }) => <Row item={item} />}
    estimatedItemSize={72}
    contentContainerStyle={{ paddingBottom: 100 }}
  />
</FloatingButton>
```

---

### Always-visible button

```tsx
<FloatingButton
  scrollBehaviour="none"
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList data={items} renderItem={...} keyExtractor={...} />
</FloatingButton>
```

---

### Tab switching — instant transition + scrollY reset

```tsx
export function MyTabScreen({ isActive }: { isActive: boolean }) {
  return (
    <FloatingButton
      hidden={!isActive}
      hiddenTransition="instant"   // no animation delay during tab switch;
                                   // scrollY resets on show so button is always visible
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      <FloatingButtonFlatList data={items} renderItem={...} keyExtractor={...} />
    </FloatingButton>
  );
}
```

---

### buttonStyle — constrain button width

```tsx
// Without buttonStyle a full-width button stretches across the entire screen.
<FloatingButton
  horizontalPosition="center"
  buttonStyle={{ width: 220 }}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  ...
</FloatingButton>
```

---

### Button above tab bar

```tsx
const insets = useFloatingInsets({ tabBarHeight: 52 });

<FloatingButton insets={insets} button={<ConfirmButton onPress={handleConfirm} />}>
  <FloatingButtonFlatList data={items} renderItem={...} keyExtractor={...} />
</FloatingButton>
```

---

### Programmatic control via ref

```tsx
const ref = useRef<FloatingButtonRef>(null);

<FloatingButton ref={ref} button={<ConfirmButton onPress={handleConfirm} />}>
  <FloatingButtonFlatList
    data={items}
    renderItem={({ item }) => (
      <Row
        item={item}
        onSelect={() => ref.current?.show()}
        onDeselect={() => ref.current?.hide()}
      />
    )}
    keyExtractor={(item) => item.id}
  />
</FloatingButton>
```

---

### With React Navigation

```tsx
import { useFocusEffect } from '@react-navigation/native';

const ref = useRef<FloatingButtonRef>(null);

useFocusEffect(
  useCallback(() => {
    ref.current?.show();
    return () => ref.current?.hide();
  }, []),
);
```

---

## File Structure

```
rn-floating-button/
├── package.json
└── src/
    ├── index.ts                      # Public barrel export
    ├── flash-list.ts                 # Sub-path export (rn-floating-button/flash-list)
    ├── types.ts                      # All types and interfaces
    ├── FloatingButtonContext.ts      # React Context + useFloatingButtonContext
    ├── useScrollHide.ts              # Reanimated animation logic
    ├── useFloatingInsets.ts          # Tab bar insets helper
    ├── FloatingButton.tsx            # Provider + positioned Animated.View
    ├── FloatingButtonScrollView.tsx  # ScrollView wrapper
    ├── FloatingButtonFlatList.tsx    # FlatList wrapper
    ├── FloatingButtonSectionList.tsx # SectionList wrapper
    └── FloatingButtonFlashList.tsx   # FlashList wrapper + createFloatingList factory
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
  createFloatingList,

  // Hooks
  useFloatingInsets,
  useFloatingButtonContext,
  useScrollHide,

  // Types
  type FloatingButtonRef,
  type FloatingButtonProps,
  type FloatingButtonAnimationConfig,
  type FloatingButtonScrollBehaviour,
  type FloatingButtonHiddenTransition,
  type FloatingButtonHorizontalPosition,
  type FloatingButtonInsets,
  type FloatingButtonFlashListProps,
  type UseFloatingInsetsOptions,
  type UseFloatingInsetsResult,
} from 'rn-floating-button';

// FlashList-only sub-path (keeps @shopify/flash-list optional)
import { createFloatingList, FloatingButtonFlashList } from 'rn-floating-button/flash-list';
```

---

## Important Notes

- All scroll wrappers **must** be nested inside `<FloatingButton>` — a descriptive error is thrown in dev mode otherwise.
- Add enough `paddingBottom` in `contentContainerStyle` so the last item isn't covered by the button.
- Safe area is handled automatically — no need to call `useSafeAreaInsets` separately.
- The button does not block scroll (`pointerEvents="box-none"` on the outer container).
- `isScrolling` and `scrollDirection` reset to `false` / `0` after scroll stops, in both `'hide'` and `'none'` modes.
- `scrollBehaviour` and `hiddenTransition` can be changed at runtime.
- `hiddenTransition="instant"` resets `scrollY` to `0` on show, guaranteeing the button is always visible when switching back to a scrolled screen.
