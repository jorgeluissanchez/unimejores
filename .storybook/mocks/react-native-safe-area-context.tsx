import React from 'react';

export const SafeAreaProvider = ({ children }: any) => <>{children}</>;
export const SafeAreaView = ({ children, style }: any) => <div style={style}>{children}</div>;
export const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 375, height: 812 });
export const initialWindowMetrics = { insets: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { x: 0, y: 0, width: 375, height: 812 } };
