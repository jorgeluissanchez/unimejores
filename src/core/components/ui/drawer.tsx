import { cn } from '@/core/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { NativeOnlyAnimatedView } from './native-only-animated-view';

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

function DrawerOverlay({ className, children, ...props }: any) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'absolute inset-0 bg-black/50',
        Platform.select({ web: 'animate-in fade-in-0 fixed' }),
        className
      )}
      {...props}
      asChild={Platform.OS !== 'web'}>
      <NativeOnlyAnimatedView entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
        <>{children}</>
      </NativeOnlyAnimatedView>
    </DialogPrimitive.Overlay>
  );
}

function DrawerContent({ className, portalHost, children, side = 'right', ...props }: any) {
  const sideClass = side === 'left' ? 'left-0' : 'right-0';
  return (
    <DrawerPortal hostName={portalHost}>
      <DrawerOverlay>
        <DialogPrimitive.Content
          className={cn(
            `fixed top-0 bottom-0 ${sideClass} z-50 w-full max-w-xs bg-background border-border p-4 shadow-lg`,
            Platform.select({ web: 'animate-in slide-in-from-right-12 duration-300' }),
            className
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </DrawerOverlay>
    </DrawerPortal>
  );
}

function DrawerHeader(props: any) {
  return <View className={cn('flex flex-col gap-2', props.className)} {...props} />;
}

function DrawerFooter(props: any) {
  return <View className={cn('flex items-center justify-end gap-2', props.className)} {...props} />;
}

function DrawerTitle(props: any) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold', props.className)} {...props} />;
}

function DrawerDescription(props: any) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', props.className)} {...props} />;
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger };

