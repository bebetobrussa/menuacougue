/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuProvider, useMenu } from './context/MenuContext.tsx';
import { DigitalBoard } from './components/DigitalBoard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';

function MainApp() {
  const { isTvMode, setIsTvMode, isAuthenticated, settings } = useMenu();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const handleRequestAdmin = () => {
    if (!settings.requirePinForAdmin || isAuthenticated) {
      setIsTvMode(false);
    } else {
      setShowPinModal(true);
    }
  };

  // Keyboard shortcuts for convenience (T = TV mode, A/P = Admin mode, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        setIsTvMode(true);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P') {
        handleRequestAdmin();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsTvMode, isAuthenticated, settings.requirePinForAdmin]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <>
      {isTvMode ? (
        <DigitalBoard
          onOpenAdmin={handleRequestAdmin}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <AdminPanel
          onOpenTvMode={() => setIsTvMode(true)}
        />
      )}

      {/* Admin PIN Authentication Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          setIsTvMode(false);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <MenuProvider>
      <MainApp />
    </MenuProvider>
  );
}
