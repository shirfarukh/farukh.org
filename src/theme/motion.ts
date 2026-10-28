/**
 * Emil Kowalski Design Engineering Motion System
 * Inspired by https://github.com/emilkowalski/skills
 * 
 * Rules:
 * 1. Never animate from scale(0) -> always start from scale(0.95) with opacity 0.
 * 2. Never use ease-in for entering elements -> always use strong ease-out.
 * 3. Keep UI interactions under 300ms (buttons: 120-160ms, dropdowns: 180ms, modals: 240ms).
 * 4. Buttons and pressables must feel responsive (scale to 0.97 on press).
 */

export const easings = {
  // Strong ease-out for all user-initiated UI entrances and transitions
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  // Strong ease-in-out for on-screen movement/morphing
  easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  // Natural drawer/sheet deceleration curve
  easeDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
};

export const durations = {
  // Fast tactile feedback on tap/press
  press: 140,
  // Tooltip, badge, small popover
  tooltip: 160,
  // Dropdowns, selects, menus
  dropdown: 180,
  // Modals, sheets, dialogs (must stay under 300ms)
  modal: 240,
};

export const springs = {
  // Snappy for button press, toggles, row selection
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  // Smooth for bottom sheets, modals, cards
  smooth: { damping: 25, stiffness: 180, mass: 1 },
  // Interactive for drag-to-dismiss, gestural physics
  interactive: { damping: 15, stiffness: 120 },
};

export const scalePresets = {
  // Starting point for natural entrance animations (never 0)
  enterFromScale: 0.95,
  // Tactile press scale for buttons
  pressScaleButton: 0.97,
  // Tactile press scale for large cards
  pressScaleCard: 0.985,
};
