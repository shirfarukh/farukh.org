---
name: animate-expo
description: Build animations in React Native and Expo, making decisions in the order that determines whether they feel right on a real device.
---

# Building Animations in Expo & React Native

A construction skill for React Native based on Emil Kowalski's animation philosophy.

## Core Rules for React Native

1. **No Hover**: Every affordance lives in press, position, or subtle state.
2. **Two Runtimes**: Keep motion on the UI runtime (worklets in Reanimated) rather than the React JS runtime to prevent frame drops.
3. **Finger on the Glass**: Interruptibility and velocity handoff are baseline requirements.
4. **Transform and Opacity only**: They skip layout passes. Modifying `width`, `height`, `margin`, `padding` re-runs Yoga on every frame.
5. **Never scale(0)**: Start from `scale(0.95)` with `opacity: 0`.

## Spring Presets

```typescript
export const springs = {
  // Snappy for button presses, toggles, badge pop
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  // Smooth for sheets, modals, cards
  smooth: { damping: 25, stiffness: 180, mass: 1 },
  // Interactive for drag, swipe-to-dismiss
  interactive: { damping: 15, stiffness: 120 },
};
```

## Press Feedback Recipe

```typescript
const pressed = useSharedValue(false);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    {
      scale: withSpring(pressed.value ? 0.97 : 1, {
        damping: 20,
        stiffness: 300,
      }),
    },
  ],
}));
```
