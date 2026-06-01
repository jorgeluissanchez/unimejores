import React from 'react';

const Animated = {
  View: ({ children, style, ...p }: any) => <div style={style} {...p}>{children}</div>,
  Text: ({ children, style, ...p }: any) => <span style={style} {...p}>{children}</span>,
  Image: ({ style, ...p }: any) => <img style={style} {...p} />,
  ScrollView: ({ children, style, ...p }: any) => <div style={style} {...p}>{children}</div>,
};
export default Animated;

export const useSharedValue = (v: any) => ({ value: v });
export const useAnimatedStyle = (fn: any) => { try { return fn(); } catch { return {}; } };
export const withTiming = (v: any) => v;
export const withSpring = (v: any) => v;
export const withDelay = (_: any, v: any) => v;
export const withRepeat = (v: any) => v;
export const withSequence = (...vals: any[]) => vals[0];
export const runOnJS = (fn: any) => fn;
export const runOnUI = (fn: any) => fn;
export const interpolate = (v: any) => v;
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend' };
export const useAnimatedRef = () => ({ current: null });
export const useAnimatedScrollHandler = (h: any) => h;
export const useAnimatedGestureHandler = (h: any) => h;
export const useAnimatedReaction = () => {};
export const useDerivedValue = (fn: any) => ({ value: fn() });
export const cancelAnimation = () => {};
export const useReducedMotion = () => false;
export const FadeIn = {};
export const FadeOut = {};
export const Layout = {};
