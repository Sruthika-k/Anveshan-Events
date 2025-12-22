import { useMemo } from 'react';
import { calculateTeamCompatibility } from '../lib/teamCompatibility.js';

/**
 * TeamDiscovery Component
 * Shows compatible teams to interested users
 * Privacy-first: only shows teams to interested users
 */
function TeamDiscovery({
    userProfile,
    teams = [],
    eventRequiredSkills = [],
    onJoinTeam
}) {
    // Calculate compatibility for each team
    const rankedTeams = useMemo(() => {
        if (!userProfile?.skills) return [];

        return teams
            .map(team => {
                // Get team's primary college (most common among members)
                const colleges = team.members?.map(m => m.college).filter(Boolean) || [];
                const teamCollege = colleges.length > 0 ? colleges[0] : null;

                const compatibility = calculateTeamCompatibility(
                    userProfile.skills,
                    team.members || [],
                    eventRequiredSkills,
                    userProfile.college,
                    teamCollege
                );

                return {
                    ...team,
                    compatibility
                };
            })
            .filter(team => team.compatibility.score > 0) // Only show compatible teams
            .sort((a, b) => b.compatibility.score - a.compatibility.score); // Best fit first
    }, [userProfile, teams, eventRequiredSkills]);

    if (!userProfile?.skills || userProfile.skills.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    Add skills to your profile to see compatible teams
                </p>
            </div>
        );
    }

    if (rankedTeams.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                    No compatible teams yet. Create one or wait for others!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900">
                    Recommended Teams ({rankedTeams.length})
                </h3>
            </div>

            {rankedTeams.map(team => {
                const { compatibility } = team;

                // Color based on fit level
                const fitColors = {
                    'High fit': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
                    'Medium fit': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
                    'Low fit': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100' }
                };
                const colors = fitColors[compatibility.fitLevel] || fitColors['Low fit'];

                return (
                    <div
                        key={team.id}
                        className={`${colors.bg} border ${colors.border} rounded-xl p-5 transition-all hover:shadow-md`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">{team.name}</h4>
                                    <span className={`text-xs font-bold px-2 py-1 ${colors.badge} ${colors.text} rounded-full`}>
                                        {compatibility.fitLevel}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                                </p>
                            </div>
                            <button
                                onClick={() => onJoinTeam(team.id)}
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                Join Team
                            </button>
                        </div>

                        {/* Compatibility Breakdown */}
                        <div className="space-y-3">
                            {/* Skills You Fill */}
                            {compatibility.skillsUserFills.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1.5">
                                        🎯 Skills you bring that team needs:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {compatibility.skillsUserFills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300"
                                            >
                                                {skill} ✓
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shared Skills */}
                            {compatibility.sharedSkills.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1.5">
                                        🤝 Skills you share:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {compatibility.sharedSkills.slice(0, 3).map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {compatibility.sharedSkills.length > 3 && (
                                            <span className="text-xs text-gray-500">
                                                +{compatibility.sharedSkills.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Gap Filled */}
                            {compatibility.totalGaps > 0 && (
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-gray-700">
                                            Event skill gaps you fill:
                                        </span>
                                        <span className={`font-bold ${compatibility.gapsFilled > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                            {compatibility.gapsFilled}/{compatibility.totalGaps}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Score Breakdown */}
                            <div className="pt-2 border-t border-gray-200">
                                <details className="text-xs">
                                    <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                                        How is compatibility calculated? (Score: {compatibility.score})
                                    </summary>
                                    <div className="mt-2 space-y-1 pl-4">
                                        {compatibility.scoreFactors.map((factor, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-gray-600">•</span>
                                                <span className="text-gray-600">
                                                    <span className="font-medium">{factor.factor}</span>: +{factor.points} points
                                                    {factor.details && <span className="text-gray-500"> ({factor.details})</span>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default TeamDiscovery;
