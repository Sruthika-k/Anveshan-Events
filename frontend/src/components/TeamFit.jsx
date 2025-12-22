import { useMemo } from 'react';

/**
 * TeamFit Component
 * Shows why a user would be a good fit for a team based on skill overlap and complementary skills
 * 100% deterministic, explainable logic
 */
function TeamFit({ userSkills = [], teamMembers = [], eventRequiredSkills = [] }) {
    const analysis = useMemo(() => {
        // Get all team skills (flatten from all members)
        const teamSkills = teamMembers
            .flatMap(member => member.skills || [])
            .filter((skill, index, self) => self.indexOf(skill) === index); // unique

        // Normalize to lowercase for comparison
        const userSkillsLower = (userSkills || []).map(s => s.toLowerCase());
        const teamSkillsLower = teamSkills.map(s => s.toLowerCase());
        const eventSkillsLower = (eventRequiredSkills || []).map(s => s.toLowerCase());

        // 1. Skills you bring that team doesn't have (unique contribution)
        const uniqueSkills = userSkills.filter(skill =>
            !teamSkillsLower.includes(skill.toLowerCase())
        );

        // 2. Event skills team is missing
        const teamMissingSkills = eventRequiredSkills.filter(skill =>
            !teamSkillsLower.includes(skill.toLowerCase())
        );

        // 3. Event skills you can fill (skills team needs that you have)
        const skillsYouFill = uniqueSkills.filter(skill =>
            eventSkillsLower.includes(skill.toLowerCase())
        );

        // 4. Skills you share with team (overlap)
        const sharedSkills = userSkills.filter(skill =>
            teamSkillsLower.includes(skill.toLowerCase())
        );

        // Calculate gap filled
        const totalGaps = teamMissingSkills.length;
        const gapsFilled = skillsYouFill.length;

        return {
            uniqueSkills,
            teamMissingSkills,
            skillsYouFill,
            sharedSkills,
            totalGaps,
            gapsFilled,
            hasSkills: userSkills.length > 0,
            teamHasSkills: teamSkills.length > 0
        };
    }, [userSkills, teamMembers, eventRequiredSkills]);

    // Don't show if user has no skills
    if (!analysis.hasSkills) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                        Add skills to your profile to see how you fit with this team
                    </p>
                </div>
            </div>
        );
    }

    // Determine fit level and color
    const getFitLevel = () => {
        if (analysis.skillsYouFill.length > 0) {
            return {
                level: 'Excellent Fit',
                color: 'emerald',
                icon: '🎯',
                message: 'You fill critical skill gaps for this event'
            };
        } else if (analysis.uniqueSkills.length > 0) {
            return {
                level: 'Good Fit',
                color: 'blue',
                icon: '✨',
                message: 'You bring new skills to the team'
            };
        } else if (analysis.sharedSkills.length > 0) {
            return {
                level: 'Okay Fit',
                color: 'indigo',
                icon: '🤝',
                message: 'You share skills with the team'
            };
        } else {
            return {
                level: 'Different Skills',
                color: 'gray',
                icon: '💡',
                message: 'Your skills complement the team'
            };
        }
    };

    const fit = getFitLevel();

    const getColorClasses = (color) => {
        const colors = {
            emerald: {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-900',
                badge: 'bg-emerald-100 text-emerald-700'
            },
            blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-900',
                badge: 'bg-blue-100 text-blue-700'
            },
            indigo: {
                bg: 'bg-indigo-50',
                border: 'border-indigo-200',
                text: 'text-indigo-900',
                badge: 'bg-indigo-100 text-indigo-700'
            },
            gray: {
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                text: 'text-gray-900',
                badge: 'bg-gray-100 text-gray-700'
            }
        };
        return colors[color] || colors.gray;
    };

    const colors = getColorClasses(fit.color);

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 mt-4`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <span className="text-lg">{fit.icon}</span>
                <div className="flex-1">
                    <p className={`text-sm font-bold ${colors.text}`}>{fit.level}</p>
                    <p className="text-xs text-gray-600">{fit.message}</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                {/* Skills You Bring */}
                {analysis.uniqueSkills.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">
                            💼 You bring:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.uniqueSkills.slice(0, 5).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs font-medium px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                            {analysis.uniqueSkills.length > 5 && (
                                <span className="text-xs font-medium px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full">
                                    +{analysis.uniqueSkills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Team Needs (Event-required skills team is missing) */}
                {analysis.teamMissingSkills.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">
                            🎯 Team needs:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.teamMissingSkills.slice(0, 5).map((skill, idx) => {
                                const youHaveIt = analysis.skillsYouFill.some(s => s.toLowerCase() === skill.toLowerCase());
                                return (
                                    <span
                                        key={idx}
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${youHaveIt
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        {skill} {youHaveIt && '✓'}
                                    </span>
                                );
                            })}
                            {analysis.teamMissingSkills.length > 5 && (
                                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-300">
                                    +{analysis.teamMissingSkills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Skill Gap Filled */}
                {analysis.totalGaps > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-700">
                                📊 Skill gap filled:
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${analysis.gapsFilled > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {analysis.gapsFilled}/{analysis.totalGaps}
                                </span>
                                {analysis.gapsFilled > 0 && (
                                    <span className="text-xs text-emerald-600">
                                        ({Math.round((analysis.gapsFilled / analysis.totalGaps) * 100)}%)
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${(analysis.gapsFilled / analysis.totalGaps) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Shared Skills (if any) */}
                {analysis.sharedSkills.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">
                            🤝 Skills you share:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.sharedSkills.slice(0, 3).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs font-medium px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                            {analysis.sharedSkills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                    +{analysis.sharedSkills.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamFit;
