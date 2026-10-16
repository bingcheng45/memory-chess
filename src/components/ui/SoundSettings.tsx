"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  DEFAULT_SOUND_VOLUME,
  isSoundEnabled,
  setSoundEnabled,
  getVolume,
  setVolume,
  playSound,
} from "@/lib/utils/soundEffects";
import { useTranslations } from "next-intl";
import { useClickAway } from "@/hooks/useClickAway";
import { usePresence } from "@/hooks/usePresence";
import { createPortal } from "react-dom";

const SLIDER_EXIT_MS = 200;

interface SoundSettingsProps {
  className?: string;
}

export default function SoundSettings({ className = "" }: SoundSettingsProps) {
  const t = useTranslations("common.sound");
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolumeState] = useState(DEFAULT_SOUND_VOLUME);
  const [showSlider, setShowSlider] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640); // Same breakpoint as sm: in Tailwind
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }
  }, []);

  // Initialize state from sound utilities
  useEffect(() => {
    if (typeof window !== "undefined") {
      const enabled = isSoundEnabled();
      setSoundOn(enabled);

      // Mobile keeps a simple sound on/off control at the quieter default volume.
      if (isMobile) {
        setVolumeState(DEFAULT_SOUND_VOLUME);
        setVolume(DEFAULT_SOUND_VOLUME);
      } else {
        setVolumeState(getVolume());
      }
    }
  }, [isMobile]);

  // Auto-dismiss slider after inactivity (desktop only)
  useEffect(() => {
    if (!isMobile && showSlider && !isHovering) {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }

      sliderTimeoutRef.current = setTimeout(() => {
        setShowSlider(false);
      }, 3000);
    }

    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, [showSlider, isHovering, isMobile]);

  // Handle clicks outside to close the slider
  useClickAway(wrapperRef, () => {
    if (showSlider) {
      setShowSlider(false);
    }
  });

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    // Automatically hide the toast after 1.5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    // If a toast is currently showing, hide it first
    if (showToast) {
      setShowToast(false);
    }

    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);

    if (newState) {
      // On mobile, restore the quieter default when toggling on.
      if (isMobile) {
        setVolumeState(DEFAULT_SOUND_VOLUME);
        setVolume(DEFAULT_SOUND_VOLUME);
      }

      // Play a sound to confirm sound is on
      playSound("click");
      showToastNotification(t("on"));
    } else {
      showToastNotification(t("off"));
    }
  };

  // Handle volume change (desktop only)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);

    // Play a sound to demonstrate new volume
    if (soundOn && newVolume > 0) {
      playSound("click");
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
      // On desktop, show slider on hover
      setShowSlider(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
    }
  };

  const slider = usePresence(!isMobile && showSlider && soundOn, SLIDER_EXIT_MS);

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sound toggle button */}
      <button
        onClick={handleSoundToggle}
        className={`flex h-10 w-10 items-center justify-center rounded-md transition-[color,background-color,transform] active:scale-90 hover:bg-[var(--lp-surface-2)] hover:text-[var(--lp-ink)] ${soundOn ? "text-[var(--lp-ink-2)]" : "text-[var(--lp-muted)]"}`}
        aria-label={soundOn ? t("mute") : t("unmute")}
        title={soundOn ? t("mute") : t("unmute")}
      >
        <div key={soundOn ? "sound-on" : "sound-off"} className="lab-sound-pulse">
          {soundOn ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </div>
      </button>

      {/* Volume slider - Desktop Only */}
      {slider.isPresent && (
        <div
          className={`absolute z-10 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 py-3 shadow-[var(--lp-pop-shadow)] duration-200 ${
            slider.isClosing
              ? "animate-out fade-out slide-out-to-bottom-[10px] fill-mode-forwards"
              : "animate-in fade-in slide-in-from-bottom-[10px]"
          }`}
          style={{
            top: "100%",
            right: 0,
            marginTop: "8px",
            width: "max-content",
          }}
        >
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="lab-range w-28"
              style={{ "--fill": `${volume * 100}%` } as CSSProperties}
              aria-label={t("volume")}
            />
            <span className="lab-mono min-w-[4ch] text-right text-sm font-medium text-[var(--lp-ink)]">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Toast notification - Rendered via Portal */}
      {isMounted &&
        showToast &&
        createPortal(
          <div className="fixed left-0 top-0 w-screen h-screen flex items-center justify-center pointer-events-none z-[99999]">
            <div className="animate-in fade-in zoom-in-[0.85] rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-5 py-2.5 text-sm font-medium text-[var(--lp-ink)] shadow-[var(--lp-pop-shadow)] duration-300 motion-reduce:animate-none">
              {toastMessage}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
