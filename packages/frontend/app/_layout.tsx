// Import Reanimated early to ensure proper initialization before other modules
import 'react-native-reanimated';

import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from "react-native";

// Components
import AppSplashScreen from '@/components/AppSplashScreen';
import { PlayerBar } from "@/components/PlayerBar";
import { TopBar } from "@/components/TopBar";
import { LibrarySidebar } from "@/components/LibrarySidebar";
import { NowPlaying } from "@/components/NowPlaying";
import { ThemedView } from "@/components/ThemedView";
import { Panel } from "@/components/Panel";
import { AppProviders } from '@/components/providers/AppProviders';
import { QUERY_CLIENT_CONFIG } from '@/components/providers/constants';
import { Provider as PortalProvider, Outlet as PortalOutlet } from '@/components/Portal';

// Hooks
import { useColorScheme } from "@/hooks/useColorScheme";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { useIsScreenNotMobile, useIsDesktop } from "@/hooks/useOptimizedMediaQuery";
import { useTheme } from '@/hooks/useTheme';
import { LayoutScrollProvider, useLayoutScroll } from '@/context/LayoutScrollContext';

// Services & Utils
import { oxyServices } from '@/lib/oxyServices';
import { AppInitializer } from '@/lib/appInitializer';

// Styles
import '../styles/global.css';

// Types
interface SplashState {
  initializationComplete: boolean;
  startFade: boolean;
  fadeComplete: boolean;
}

interface MainLayoutProps {
  isScreenNotMobile: boolean;
}

/**
 * MainLayout Component
 * Spotify-like 5-panel layout:
 * - Top bar (always visible)
 * - Left sidebar (Your Library - collapsible)
 * - Main content area (flexible, scrollable)
 * - Right sidebar (artist/album details - collapsible, desktop only)
 * - Bottom player bar (always visible, fixed position)
 */
const MainLayout: React.FC<MainLayoutProps> = memo(({ isScreenNotMobile }) => {
  const theme = useTheme();
  const { forwardWheelEvent } = useLayoutScroll();
  const isDesktop = useIsDesktop();
  const keyboardVisible = useKeyboardVisibility();

  // On mobile, no gaps or padding
  const gapSize = isScreenNotMobile ? 12 : 0;
  const outerPadding = isScreenNotMobile ? 12 : 0;

  // Calculate panel height for web - all panels should have same height
  // On desktop, player bar is in normal flow, so we subtract it from height
  // On mobile, player bar is absolute/fixed, so it doesn't affect height calculation
  const panelHeight = isScreenNotMobile
    ? `calc(100vh - 64px - ${gapSize}px - 72px - ${outerPadding}px)` as any // topbar + gap + playerBar + outerPadding
    : `calc(100vh - 64px - 72px)` as any; // topbar + playerBar (absolute positioned)

  const styles = useMemo(() => StyleSheet.create({
    outerContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: '#000000', // Black app background
      ...Platform.select({
        web: outerPadding > 0 ? {
          paddingLeft: outerPadding,
          paddingRight: outerPadding,
          paddingBottom: outerPadding,
        } : {},
      }),
    },
    contentWrapper: {
      flex: 1,
      ...Platform.select({
        web: isScreenNotMobile ? {
          display: 'flex',
          flexDirection: 'column',
          gap: gapSize, // Gap between panels wrapper and player bar
        } : {},
      }),
    },
    topBarContainer: {
      ...Platform.select({
        web: {
          position: 'sticky' as any,
          top: 0,
          zIndex: 1000,
        },
      }),
    },
    panelsWrapper: {
      flex: 1,
      flexDirection: isScreenNotMobile ? 'row' : 'column',
      ...Platform.select({
        web: {
          gap: gapSize, // Consistent gap between panels
        },
      }),
    },
    leftSidebarContainer: {
      flexShrink: 0,
      flexGrow: 0,
      ...Platform.select({
        web: {
          height: panelHeight,
        },
      }),
    },
    mainContentWrapper: {
      flex: 1,
      minWidth: 0, // Allow flexbox to shrink below content size
      ...Platform.select({
        web: {
          overflowY: 'auto' as any,
          height: panelHeight,
        },
      }),
    },
    rightSidebarContainer: {
      flexShrink: 0,
      flexGrow: 0,
      ...Platform.select({
        web: {
          height: panelHeight,
        },
      }),
    },
    playerBarContainer: {
      ...Platform.select({
        web: isScreenNotMobile ? {
          // Desktop: Normal flow - gap is handled by contentWrapper
        } : {
          // Mobile: Fixed position
          position: 'fixed' as any,
          bottom: outerPadding,
          left: outerPadding,
          right: outerPadding,
          zIndex: 1000,
        },
        default: {
          // Mobile: Absolute position
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
      }),
    },
  }), [isScreenNotMobile, isDesktop, theme.colors.background, gapSize, outerPadding, panelHeight]);

  const handleWheel = useCallback((event: any) => {
    forwardWheelEvent(event);
  }, [forwardWheelEvent]);

  const containerProps = useMemo(
    () => (Platform.OS === 'web' ? { onWheel: handleWheel } : {}),
    [handleWheel]
  );

  return (
    <View style={styles.outerContainer} {...containerProps}>
      {/* Top Navigation Bar - No gap needed since it has no background */}
      <View style={styles.topBarContainer}>
        <TopBar />
      </View>

      {/* Content Wrapper - Panels and Player with gap */}
      <View style={styles.contentWrapper}>
        {/* Panels Wrapper - All panels with same height and rounded corners */}
        <View style={styles.panelsWrapper}>
          {/* Left Sidebar - Your Library */}
          {isScreenNotMobile && (
            <Panel rounded="all" radius={12} style={styles.leftSidebarContainer} overflow={false}>
              <LibrarySidebar />
            </Panel>
          )}

          {/* Main Content */}
          <Panel rounded="all" radius={12} style={styles.mainContentWrapper}>
            <Slot />
          </Panel>

          {/* Right Sidebar - Artist/Album Details (Desktop only) */}
          {isDesktop && (
            <Panel rounded="all" radius={12} style={styles.rightSidebarContainer}>
              <NowPlaying />
            </Panel>
          )}
        </View>

        {/* Bottom Player Bar */}
        {!keyboardVisible && (
          <View style={styles.playerBarContainer}>
            <PlayerBar />
          </View>
        )}
      </View>
    </View>
  );
});

MainLayout.displayName = 'MainLayout';

export default function RootLayout() {
  // State
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashState, setSplashState] = useState<SplashState>({
    initializationComplete: false,
    startFade: false,
    fadeComplete: false,
  });

  // Hooks
  const isScreenNotMobile = useIsScreenNotMobile();
  const keyboardVisible = useKeyboardVisibility();

  // Memoized instances
  const queryClient = useMemo(() => new QueryClient(QUERY_CLIENT_CONFIG), []);

  // Font Loading
  // Optimized: Using variable fonts - single file per family contains all weights
  // This reduces loading overhead significantly compared to registering each weight separately
  const [fontsLoaded] = useFonts(
    useMemo(() => {
      const fontMap: Record<string, any> = {};
      const InterVariable = require('@/assets/fonts/inter/InterVariable.ttf');
      const PhuduVariable = require('@/assets/fonts/Phudu-VariableFont_wght.ttf');

      // Inter: Single variable font with weight aliases
      ['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'].forEach(weight => {
        fontMap[`Inter-${weight}`] = InterVariable;
      });

      // Phudu: Single variable font with weight aliases
      ['Thin', 'Regular', 'Medium', 'SemiBold', 'Bold'].forEach(weight => {
        fontMap[`Phudu-${weight}`] = PhuduVariable;
      });

      return fontMap;
    }, [])
  );

  // Callbacks
  const handleSplashFadeComplete = useCallback(() => {
    setSplashState((prev) => ({ ...prev, fadeComplete: true }));
  }, []);

  const initializeApp = useCallback(async () => {
    if (!fontsLoaded) return;

    const result = await AppInitializer.initializeApp(fontsLoaded, oxyServices);

    if (result.success) {
      setSplashState((prev) => ({ ...prev, initializationComplete: true }));
    } else {
      console.error('App initialization failed:', result.error);
      // Still mark as complete to prevent blocking the app
      setSplashState((prev) => ({ ...prev, initializationComplete: true }));
    }
  }, [fontsLoaded]);


  // Initialize i18n once when the app mounts
  useEffect(() => {
    AppInitializer.initializeI18n().catch((error) => {
      console.error('Failed to initialize i18n:', error);
    });
  }, []);

  // Load eager settings that don't block app initialization
  useEffect(() => {
    AppInitializer.loadEagerSettings(oxyServices);
  }, []);

  // React Query managers - setup once on mount
  useEffect(() => {
    // React Query online manager using NetInfo
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    // React Query focus manager using AppState
    const onAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      unsubscribeNetInfo();
      appStateSub.remove();
    };
  }, []); // Empty deps - setup once

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (fontsLoaded && splashState.initializationComplete && !splashState.startFade) {
      setSplashState((prev) => ({ ...prev, startFade: true }));
    }
  }, [fontsLoaded, splashState.initializationComplete, splashState.startFade]);

  // Set appIsReady only after both initialization (including auth) and splash fade complete
  useEffect(() => {
    if (splashState.initializationComplete && splashState.fadeComplete && !appIsReady) {
      setAppIsReady(true);
    }
  }, [splashState.initializationComplete, splashState.fadeComplete, appIsReady]);

  const theme = useTheme();
  const colorScheme = useColorScheme();

  // Memoize app content to prevent unnecessary re-renders
  const appContent = useMemo(() => {
    if (!appIsReady) {
      return (
        <AppSplashScreen
          startFade={splashState.startFade}
          onFadeComplete={handleSplashFadeComplete}
        />
      );
    }

    return (
      <AppProviders
        oxyServices={oxyServices}
        colorScheme={colorScheme}
        queryClient={queryClient}
      >
        {/* Portal Provider for rendering components outside tree */}
        <PortalProvider>
          <LayoutScrollProvider>
            <MainLayout isScreenNotMobile={isScreenNotMobile} />
            <PortalOutlet />
          </LayoutScrollProvider>
        </PortalProvider>
      </AppProviders>
    );
  }, [
    appIsReady,
    splashState.startFade,
    splashState.initializationComplete,
    splashState.fadeComplete,
    colorScheme,
    isScreenNotMobile,
    keyboardVisible,
    handleSplashFadeComplete,
    queryClient,
    // oxyServices is stable (imported singleton), but included for completeness
  ]);

  return (
    <ThemedView style={{ flex: 1 }}>
      {appContent}
    </ThemedView>
  );
}
