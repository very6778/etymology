"use client";

import { useCallback } from "react";

export function useSensoryFeedback() {
    const triggerHaptic = useCallback(() => {
        if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
            // Ultra-short vibration for subtle feedback
            window.navigator.vibrate(5);
        }
    }, []);

    const playClickSound = useCallback(() => {
        // Optional: Implement sound if desired later
        // const audio = new Audio('/sounds/click.mp3');
        // audio.volume = 0.1;
        // audio.play().catch(() => {});
    }, []);

    const triggerFeedback = useCallback(() => {
        triggerHaptic();
        playClickSound();
    }, [triggerHaptic, playClickSound]);

    return { triggerFeedback };
}
