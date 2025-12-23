import {
    startOfDay,
    endOfDay,
    addDays,
    format,
    isSameDay,
    isToday,
    isPast,
    startOfWeek,
    endOfWeek
} from 'date-fns';

/**
 * Group events by date
 * @param {Array} events - Array of event objects
 * @returns {Object} Object with dates as keys and event arrays as values
 */
export const groupEventsByDate = (events) => {
    const grouped = {};

    events.forEach(event => {
        if (!event.deadline) return;

        const eventDate = new Date(event.deadline);
        const dateKey = format(startOfDay(eventDate), 'yyyy-MM-dd');

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }

        grouped[dateKey].push(event);
    });

    return grouped;
};

/**
 * Generate 30-day calendar grid
 * @param {Date} startDate - Starting date (default: today)
 * @returns {Array} Array of date objects for calendar grid
 */
export const generate30DayGrid = (startDate = new Date()) => {
    const start = startOfDay(startDate);
    const days = [];

    // Generate 30 days starting from today
    for (let i = 0; i < 30; i++) {
        const date = addDays(start, i);
        days.push({
            date,
            dateKey: format(date, 'yyyy-MM-dd'),
            dayNumber: format(date, 'd'),
            isToday: isToday(date),
            isPast: isPast(endOfDay(date)),
            dayOfWeek: format(date, 'EEEE')
        });
    }

    return days;
};

/**
 * Generate calendar grid with week alignment
 * @param {Date} startDate - Starting date
 * @returns {Array} Array of weeks, each containing 7 days
 */
export const generateCalendarGrid = (startDate = new Date()) => {
    const start = startOfDay(startDate);
    const weekStart = startOfWeek(start, { weekStartsOn: 0 }); // Sunday

    const weeks = [];
    let currentDate = weekStart;

    // Generate 5 weeks (35 days) to ensure we cover 30 days
    for (let week = 0; week < 5; week++) {
        const weekDays = [];

        for (let day = 0; day < 7; day++) {
            const date = addDays(currentDate, day);
            const isInRange = date >= start && date < addDays(start, 30);

            weekDays.push({
                date,
                dateKey: format(date, 'yyyy-MM-dd'),
                dayNumber: format(date, 'd'),
                monthName: format(date, 'MMM'),
                isToday: isToday(date),
                isPast: isPast(endOfDay(date)),
                isInRange,
                dayOfWeek: format(date, 'EEEE')
            });
        }

        weeks.push(weekDays);
        currentDate = addDays(currentDate, 7);
    }

    return weeks;
};

/**
 * Get color class based on event count
 * @param {number} count - Number of events
 * @param {boolean} isPast - Whether the date is in the past
 * @returns {string} Tailwind color classes
 */
export const getHeatmapColor = (count, isPast = false) => {
    if (isPast) {
        return 'bg-gray-200 text-gray-400';
    }

    if (count === 0) {
        return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    } else if (count <= 2) {
        return 'bg-blue-200 text-blue-900 hover:bg-blue-300';
    } else if (count <= 4) {
        return 'bg-blue-400 text-white hover:bg-blue-500';
    } else {
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
};

/**
 * Get intensity level for legend
 * @param {number} count - Number of events
 * @returns {string} Intensity level
 */
export const getIntensityLevel = (count) => {
    if (count === 0) return 'None';
    if (count <= 2) return 'Low';
    if (count <= 4) return 'Medium';
    return 'High';
};

/**
 * Format tooltip content
 * @param {Object} day - Day object
 * @param {Array} events - Events for that day
 * @returns {Object} Tooltip data
 */
export const formatTooltip = (day, events = []) => {
    const dateStr = format(day.date, 'EEEE, MMMM d, yyyy');
    const count = events.length;
    const eventNames = events.slice(0, 3).map(e => e.title);
    const hasMore = events.length > 3;

    return {
        date: dateStr,
        count,
        eventNames,
        hasMore,
        moreCount: hasMore ? events.length - 3 : 0
    };
};
