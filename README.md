# rn-floating-button

**RU:** Парящая кнопка для React Native с автоматическим скрытием при скролле.
Построена на `react-native-reanimated` — все анимации работают на UI-потоке, без bridge, 60fps.

**EN:** Floating action button for React Native with automatic scroll-hide behaviour.
Built on `react-native-reanimated` — all animations run on the UI thread, no bridge, 60fps.

---

## Содержание / Table of Contents

- [Установка / Installation](#установка--installation)
- [Быстрый старт / Quick Start](#быстрый-старт--quick-start)
- [Как это работает / How It Works](#как-это-работает--how-it-works)
- [Компоненты / Components](#компоненты--components)
  - [FloatingButton](#floatingbutton)
  - [FloatingButtonScrollView](#floatingbuttonscrollview)
  - [FloatingButtonFlatList](#floatingbuttonflatlist)
  - [FloatingButtonSectionList](#floatingbuttonsectionlist)
  - [FloatingButtonFlashList](#floatingbuttonflashlist)
- [Props](#props)
- [Ref API](#ref-api)
- [Конфигурация анимации / Animation Config](#конфигурация-анимации--animation-config)
- [useFloatingInsets — отступ над таб-баром](#usefloatinginsets--отступ-над-таб-баром)
- [Примеры / Examples](#примеры--examples)
  - [FlatList — базовый](#flatlist--базовый)
  - [FlashList — быстрый список](#flashlist--быстрый-список)
  - [ScrollView — по центру](#scrollview--по-центру)
  - [SectionList — слева](#sectionlist--слева)
  - [Кнопка над таб-баром](#кнопка-над-таб-баром)
  - [Программное управление через ref](#программное-управление-через-ref)
  - [Декларативное скрытие через hidden](#декларативное-скрытие-через-hidden)
  - [Кастомная анимация](#кастомная-анимация)
  - [С навигацией (React Navigation)](#с-навигацией-react-navigation)
- [Структура файлов / File Structure](#структура-файлов--file-structure)

---

## Установка / Installation

```bash
# RU: Модуль локальный — подключается через workspaces или относительный путь
# EN: The module is local — connect via workspaces or relative path

# package.json вашего приложения / your app's package.json:
"dependencies": {
  "rn-floating-button": "workspace:*"
}
```

**Peer dependencies** (должны быть уже установлены / must already be installed):

```bash
react-native-reanimated >= 3.0.0
react-native-safe-area-context >= 4.0.0

# RU: Опционально — только если используете FloatingButtonFlashList
# EN: Optional — only if you use FloatingButtonFlashList
@shopify/flash-list >= 1.0.0
```

> **RU:** Safe area учитывается автоматически — кнопка не перекрывается home indicator на iPhone.
> **EN:** Safe area is handled automatically — the button won't be covered by the iPhone home indicator.

---

## Быстрый старт / Quick Start

```tsx
import {
  FloatingButton,
  FloatingButtonFlatList,
} from 'rn-floating-button';
import { ConfirmButton } from '@/shared/ui';

export function SpecialtiesScreen() {
  const handleConfirm = () => {
    // RU: обработчик нажатия
    // EN: press handler
  };

  return (
    // RU: FloatingButton принимает два отдельных пропа:
    //     children — контент экрана (список/скролл)
    //     button   — парящая кнопка (рендерится внутри Animated.View)
    // EN: FloatingButton accepts two separate props:
    //     children — screen content (list/scroll)
    //     button   — floating button (rendered inside Animated.View)
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 24 }}
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      {/* RU: Список — заменяем FlatList на FloatingButtonFlatList */}
      {/* EN: List — replace FlatList with FloatingButtonFlatList   */}
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

## Как это работает / How It Works

```
┌──────────────────────────────────────────────────┐
│  FloatingButton (Context.Provider)               │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  FloatingButtonFlatList                    │  │
│  │  (читает scrollY из контекста)             │  │
│  │  (reads scrollY from context)              │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  <Animated.View position="absolute">             │
│    <YourButton />   ← парит поверх / floats     │
│  </Animated.View>                                │
└──────────────────────────────────────────────────┘
```

**RU:** Поток данных:
1. Пользователь скроллит → `FloatingButtonFlatList` обновляет `SharedValue<scrollY>` на **UI-потоке**
2. `useAnimatedReaction` в хуке `useScrollHide` реагирует на изменение `scrollY` — тоже на **UI-потоке**
3. При скролле **вниз** — `opacity` и `translateY` анимируются к скрытому состоянию (`withTiming`, 150мс)
4. При скролле **вверх** — через `runOnJS` вызывается debounce-таймер (350мс), после которого кнопка появляется; `isScrolling` и `scrollDirection` сбрасываются в idle
5. Нет ни одного лишнего JS re-render во время скролла

**EN:** Data flow:
1. User scrolls → `FloatingButtonFlatList` updates `SharedValue<scrollY>` on the **UI thread**
2. `useAnimatedReaction` inside `useScrollHide` reacts to `scrollY` change — also on the **UI thread**
3. On scroll **down** — `opacity` and `translateY` animate to hidden state (`withTiming`, 150ms)
4. On scroll **up** — `runOnJS` triggers a debounce timer (350ms), after which the button appears; `isScrolling` and `scrollDirection` are reset to idle
5. Zero extra JS re-renders during scrolling

---

## Компоненты / Components

### FloatingButton

**RU:** Главный компонент. Оборачивает весь экран, создаёт контекст, рендерит кнопку поверх содержимого.
**EN:** Main component. Wraps the whole screen, creates context, renders the button on top.

```tsx
<FloatingButton
  horizontalPosition="center"              // 'left' | 'center' | 'right'  (default: 'right')
  insets={{ bottom: 24, horizontal: 24 }}
  animationConfig={{ showDelay: 400 }}
  hidden={false}
  style={{ /* доп. стили контейнера / extra container styles */ }}
  button={<ConfirmButton onPress={handleConfirm} />}  // ← парящая кнопка
>
  {/* только список / only the list */}
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

### FloatingButtonScrollView

**RU:** Замена `ScrollView`. Автоматически подключает scroll-трекинг.
**EN:** Drop-in replacement for `ScrollView`. Automatically connects scroll tracking.

```tsx
// До / Before:
<ScrollView>...</ScrollView>

// После / After:
<FloatingButtonScrollView>...</FloatingButtonScrollView>
```

Все пропы `ScrollView` работают без изменений.
All `ScrollView` props work unchanged.

---

### FloatingButtonFlatList

**RU:** Замена `FlatList`. Поддерживает generic-тип данных.
**EN:** Drop-in replacement for `FlatList`. Supports generic data type.

```tsx
// До / Before:
<FlatList<Specialty> data={items} renderItem={...} />

// После / After:
<FloatingButtonFlatList<Specialty> data={items} renderItem={...} />
```

---

### FloatingButtonSectionList

**RU:** Замена `SectionList`. Поддерживает generic-типы `<ItemT, SectionT>`.
**EN:** Drop-in replacement for `SectionList`. Supports generic types `<ItemT, SectionT>`.

```tsx
// До / Before:
<SectionList<City, Region> sections={data} renderItem={...} />

// После / After:
<FloatingButtonSectionList<City, Region> sections={data} renderItem={...} />
```

---

### FloatingButtonFlashList

**RU:** Обёртка для `FlashList` из `@shopify/flash-list`.

`@shopify/flash-list` — опциональная зависимость, поэтому компонент передаётся снаружи через проп `ListComponent`. Это позволяет не тянуть пакет как прямую зависимость и не ломать сборку у тех, кто его не использует.

**EN:** Wrapper for `FlashList` from `@shopify/flash-list`.

`@shopify/flash-list` is an optional dependency — the component is passed in via the `ListComponent` prop. This avoids pulling the package as a direct dependency and won't break builds for users who don't use it.

```tsx
import { FlashList } from '@shopify/flash-list';
import { FloatingButton, FloatingButtonFlashList } from 'rn-floating-button';

<FloatingButton
  horizontalPosition="center"
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlashList
    ListComponent={FlashList}       // ← передаём FlashList снаружи
    data={items}
    renderItem={({ item }) => <Row item={item} />}
    keyExtractor={(item) => item.id}
    estimatedItemSize={72}          // ← обязательный проп FlashList
    contentContainerStyle={{ paddingBottom: 100 }}
  />
</FloatingButton>
```

> **RU:** Все пропы FlashList пробрасываются через `...rest` — работают без изменений.
> **EN:** All FlashList props are forwarded via `...rest` — work unchanged.

---

## Props

| Prop | Тип / Type | По умолчанию / Default | Описание |
|------|-----------|----------------------|----------|
| `children` | `ReactNode` | — | RU: Контент экрана — список или скролл. Рендерится в обычном потоке, анимации не получает. EN: Screen content — list or scroll. Rendered in normal flow, not animated. |
| `button` | `ReactNode` | — | RU: **Парящая кнопка.** Рендерится внутри `<Animated.View>` — получает анимацию opacity + translateY. EN: **The floating button.** Rendered inside `<Animated.View>` — receives opacity + translateY animation. |
| `horizontalPosition` | `'left' \| 'center' \| 'right'` | `'right'` | RU: Горизонтальное положение кнопки. EN: Horizontal alignment. |
| `insets` | `FloatingButtonInsets` | `{ bottom: 24, horizontal: 24 }` | RU: Отступы от краёв. EN: Edge offsets. |
| `animationConfig` | `FloatingButtonAnimationConfig` | см. ниже / see below | RU: Параметры анимации. EN: Animation settings. |
| `hidden` | `boolean` | `false` | RU: Программно скрыть кнопку. EN: Programmatically hide the button. |
| `style` | `StyleProp<ViewStyle>` | — | RU: Доп. стили `Animated.View`-контейнера кнопки. EN: Extra styles for the `Animated.View` button container. |

### FloatingButtonInsets

| Поле / Field | Тип / Type | По умолчанию / Default | Описание |
|-------------|-----------|----------------------|----------|
| `bottom` | `number` | `24` | RU: Отступ снизу в пикселях (+ safe area). EN: Bottom offset in pixels (+ safe area). |
| `horizontal` | `number` | `24` | RU: Отступ от левого или правого края. EN: Offset from left or right edge. |

---

## Ref API

**RU:** Позволяет управлять кнопкой программно из родительского компонента.
**EN:** Allows programmatic control from a parent component.

```tsx
import { useRef } from 'react';
import { FloatingButton, type FloatingButtonRef } from 'rn-floating-button';

const floatingRef = useRef<FloatingButtonRef>(null);

// Скрыть / Hide
floatingRef.current?.hide();

// Показать / Show
floatingRef.current?.show();

<FloatingButton
  ref={floatingRef}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

| Метод / Method | Описание |
|---------------|----------|
| `show()` | RU: Показать кнопку немедленно (без debounce). EN: Show the button immediately (no debounce). |
| `hide()` | RU: Скрыть кнопку немедленно. EN: Hide the button immediately. |

---

## Конфигурация анимации / Animation Config

**RU:** Все параметры опциональны — переопределяют только то, что передано.
**EN:** All fields are optional — only override what you pass.

```tsx
<FloatingButton
  animationConfig={{
    showDelay: 350,       // мс после остановки скролла перед появлением / ms after scroll stops before appearing
    showDuration: 250,    // мс анимации появления / ms of show animation
    hideDuration: 150,    // мс анимации скрытия / ms of hide animation
    translateYOffset: 24, // пикселей сдвига вниз при скрытии / pixels to slide down when hiding
  }}
>
```

| Параметр | По умолчанию / Default | Описание |
|---------|----------------------|----------|
| `showDelay` | `350` мс | RU: Задержка перед появлением после остановки скролла. EN: Delay before appearing after scroll stops. |
| `showDuration` | `250` мс | RU: Длительность анимации появления. EN: Show animation duration. |
| `hideDuration` | `150` мс | RU: Длительность анимации скрытия. EN: Hide animation duration. |
| `translateYOffset` | `24` px | RU: Сдвиг вниз при скрытии. EN: Downward slide distance when hiding. |

---

## useFloatingInsets — отступ над таб-баром

**RU:** Самый частый вопрос при интеграции: «на сколько поднять кнопку над таб-баром?».
Хук `useFloatingInsets` считает правильный `bottom`-отступ автоматически.

> Safe area НЕ дублируется — `FloatingButton` учитывает её сам.

**EN:** The most common integration question: "how far above the tab bar should the button sit?".
The `useFloatingInsets` hook calculates the correct `bottom` inset automatically.

> Safe area is NOT double-counted — `FloatingButton` handles it internally.

```tsx
import { FloatingButton, FloatingButtonFlatList, useFloatingInsets } from 'rn-floating-button';

export function CatalogScreen() {
  // RU: Передаём высоту таб-бара — хук сам добавит зазор (16px по умолчанию)
  // EN: Pass tab bar height — the hook adds a gap (16px by default)
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

### Параметры / Options

| Параметр | Тип / Type | По умолчанию / Default | Описание |
|---------|-----------|----------------------|----------|
| `tabBarHeight` | `number` | — | RU: Высота таб-бара в пикселях. EN: Tab bar height in pixels. |
| `extraBottom` | `number` | `16` | RU: Зазор между кнопкой и таб-баром. EN: Gap between the button and the tab bar. |
| `horizontal` | `number` | — | RU: Горизонтальный отступ (если нужен). EN: Horizontal inset (optional). |

```tsx
// RU: С кастомным зазором и горизонтальным отступом
// EN: With custom gap and horizontal inset
const insets = useFloatingInsets({
  tabBarHeight: 56,
  extraBottom: 8,
  horizontal: 16,
});
```

---

## Примеры / Examples

### FlatList — базовый

```tsx
import { FloatingButton, FloatingButtonFlatList } from 'rn-floating-button';
import { ConfirmButton } from '@/shared/ui';

interface Specialty {
  id: string;
  name: string;
}

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

### FlashList — быстрый список

**RU:** Для проектов, использующих `@shopify/flash-list` (в 10x быстрее FlatList на больших списках).
**EN:** For projects using `@shopify/flash-list` (up to 10x faster than FlatList on large lists).

```tsx
import { FlashList } from '@shopify/flash-list';
import { FloatingButton, FloatingButtonFlashList } from 'rn-floating-button';

export function CatalogScreen() {
  return (
    <FloatingButton
      horizontalPosition="center"
      button={<ConfirmButton onPress={handleConfirm} />}
    >
      {/*
        RU: ListComponent={FlashList} — передаём сам компонент снаружи,
            чтобы @shopify/flash-list оставался опциональной зависимостью.
        EN: ListComponent={FlashList} — pass the component from outside
            so @shopify/flash-list stays an optional dependency.
      */}
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

### ScrollView — по центру

```tsx
import { FloatingButton, FloatingButtonScrollView } from 'rn-floating-button';

export function FormScreen() {
  return (
    <FloatingButton
      horizontalPosition="center"
      insets={{ bottom: 32 }}
      animationConfig={{ showDelay: 200 }}
      button={<SubmitButton onPress={handleSubmit} label="Подтвердить" />}
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

### SectionList — слева

```tsx
import {
  FloatingButton,
  FloatingButtonSectionList,
} from 'rn-floating-button';

interface City { id: string; name: string; }
interface Region { title: string; data: City[]; }

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
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
      />
    </FloatingButton>
  );
}
```

---

### Кнопка над таб-баром

```tsx
import { FloatingButton, FloatingButtonFlatList, useFloatingInsets } from 'rn-floating-button';

export function HomeScreen() {
  // RU: expo-router и большинство навигаций используют высоту ~52-56px
  // EN: expo-router and most navigators use ~52-56px tab bar height
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

### Программное управление через ref

```tsx
import { useRef } from 'react';
import { FloatingButton, FloatingButtonFlatList, type FloatingButtonRef } from 'rn-floating-button';

export function SelectionScreen() {
  const floatingRef = useRef<FloatingButtonRef>(null);

  const handleSelect = (id: string) => {
    // RU: Принудительно показываем кнопку при выборе элемента
    // EN: Force-show the button when an item is selected
    floatingRef.current?.show();
  };

  const handleDeselect = () => {
    // RU: Скрываем если ничего не выбрано
    // EN: Hide if nothing is selected
    floatingRef.current?.hide();
  };

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
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </FloatingButton>
  );
}
```

---

### Декларативное скрытие через hidden

```tsx
// RU: Используется когда видимость определяется состоянием, а не скроллом.
// EN: Use when visibility is driven by state, not scroll.

export function MultiSelectScreen() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // RU: Кнопка видна только если что-то выбрано
  // EN: Button is visible only if something is selected
  const isButtonHidden = selectedIds.size === 0;

  return (
    <FloatingButton
      horizontalPosition="center"
      hidden={isButtonHidden}
      insets={{ bottom: 24 }}
      button={
        <ConfirmButton
          onPress={handleConfirm}
          label={`Выбрано: ${selectedIds.size}`}
        />
      }
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

### Кастомная анимация

```tsx
// RU: Более агрессивное скрытие и медленное появление
// EN: More aggressive hiding and slower appearance

<FloatingButton
  horizontalPosition="right"
  animationConfig={{
    showDelay: 500,       // RU: долго ждём остановки / EN: wait longer after stop
    showDuration: 400,    // RU: медленное появление / EN: slow appear
    hideDuration: 80,     // RU: мгновенное скрытие / EN: instant hide
    translateYOffset: 40, // RU: уезжает дальше / EN: slides further down
  }}
  button={<ConfirmButton onPress={handleConfirm} />}
>
  <FloatingButtonFlatList ... />
</FloatingButton>
```

---

### С навигацией (React Navigation)

```tsx
// RU: При переходе на другой экран — скрываем кнопку через useFocusEffect.
// EN: Hide the button on screen blur via useFocusEffect.

import { useFocusEffect } from '@react-navigation/native';
import { useRef, useCallback } from 'react';

export function CatalogScreen() {
  const floatingRef = useRef<FloatingButtonRef>(null);

  useFocusEffect(
    useCallback(() => {
      // RU: Показываем при фокусе на экране
      // EN: Show when screen is focused
      floatingRef.current?.show();

      return () => {
        // RU: Скрываем при уходе с экрана
        // EN: Hide when leaving the screen
        floatingRef.current?.hide();
      };
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

## Структура файлов / File Structure

```
rn-floating-button/
├── package.json
└── src/
    ├── index.ts                   # Публичный экспорт / Public exports
    ├── types.ts                   # Все типы и интерфейсы / All types & interfaces
    ├── FloatingButtonContext.ts   # React Context + useFloatingButtonContext
    ├── useScrollHide.ts           # Логика анимации (reanimated) / Animation logic
    ├── useFloatingInsets.ts       # Хелпер отступа над таб-баром / Tab bar insets helper
    └── FloatingButton.tsx         # Компоненты / Components:
                                   #   FloatingButton
                                   #   FloatingButtonScrollView
                                   #   FloatingButtonFlatList
                                   #   FloatingButtonSectionList
                                   #   FloatingButtonFlashList
```

### Что откуда импортировать / What to import from where

```tsx
import {
  // RU: Компоненты / EN: Components
  FloatingButton,
  FloatingButtonScrollView,
  FloatingButtonFlatList,
  FloatingButtonSectionList,
  FloatingButtonFlashList,      // ← для @shopify/flash-list

  // RU: Хуки / EN: Hooks
  useFloatingInsets,            // ← отступ над таб-баром / tab bar inset helper
  useFloatingButtonContext,     // для кастомного scroll-компонента
  useScrollHide,                // для полностью кастомной реализации

  // RU: Типы / EN: Types
  type FloatingButtonRef,
  type FloatingButtonProps,
  type FloatingButtonAnimationConfig,
  type FloatingButtonHorizontalPosition,
  type FloatingButtonInsets,
  type FloatingButtonFlashListProps,
  type UseFloatingInsetsOptions,
  type UseFloatingInsetsResult,
} from 'rn-floating-button';
```

---

## Важные замечания / Important Notes

**RU:**
- `FloatingButtonScrollView` / `FlatList` / `SectionList` / `FlashList` **обязаны** быть вложены внутрь `<FloatingButton>` — иначе будет понятная ошибка в dev-режиме.
- `contentContainerStyle` передавайте с `paddingBottom` достаточным для того, чтобы последний элемент списка не перекрывался кнопкой.
- Safe area учитывается автоматически — не нужно добавлять `useSafeAreaInsets` отдельно.
- Кнопка не мешает скроллу (`pointerEvents="box-none"` на контейнере).
- `isScrolling` и `scrollDirection` корректно сбрасываются в `false`/`0` после остановки скролла.

**EN:**
- `FloatingButtonScrollView` / `FlatList` / `SectionList` / `FlashList` **must** be nested inside `<FloatingButton>` — otherwise a descriptive error is thrown in dev mode.
- Pass `contentContainerStyle` with enough `paddingBottom` so the last list item isn't covered by the button.
- Safe area is handled automatically — no need to add `useSafeAreaInsets` separately.
- The button doesn't block scroll events (`pointerEvents="box-none"` on the container).
- `isScrolling` and `scrollDirection` are correctly reset to `false`/`0` after scroll stops.
