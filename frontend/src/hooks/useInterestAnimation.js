import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing interest button animations
 * Handles optimistic updates, debouncing, and celebration triggers
 */
export function useInterestAnimation() {
    const [showCelebration, setShowCelebration] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animatedCount, setAnimatedCount] = useState(0);
    const debounceTimer = useRef(null);

    // Animate counter from old to new value
    const animateCounter = useCallback((oldCount, newCount) => {
        if (oldCount === newCount) return;

        const duration = 500; // 500ms animation
        const steps = 20;
        const increment = (newCount - oldCount) / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setAnimatedCount(newCount);
                clearInterval(timer);
                setIsAnimating(false);
            } else {
                setAnimatedCount(Math.round(oldCount + increment * currentStep));
            }
        }, duration / steps);

        setIsAnimating(true);
    }, []);

    // Trigger celebration (with debouncing)
    const triggerCelebration = useCallback((newCount) => {
        // Clear any existing debounce timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Debounce to prevent spam
        debounceTimer.current = setTimeout(() => {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 100); // Reset after trigger
        }, 100);
    }, []);

    // Handle interest toggle with animations
    const handleInterestToggle = useCallback(async (
        isCurrentlyInterested,
        currentCount,
        toggleFunction
    ) => {
        const oldCount = currentCount;
        const newCount = isCurrentlyInterested ? currentCount - 1 : currentCount + 1;

        // Optimistic update
        setAnimatedCount(newCount);

        // Trigger celebration only when marking interest (not unmarking)
        if (!isCurrentlyInterested) {
            triggerCelebration(newCount);
        }

        try {
            // Call the actual toggle function
            await toggleFunction();

            // Animate counter
            animateCounter(oldCount, newCount);
        } catch (error) {
            // Rollback on error
            setAnimatedCount(oldCount);
            throw error;
        }
    }, [animateCounter, triggerCelebration]);

    return {
        showCelebration,
        isAnimating,
        animatedCount,
        setAnimatedCount,
        handleInterestToggle,
    };
}
