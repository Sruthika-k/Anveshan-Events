import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    groupEventsByDate,
    generateCalendarGrid,
    getHeatmapColor,
    formatTooltip
} from '../utils/heatmapUtils.js';

function EventHeatmap({ events, loading }) {
    const navigate = useNavigate();
    const [calendarGrid, setCalendarGrid] = useState([]);
    const [eventsByDate, setEventsByDate] = useState({});
    const [hoveredDay, setHoveredDay] = useState(null);
    const [tooltipData, setTooltipData] = useState(null);

    // Process events and generate calendar
    useEffect(() => {
        if (events && events.length > 0) {
            const grouped = groupEventsByDate(events);
            setEventsByDate(grouped);
        }

        const grid = generateCalendarGrid();
        setCalendarGrid(grid);
    }, [events]);

    // Handle cell click - navigate to events page filtered by date
    const handleCellClick = (day) => {
        const dayEvents = eventsByDate[day.dateKey] || [];
        if (dayEvents.length > 0 && day.isInRange) {
            // Navigate to events page (could add date filter in future)
            navigate('/events');
        }
    };

    // Handle cell hover
    const handleCellHover = (day) => {
        if (!day.isInRange) return;

        const dayEvents = eventsByDate[day.dateKey] || [];
        const tooltip = formatTooltip(day, dayEvents);
        setTooltipData(tooltip);
        setHoveredDay(day.dateKey);
    };

    // Handle cell leave
    const handleCellLeave = () => {
        setHoveredDay(null);
        setTooltipData(null);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                <div className="grid grid-cols-7 gap-2">
                    {[...Array(35)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Event Activity - Next 30 Days
                </h2>
                <p className="text-sm text-gray-600">
                    Click on any day to explore events
                </p>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-bold text-gray-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2 relative">
                {calendarGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-2">
                        {week.map((day, dayIndex) => {
                            const dayEvents = eventsByDate[day.dateKey] || [];
                            const eventCount = dayEvents.length;
                            const colorClass = getHeatmapColor(eventCount, day.isPast);
                            const isHovered = hoveredDay === day.dateKey;
                            const hasEvents = eventCount > 0 && day.isInRange;

                            return (
                                <div
                                    key={day.dateKey}
                                    onClick={() => handleCellClick(day)}
                                    onMouseEnter={() => handleCellHover(day)}
                                    onMouseLeave={handleCellLeave}
                                    className={`
                    relative h-12 rounded-lg flex flex-col items-center justify-center
                    transition-all duration-200 ease-out
                    ${colorClass}
                    ${day.isToday ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}
                    ${!day.isInRange ? 'opacity-30' : ''}
                    ${hasEvents ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
                    ${isHovered ? 'z-10' : ''}
                    animate-fade-in
                  `}
                                    style={{
                                        animationDelay: `${(weekIndex * 7 + dayIndex) * 20}ms`,
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    {/* Day Number */}
                                    <span className={`text-sm font-semibold ${day.isPast ? 'line-through' : ''}`}>
                                        {day.dayNumber}
                                    </span>

                                    {/* Event Count Badge */}
                                    {eventCount > 0 && day.isInRange && (
                                        <span className="text-xs font-bold mt-0.5">
                                            {eventCount}
                                        </span>
                                    )}

                                    {/* Month Label (first day of month) */}
                                    {day.dayNumber === '1' && (
                                        <span className="absolute -top-6 left-0 text-xs font-bold text-gray-700">
                                            {day.monthName}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Tooltip */}
                {tooltipData && hoveredDay && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-50 animate-fade-in">
                        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs">
                            <p className="text-sm font-semibold mb-1">{tooltipData.date}</p>
                            <p className="text-xs text-gray-300 mb-2">
                                {tooltipData.count} {tooltipData.count === 1 ? 'event' : 'events'}
                            </p>
                            {tooltipData.eventNames.length > 0 && (
                                <div className="space-y-1">
                                    {tooltipData.eventNames.map((name, index) => (
                                        <p key={index} className="text-xs text-gray-200 truncate">
                                            • {name}
                                        </p>
                                    ))}
                                    {tooltipData.hasMore && (
                                        <p className="text-xs text-gray-400 italic">
                                            +{tooltipData.moreCount} more...
                                        </p>
                                    )}
                                </div>
                            )}
                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="w-3 h-3 bg-gray-900 transform rotate-45"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                        Activity Level:
                    </span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded border border-gray-300"></div>
                            <span className="text-xs text-gray-600">0</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-200 rounded"></div>
                            <span className="text-xs text-gray-600">1-2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-400 rounded"></div>
                            <span className="text-xs text-gray-600">3-4</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded"></div>
                            <span className="text-xs text-gray-600">5+</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

export default EventHeatmap;
