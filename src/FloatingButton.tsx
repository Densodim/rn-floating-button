/**
 * FloatingButton.tsx
 *
 * RU: Основной компонент модуля. Состоит из двух частей:
 *
 *   1. FloatingButton  — провайдер + позиционированный контейнер кнопки.
 *      Создаёт shared values через useScrollHide, кладёт их в контекст.
 *      Принимает ДВА отдельных пропа:
 *        - children  — контент экрана (список/скролл), рендерится в обычном потоке
 *        - button    — парящая кнопка, рендерится ВНУТРИ <Animated.View position="absolute">
 *                      и получает анимацию opacity + translateY
 *
 *   2. FloatingButtonScrollView / FlatList / SectionList — тонкие обёртки над
 *      стандартными scroll-компонентами. Читают scrollY из контекста и обновляют
 *      его при каждом событии скролла. Пробрасывают все остальные пропы без изменений.
 *
 * EN: Main module component. Consists of two parts:
 *
 *   1. FloatingButton  — provider + positioned button container.
 *      Creates shared values via useScrollHide, puts them into context.
 *      Accepts TWO separate props:
 *        - children  — screen content (list/scroll), rendered in normal flow
 *        - button    — the floating button, rendered INSIDE <Animated.View position="absolute">
 *                      and receives opacity + translateY animation
 *
 *   2. FloatingButtonScrollView / FlatList / SectionList — thin wrappers over
 *      standard scroll components. Read scrollY from context and update it
 *      on every scroll event. Forward all other props unchanged.
 *
 * Использование / Usage:
 *
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

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  FlatList,
  FlatListProps,
  SectionList,
  SectionListProps,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FloatingButtonContext,
  useFloatingButtonContext,
} from './FloatingButtonContext';
import { useScrollHide } from './useScrollHide';
import type {
  FloatingButtonProps,
  FloatingButtonRef,
} from './types';

// ---------------------------------------------------------------------------
// Дефолтные отступы / Default insets
// ---------------------------------------------------------------------------

const DEFAULT_BOTTOM = 24;
const DEFAULT_HORIZONTAL = 24;

// ---------------------------------------------------------------------------
// FloatingButton
// ---------------------------------------------------------------------------

/**
 * RU: Основной компонент-провайдер.
 *
 *     Принимает ref типа FloatingButtonRef для программного управления:
 *       const ref = useRef<FloatingButtonRef>(null);
 *       ref.current?.hide();
 *       ref.current?.show();
 *
 * EN: Main provider component.
 *
 *     Accepts a ref of type FloatingButtonRef for programmatic control:
 *       const ref = useRef<FloatingButtonRef>(null);
 *       ref.current?.hide();
 *       ref.current?.show();
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
      hidden = false,
      scrollBehaviour = 'hide',
    } = props;

    // RU: Отступы от краёв / EN: Edge insets
    const bottom = insets?.bottom ?? DEFAULT_BOTTOM;
    const horizontal = insets?.horizontal ?? DEFAULT_HORIZONTAL;

    // RU: Отступы safe area (notch, home indicator и т.д.)
    // EN: Safe area insets (notch, home indicator etc.)
    const safeArea = useSafeAreaInsets();

    // ---------------------------------------------------------------------------
    // Логика анимации / Animation logic
    // ---------------------------------------------------------------------------

    const { scrollY, scrollDirection, isScrolling, animatedStyle, show, hide } =
      useScrollHide(animationConfig, hidden, scrollBehaviour);

    // ---------------------------------------------------------------------------
    // Ref API
    // ---------------------------------------------------------------------------

    useImperativeHandle(
      ref,
      () => ({ show, hide }),
      [show, hide],
    );

    // ---------------------------------------------------------------------------
    // Контекст / Context
    // ---------------------------------------------------------------------------

    /**
     * RU: Мемоизируем значение контекста — пересоздаём только при смене
     *     shared values (чего на практике не происходит, т.к. они стабильны).
     *
     * EN: Memoize context value — only recreated when shared values change
     *     (which in practice never happens as they are stable references).
     */
    const contextValue = useMemo(
      () => ({ scrollY, scrollDirection, isScrolling }),
      [scrollY, scrollDirection, isScrolling],
    );

    // ---------------------------------------------------------------------------
    // Позиционирование / Positioning
    // ---------------------------------------------------------------------------

    /**
     * RU: Вычисляем стиль позиционирования в зависимости от
     *     horizontalPosition и отступов.
     *
     * EN: Compute positioning style based on
     *     horizontalPosition and insets.
     */
    const positionStyle = useMemo(() => {
      const base = {
        // RU: Учитываем safe area снизу (home indicator на iPhone)
        // EN: Account for safe area at the bottom (home indicator on iPhone)
        bottom: bottom + safeArea.bottom,
      };

      switch (horizontalPosition) {
        case 'left':
          return { ...base, left: horizontal };
        case 'center':
          return { ...base, alignSelf: 'center' as const };
        case 'right':
        default:
          return { ...base, right: horizontal };
      }
    }, [horizontalPosition, bottom, horizontal, safeArea.bottom]);

    // ---------------------------------------------------------------------------
    // Рендер / Render
    // ---------------------------------------------------------------------------

    return (
      <FloatingButtonContext.Provider value={contextValue}>

        {/*
          RU: children — контент экрана (FloatingButtonFlatList и т.д.).
              Рендерится в обычном потоке, занимает всё пространство.
              Анимации не получает — анимируется только `button` ниже.

          EN: children — screen content (FloatingButtonFlatList etc.).
              Rendered in normal flow, takes up all available space.
              Not animated — only `button` below receives animation.
        */}
        {children}

        {/*
          RU: Animated.View — абсолютно позиционированный контейнер кнопки.
              animatedStyle (из useScrollHide) управляет opacity и translateY.

              Слои pointerEvents:
              - Animated.View (box-none)  — прозрачен для касаний, не блокирует скролл
              - View внутри (auto)        — перехватывает касания кнопки

              Без этих двух слоёв либо кнопка не нажимается,
              либо блокирует скролл по всей своей bbox.

          EN: Animated.View — absolutely positioned button container.
              animatedStyle (from useScrollHide) drives opacity and translateY.

              pointerEvents layers:
              - Animated.View (box-none)  — transparent to touches, doesn't block scroll
              - inner View (auto)         — captures button touches

              Without these two layers either the button won't respond to taps,
              or it will block scroll across its entire bounding box.
        */}
        <Animated.View
          style={[styles.container, positionStyle, animatedStyle, style]}
          pointerEvents="box-none"
        >
          {/*
            RU: View с pointerEvents="auto" — единственный слой, который
                перехватывает касания. Без него касания проваливались бы
                сквозь Animated.View (box-none) к списку под ним.

            EN: View with pointerEvents="auto" — the only layer that captures
                touches. Without it touches would fall through the
                Animated.View (box-none) to the list beneath.
          */}
          <View pointerEvents="auto">
            {button}
          </View>
        </Animated.View>

      </FloatingButtonContext.Provider>
    );
  },
);

FloatingButton.displayName = 'FloatingButton';

// ---------------------------------------------------------------------------
// FloatingButtonScrollView — обёртка над ScrollView
// ---------------------------------------------------------------------------

/**
 * RU: Обёртка над стандартным ScrollView.
 *     Автоматически подключает scroll-хендлер из контекста FloatingButton.
 *     Все пропы ScrollView работают как обычно.
 *
 * EN: Wrapper over the standard ScrollView.
 *     Automatically attaches the scroll handler from FloatingButton context.
 *     All ScrollView props work as usual.
 */
export function FloatingButtonScrollView(props: ScrollViewProps) {
  const { scrollY } = useFloatingButtonContext();

  return (
    <ScrollView
      {...props}
      scrollEventThrottle={16}
      onScroll={(event) => {
        // RU: Обновляем shared value на UI-потоке
        // EN: Update shared value on the UI thread
        scrollY.value = event.nativeEvent.contentOffset.y;
        // RU: Пробрасываем оригинальный обработчик если был передан
        // EN: Forward original handler if provided
        props.onScroll?.(event);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// FloatingButtonFlatList — обёртка над FlatList
// ---------------------------------------------------------------------------

/**
 * RU: Обёртка над FlatList с поддержкой generic-типа данных.
 *     Использование:
 *       <FloatingButtonFlatList<MyItem>
 *         data={items}
 *         renderItem={({ item }) => <Row item={item} />}
 *         keyExtractor={(item) => item.id}
 *       />
 *
 * EN: Wrapper over FlatList with generic data type support.
 *     Usage:
 *       <FloatingButtonFlatList<MyItem>
 *         data={items}
 *         renderItem={({ item }) => <Row item={item} />}
 *         keyExtractor={(item) => item.id}
 *       />
 */
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

// ---------------------------------------------------------------------------
// FloatingButtonSectionList — обёртка над SectionList
// ---------------------------------------------------------------------------

/**
 * RU: Обёртка над SectionList с поддержкой generic-типов.
 *
 * EN: Wrapper over SectionList with generic type support.
 */
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

// ---------------------------------------------------------------------------
// FloatingButtonFlashList — обёртка для @shopify/flash-list
// ---------------------------------------------------------------------------

/**
 * RU: Обёртка для FlashList из @shopify/flash-list.
 *
 *     FlashList — опциональная peer-зависимость, поэтому компонент
 *     принимается снаружи через проп `ListComponent`. Это позволяет
 *     не тянуть @shopify/flash-list как прямую зависимость и не ломать
 *     сборку у тех, кто его не использует.
 *
 *     Использование / Usage:
 *       import { FlashList } from '@shopify/flash-list';
 *
 *       <FloatingButtonFlashList
 *         ListComponent={FlashList}
 *         data={items}
 *         renderItem={({ item }) => <Row item={item} />}
 *         keyExtractor={(item) => item.id}
 *         estimatedItemSize={72}
 *       />
 *
 * EN: Wrapper for FlashList from @shopify/flash-list.
 *
 *     FlashList is an optional peer dependency, so the component itself
 *     is passed in via the `ListComponent` prop. This avoids a direct
 *     dependency on @shopify/flash-list and won't break builds for users
 *     who don't use it.
 */

/**
 * RU: Минимальный интерфейс FlashList, который нам нужен для типизации.
 *     Не импортируем напрямую из @shopify/flash-list — она опциональная.
 *
 * EN: Minimal FlashList interface we need for typing.
 *     Not imported directly from @shopify/flash-list — it's optional.
 */
interface FlashListScrollEvent {
  nativeEvent: { contentOffset: { y: number } };
}

interface FlashListMinimalProps<T> {
  onScroll?: (event: FlashListScrollEvent) => void;
  scrollEventThrottle?: number;
  [key: string]: unknown;
  data?: ReadonlyArray<T> | null;
}

interface FlashListComponent<T> {
  new (props: FlashListMinimalProps<T>): React.Component<FlashListMinimalProps<T>>;
}

export interface FloatingButtonFlashListProps<T> extends Record<string, unknown> {
  /**
   * RU: Сам компонент FlashList, переданный снаружи.
   *     Благодаря этому @shopify/flash-list остаётся опциональной зависимостью.
   *
   * EN: The FlashList component passed from outside.
   *     This keeps @shopify/flash-list as an optional dependency.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ListComponent: React.ComponentType<any>;
  data?: ReadonlyArray<T> | null;
  onScroll?: (event: FlashListScrollEvent) => void;
}

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
      onScroll={(event: FlashListScrollEvent) => {
        // RU: Обновляем shared value — так же как в других обёртках
        // EN: Update shared value — same as other wrappers
        scrollY.value = event.nativeEvent.contentOffset.y;
        userOnScroll?.(event);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Стили / Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    /**
     * RU: Кнопка всегда находится поверх остального контента экрана.
     * EN: Button always sits on top of all other screen content.
     */
    position: 'absolute',
    /**
     * RU: zIndex достаточно высокий, чтобы перекрыть стандартные элементы,
     *     но не конфликтовать с модальными окнами (те имеют zIndex 1000+).
     * EN: zIndex high enough to be above standard elements
     *     but not conflict with modals (which use zIndex 1000+).
     */
    zIndex: 100,
  },
});
