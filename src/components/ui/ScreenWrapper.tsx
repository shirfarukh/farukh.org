import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../features/theme/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  edgeTop?: boolean;
  contentContainerStyle?: any;
  onScroll?: (event: any) => void;
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  className = '',
  edgeTop = true,
  contentContainerStyle,
  onScroll,
  keyboardAvoiding = true,
  keyboardVerticalOffset,
}) => {
  const isWeb = Platform.OS === 'web';
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (isWeb) return;
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isWeb]);

  const mobileTopPadding = !edgeTop ? Math.max(insets.top, 8) + 64 : 0;
  const calculatedOffset =
    keyboardVerticalOffset !== undefined
      ? keyboardVerticalOffset
      : Platform.OS === 'ios'
      ? (edgeTop ? insets.top : insets.top + 64)
      : 0;

  // Generous dynamic bottom padding to prevent software keyboard from hiding inputs
  const dynamicBottomPadding = keyboardHeight > 0 ? Math.max(120, keyboardHeight * 0.45) : 40;

  const content = scrollable ? (
    <ScrollView
      className={`flex-1 px-4 py-4 ${className}`}
      contentContainerStyle={[
        { flexGrow: 1, paddingBottom: dynamicBottomPadding, paddingTop: mobileTopPadding },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={true}
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={`flex-1 px-4 py-4 ${className}`}
      style={[
        isWeb ? ({ flex: 1, overflowY: 'auto' } as any) : { flex: 1 },
        mobileTopPadding ? { paddingTop: mobileTopPadding } : undefined,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.bg },
        isWeb ? ({ overflowY: 'auto' } as any) : undefined,
      ]}
      edges={edgeTop ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {keyboardAvoiding && !isWeb ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={calculatedOffset}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};
