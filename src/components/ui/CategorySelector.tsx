import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';

export interface CategoryMeta {
  id: string;
  label: string;
  faLabel: string;
  icon: string;
}

export const CATEGORY_DEFINITIONS: CategoryMeta[] = [
  { id: 'AI & Tech', label: 'AI & Tech', faLabel: 'هوش مصنوعی و فناوری', icon: '🤖' },
  { id: 'Stocks & Crypto', label: 'Stocks & Crypto', faLabel: 'سهام و ارز دیجیتال', icon: '📈' },
  { id: 'Ecommerce', label: 'Ecommerce', faLabel: 'تجارت الکترونیک', icon: '🛍️' },
  { id: 'Languages', label: 'Languages', faLabel: 'زبان‌ها', icon: '🗣️' },
  { id: 'Morals', label: 'Morals', faLabel: 'اخلاق و ارزش‌ها', icon: '⚖️' },
];

interface CategorySelectorProps {
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  isPersian?: boolean;
  label?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  isPersian = false,
  label = 'Course Category *',
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ marginBottom: 18 }}>
      <View className="flex-row items-center justify-between mb-2">
        {label && (
          <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
            {label}
          </Text>
        )}
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
          ⟷ {isPersian ? 'ورق بزنید' : 'Scrollable'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
          paddingVertical: 4,
          paddingHorizontal: 2,
        }}
      >
        {CATEGORY_DEFINITIONS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(isSelected ? '' : cat.id)}
              activeOpacity={0.85}
              style={{
                width: 130,
                minHeight: 88,
                borderRadius: 16,
                padding: 12,
                justifyContent: 'space-between',
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.gold : colors.cardBorder,
                backgroundColor: isSelected
                  ? isDark
                    ? 'rgba(250,204,21,0.18)'
                    : 'rgba(202,138,4,0.14)'
                  : colors.card,
                shadowColor: isSelected ? colors.gold : '#000',
                shadowOpacity: isSelected ? 0.3 : 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: isSelected ? 4 : 1,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                {isSelected ? (
                  <View
                    style={{
                      backgroundColor: colors.gold,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? '#0F172A' : '#FFFFFF',
                        fontSize: 11,
                        fontWeight: '900',
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={{
                  color: isSelected ? colors.gold : colors.text,
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: 13,
                  marginTop: 6,
                }}
                numberOfLines={1}
              >
                {isPersian ? cat.faLabel : cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
