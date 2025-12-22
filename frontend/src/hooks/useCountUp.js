import { useEffect, useState } from 'react';

/**
 * Custom hook for animating number counters
 * @param {number} end - Target number to count to
 * @param {number} duration - Animation duration in milliseconds (default: 1500)
 * @param {number} start - Starting number (default: 0)
 * @returns {number} Current animated value
 */
export function useCountUp(end, duration = 1500, start = 0) {
    const [count, setCount] = useState(start);

    useEffect(() => {
        if (end === start) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(easeOut * (end - start) + start));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [end, duration, start]);

    return count;
}
