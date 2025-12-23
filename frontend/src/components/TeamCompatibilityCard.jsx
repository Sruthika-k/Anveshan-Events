import { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { calculateTeamCompatibility, getScoreColors } from '../utils/teamCompatibility.js';
import QuickPitchModal from './QuickPitchModal.jsx';

function TeamCompatibilityCard({
    team,
    event,
    userProfile,
    onJoinTeam,
    isUserInTeam,
    isJoining = false,
    disabled = false,
    animationDelay = 0
}) {
    const [compatibility, setCompatibility] = useState(null);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [showPitchModal, setShowPitchModal] = useState(false);
    const cardRef = useRef(null);

    // Calculate compatibility on mount
    useEffect(() => {
        if (userProfile && team && event) {
            const result = calculateTeamCompatibility(userProfile, team, event);
            setCompatibility(result);
        }
    }, [userProfile, team, event]);

    // Entry animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, animationDelay);
        return () => clearTimeout(timer);
    }, [animationDelay]);

    // Animate score counter
    useEffect(() => {
        if (!compatibility || !isVisible) return;

        let startTime;
        const duration = 1500; // 1.5 seconds
        const targetScore = compatibility.score;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease-out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.floor(targetScore * easeOut));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatedScore(targetScore);
            }
        };

        requestAnimationFrame(animate);
    }, [compatibility, isVisible]);

    if (!compatibility) {
        return null; // Or skeleton loader
    }

    const colors = getScoreColors(animatedScore);
    const isHighMatch = animatedScore >= 80;

    return (
        <>
            <div
                ref={cardRef}
                className={`
          bg-white rounded-2xl border-2 overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          ${isHighMatch ? `${colors.border} shadow-lg` : 'border-gray-200 shadow-md'}
          ${isUserInTeam ? 'ring-4 ring-blue-400' : ''}
          hover:shadow-2xl hover:-translate-y-2
          ${isHighMatch ? 'hover:ring-4 hover:' + colors.ring : ''}
        `}
                style={{
                    animation: isHighMatch && isVisible ? 'pulse-border 2s ease-in-out infinite' : 'none'
                }}
            >
                {/* Header */}
                <div className={`px-6 py-4 ${isHighMatch ? `bg-gradient-to-r ${colors.gradient}` : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{isHighMatch ? '🏆' : '👥'}</span>
                            <h3 className={`text-lg font-bold ${isHighMatch ? 'text-white' : 'text-gray-900'}`}>
                                {team.name}
                            </h3>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-semibold ${isHighMatch ? 'text-white' : 'text-gray-600'}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            {team.member_count || team.members?.length || 0} members
                        </div>
                    </div>
                </div>

                {/* Score Circle */}
                <div className="px-6 py-8 flex flex-col items-center">
                    <div className="w-32 h-32 mb-4">
                        <CircularProgressbar
                            value={animatedScore}
                            text={`${animatedScore}%`}
                            styles={buildStyles({
                                rotation: 0,
                                strokeLinecap: 'round',
                                textSize: '24px',
                                pathTransitionDuration: 0.5,
                                pathColor: isHighMatch ? '#10b981' : animatedScore >= 60 ? '#f59e0b' : '#9ca3af',
                                textColor: isHighMatch ? '#10b981' : animatedScore >= 60 ? '#f59e0b' : '#9ca3af',
                                trailColor: '#e5e7eb',
                            })}
                        />
                    </div>
                    <p className={`text-sm font-semibold ${colors.text}`}>
                        {isHighMatch ? '🎯 Excellent Match!' : animatedScore >= 60 ? '✓ Good Match' : 'Potential Match'}
                    </p>
                </div>

                {/* Skills Breakdown */}
                <div className="px-6 py-4 space-y-4 border-t border-gray-200">
                    {/* Skills You Bring */}
                    {compatibility.missingSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">✅</span>
                                <p className="text-sm font-semibold text-gray-700">Skills You Bring (They Need)</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {compatibility.missingSkills.map((skill, index) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300 animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills They Have */}
                    {compatibility.matchingSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🤝</span>
                                <p className="text-sm font-semibold text-gray-700">Skills They Have</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {compatibility.matchingSkills.slice(0, 5).map((skill, index) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-300 animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {compatibility.matchingSkills.length > 5 && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                        +{compatibility.matchingSkills.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Skills Still Needed */}
                    {compatibility.gapSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">🎯</span>
                                <p className="text-sm font-semibold text-gray-700">Still Needed</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {compatibility.gapSkills.slice(0, 4).map((skill, index) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-300 animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Why Join Section */}
                {compatibility.reasons.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg">💡</span>
                            <p className="text-sm font-semibold text-gray-700">Why join this team:</p>
                        </div>
                        <ul className="space-y-1 ml-7">
                            {compatibility.reasons.slice(0, 3).map((reason, index) => (
                                <li key={index} className="text-sm text-gray-600">• {reason}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
                    {!isUserInTeam && (
                        <button
                            onClick={() => setShowPitchModal(true)}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Quick Pitch
                        </button>
                    )}

                    {isUserInTeam ? (
                        <div className="flex-1 py-3 bg-blue-100 text-blue-700 font-semibold rounded-lg text-center flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Your Team
                        </div>
                    ) : (
                        <button
                            onClick={onJoinTeam}
                            disabled={disabled || isJoining}
                            className={`
                flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isHighMatch
                                    ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-lg`
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }
              `}
                        >
                            {isJoining ? 'Joining...' : isHighMatch ? '🎯 Perfect Match - Join!' : 'Join Team'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Pitch Modal */}
            <QuickPitchModal
                isOpen={showPitchModal}
                onClose={() => setShowPitchModal(false)}
                team={team}
                event={event}
                userProfile={userProfile}
                compatibilityScore={animatedScore}
            />

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }

        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
        </>
    );
}

export default TeamCompatibilityCard;
