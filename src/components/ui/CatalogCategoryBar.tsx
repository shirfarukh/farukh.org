import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';
import { CategoryMeta } from './CategorySelector';

interface CatalogCategoryBarProps {
  selectedCategory: string; // 'All' or category id
  onSelectCategory: (category: string) => void;
  isPersian?: boolean;
  categoryCounts?: Record<string, number>;
}

export interface ExtendedCategoryMeta extends CategoryMeta {
  subtitle: string;
  faSubtitle: string;
  accentColor: string;
}

export const CATALOG_CATEGORIES: ExtendedCategoryMeta[] = [
  {
    id: 'All',
    label: 'All Courses',
    faLabel: 'همه دوره‌ها',
    icon: '🌟',
    subtitle: 'Entire Library',
    faSubtitle: 'تمام دوره‌ها',
    accentColor: '#F59E0B',
  },
  {
    id: 'AI & Tech',
    label: 'AI & Tech',
    faLabel: 'هوش مصنوعی',
    icon: '🤖',
    subtitle: 'Agents & Future',
    faSubtitle: 'عصر مدل‌های هوشمند',
    accentColor: '#3B82F6',
  },
  {
    id: 'Stocks & Crypto',
    label: 'Stocks & Crypto',
    faLabel: 'سهام و کریپتو',
    icon: '📈',
    subtitle: 'Markets & Trading',
    faSubtitle: 'معاملات و سرمایه‌گذاری',
    accentColor: '#10B981',
  },
  {
    id: 'Ecommerce',
    label: 'Ecommerce',
    faLabel: 'تجارت آنلاین',
    icon: '🛍️',
    subtitle: 'Stores & D2C',
    faSubtitle: 'فروشگاه و تجارت دیجیتال',
    accentColor: '#8B5CF6',
  },
  {
    id: 'Languages',
    label: 'Languages',
    faLabel: 'زبان‌های خارجه',
    icon: '🗣️',
    subtitle: 'Fluency & Global',
    faSubtitle: 'تسلط و مهارت بین‌المللی',
    accentColor: '#EC4899',
  },
  {
    id: 'Morals',
    label: 'Morals',
    faLabel: 'اصول و اخلاق',
    icon: '⚖️',
    subtitle: 'Ethics & Wisdom',
    faSubtitle: 'اخلاق و ارزش‌های فردی',
    accentColor: '#F97316',
  },
];

export const CatalogCategoryBar: React.FC<CatalogCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  isPersian = false,
  categoryCounts,
}) => {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, contentOffset.x / maxScroll)));
    }
  };

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollRight = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={{ marginBottom: 22 }}>
      {/* ── Header with Explanatory Title & Horizontal Scroll Affordance ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingHorizontal: 2,
        }}
      >
        <View className="flex-row items-center gap-2">
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            {isPersian ? 'دسته‌بندی‌های تخصصی' : 'Explore by Category'}
          </Text>
        </View>

        {/* Swipe Affordance Pill Indicator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark ? 'rgba(51, 65, 85, 0.4)' : '#F1F5F9',
            borderColor: colors.cardBorder,
            borderWidth: 1,
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.gold, fontWeight: '800' }}>
            ⟷
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.textSecondary,
            }}
          >
            {isPersian ? 'ورق بزنید' : 'Swipe horizontally'}
          </Text>
        </View>
      </View>

      {/* ── Big Horizontal Category Cards Rail ── */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 12,
        }}
      >
        {CATALOG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts ? categoryCounts[cat.id] : undefined;

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.85}
              style={{
                width: 152,
                minHeight: 118,
                borderRadius: 20,
                padding: 13,
                justifyContent: 'space-between',
                backgroundColor: isSelected
                  ? isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(245, 158, 11, 0.10)'
                  : colors.card,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.gold : colors.cardBorder,
                shadowColor: isSelected ? colors.gold : '#000',
                shadowOpacity: isSelected ? 0.35 : (isDark ? 0.18 : 0.06),
                shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                shadowRadius: isSelected ? 10 : 5,
                elevation: isSelected ? 5 : 2,
              }}
            >
              {/* Top Row: Icon Container + Count / Active Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                {/* Glowing Icon Container */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? colors.gold
                      : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.gold
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                </View>

                {/* Badge: Active Check or Course Count */}
                {isSelected ? (
                  <View
                    style={{
                      backgroundColor: colors.gold,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? '#0F172A' : '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      ✓ {isPersian ? 'فعال' : 'Active'}
                    </Text>
                  </View>
                ) : typeof count === 'number' ? (
                  <View
                    style={{
                      backgroundColor: isDark ? '#334155' : '#E2E8F0',
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {count} {isPersian ? 'دوره' : 'crs'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Bottom: Title & Subtitle */}
              <View>
                <Text
                  style={{
                    color: isSelected ? colors.gold : colors.text,
                    fontSize: 14,
                    fontWeight: '800',
                    lineHeight: 18,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {isPersian ? cat.faLabel : cat.label}
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '500',
                    lineHeight: 14,
                  }}
                  numberOfLines={1}
                >
                  {isPersian ? cat.faSubtitle : cat.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Subtle Scroll Progress Tracker Bar ── */}
      <View
        style={{
          height: 3,
          backgroundColor: isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.6)',
          borderRadius: 2,
          marginTop: 6,
          marginHorizontal: 4,
          overflow: 'hidden',
          width: 80,
          alignSelf: 'center',
        }}
      >
        <View
          style={{
            height: '100%',
            width: '45%',
            borderRadius: 2,
            backgroundColor: colors.gold,
            transform: [{ translateX: scrollProgress * 44 }],
          }}
        />
      </View>
    </View>
  );
};
