import { useState, useEffect } from 'react';
import { categorizeSkills } from '../utils/recommendationScore.js';

function SkillMatchBar({ userSkills = [], requiredSkills = [], matchPercentage }) {
    const [animatedWidth, setAnimatedWidth] = useState(0);
    const { matching, missing } = categorizeSkills(userSkills, requiredSkills);

    // Animate bar fill on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedWidth(matchPercentage);
        }, 100);

        return () => clearTimeout(timer);
    }, [matchPercentage]);

    if (!requiredSkills || requiredSkills.length === 0) {
        return (
            <div className="text-xs text-gray-500 italic">
                No specific skills required
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">
                        Skill Match
                    </span>
                    <span className={`font-bold ${matchPercentage >= 80 ? 'text-green-600' :
                            matchPercentage >= 60 ? 'text-blue-600' :
                                'text-gray-600'
                        }`}>
                        {matchPercentage}%
                    </span>
                </div>

                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    {/* Filled portion */}
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${matchPercentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                matchPercentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                    'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                        style={{ width: `${animatedWidth}%` }}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                </div>
            </div>

            {/* Skill Badges */}
            <div className="space-y-2">
                {/* Matching Skills */}
                {matching.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">
                            ✓ You Have ({matching.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {matching.map((skill, index) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300 animate-fade-in"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Missing Skills */}
                {missing.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">
                            ⚠ Learn These ({missing.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {missing.slice(0, 3).map((skill, index) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-300 animate-fade-in"
                                    style={{
                                        animationDelay: `${(matching.length + index) * 50}ms`,
                                        animationFillMode: 'backwards'
                                    }}
                                >
                                    {skill}
                                </span>
                            ))}
                            {missing.length > 3 && (
                                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-semibold rounded-full border border-gray-200">
                                    +{missing.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Text */}
            <p className="text-xs text-gray-600">
                You have <span className="font-bold text-green-600">{matching.length}</span> of{' '}
                <span className="font-bold">{requiredSkills.length}</span> required skills
            </p>

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
}

export default SkillMatchBar;
