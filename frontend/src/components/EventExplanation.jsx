import { useState } from 'react';

/**
 * EventExplanation Component
 * Shows a detailed, expandable explanation of why an event is recommended
 * 100% deterministic, rule-based logic with polished UI
 */
function EventExplanation({ event, userProfile }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate explanation details
    const getExplanationDetails = () => {
        const details = [];

        // 1. Skill Match
        if (userProfile?.skills && event.required_skills) {
            const userSkillsLower = userProfile.skills.map(s => s.toLowerCase());
            const eventSkillsLower = event.required_skills.map(s => s.toLowerCase());

            const matchedSkills = userProfile.skills.filter(skill =>
                eventSkillsLower.includes(skill.toLowerCase())
            );

            if (matchedSkills.length > 0) {
                details.push({
                    type: 'skill',
                    title: 'Skill Match',
                    description: `Requires ${matchedSkills.length} skill${matchedSkills.length > 1 ? 's' : ''} you have`,
                    skills: matchedSkills,
                    color: 'indigo'
                });
            }
        }

        // 2. College Match
        if (userProfile?.college && event.college === userProfile.college) {
            details.push({
                type: 'college',
                title: 'From Your College',
                description: `Organized by ${event.college}`,
                color: 'indigo'
            });
        }

        // 3. Year Eligibility
        if (userProfile?.year && event.eligibility) {
            const eligibilityLower = event.eligibility.toLowerCase();
            const yearLower = userProfile.year.toLowerCase();

            if (
                eligibilityLower.includes(yearLower) ||
                eligibilityLower.includes('open to all') ||
                eligibilityLower.includes('all students')
            ) {
                details.push({
                    type: 'eligibility',
                    title: 'You\'re Eligible',
                    description: event.eligibility,
                    color: 'emerald'
                });
            }
        }

        // 4. Deadline Urgency
        if (event.deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const deadlineDate = parseDeadlineDate(event.deadline);
            if (deadlineDate && deadlineDate >= today) {
                const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntil <= 7) {
                    details.push({
                        type: 'deadline',
                        title: 'Deadline Soon',
                        description: `Only ${daysUntil} day${daysUntil > 1 ? 's' : ''} left to register`,
                        color: 'red'
                    });
                } else if (daysUntil <= 14) {
                    details.push({
                        type: 'deadline',
                        title: 'Upcoming Deadline',
                        description: `${daysUntil} days to register`,
                        color: 'orange'
                    });
                }
            }
        }

        return details;
    };

    const parseDeadlineDate = (deadline) => {
        try {
            const date = new Date(deadline);
            return isNaN(date.getTime()) ? null : date;
        } catch {
            return null;
        }
    };

    // Icon components for each type
    const getIcon = (type) => {
        switch (type) {
            case 'skill':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'college':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case 'eligibility':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'deadline':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getColorClasses = (color) => {
        const colors = {
            indigo: {
                bg: 'bg-indigo-50',
                border: 'border-indigo-200',
                icon: 'bg-indigo-100 text-indigo-600',
                text: 'text-indigo-900'
            },
            emerald: {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                icon: 'bg-emerald-100 text-emerald-600',
                text: 'text-emerald-900'
            },
            red: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: 'bg-red-100 text-red-600',
                text: 'text-red-900'
            },
            orange: {
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                icon: 'bg-orange-100 text-orange-600',
                text: 'text-orange-900'
            }
        };
        return colors[color] || colors.indigo;
    };

    const details = getExplanationDetails();

    if (details.length === 0) {
        return null;
    }

    return (
        <div className="mt-4">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
            >
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="group-hover:underline">Why this event?</span>
                <span className="text-xs text-gray-500">({details.length} reason{details.length > 1 ? 's' : ''})</span>
            </button>

            {/* Expanded Explanation */}
            {isExpanded && (
                <div className="mt-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-bold text-gray-900">
                            Why this event is recommended
                        </p>
                    </div>

                    {details.map((detail, index) => {
                        const colors = getColorClasses(detail.color);
                        return (
                            <div key={index} className={`flex items-start gap-3 p-3 ${colors.bg} border ${colors.border} rounded-lg transition-all hover:shadow-sm`}>
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                                    {getIcon(detail.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold ${colors.text} mb-1`}>{detail.title}</p>
                                    <p className="text-sm text-gray-600">{detail.description}</p>

                                    {/* Skill Tags */}
                                    {detail.skills && detail.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {detail.skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs font-semibold px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-full shadow-sm"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer Note */}
                    <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="text-xs text-gray-500">
                                Based on your profile: <span className="font-medium">{userProfile?.skills?.length || 0} skills</span>, <span className="font-medium">{userProfile?.college || 'no college'}</span>, <span className="font-medium">{userProfile?.year || 'no year'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventExplanation;
