import { useState, useEffect, useRef } from 'react';
import { generatePitch, validatePitch, copyToClipboard, generateMailtoLink } from '../utils/generatePitch.js';

function QuickPitchModal({
    isOpen,
    onClose,
    team,
    event,
    userProfile,
    compatibilityScore
}) {
    const [pitch, setPitch] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [pitchQuality, setPitchQuality] = useState(null);
    const [teamCreatorLinkedIn, setTeamCreatorLinkedIn] = useState(null);
    const modalRef = useRef(null);
    const textareaRef = useRef(null);

    // Generate initial pitch when modal opens
    useEffect(() => {
        if (isOpen && userProfile && team && event) {
            const generatedPitch = generatePitch({
                userName: userProfile.name,
                userCollege: userProfile.college,
                userSkills: userProfile.skills || [],
                userEmail: userProfile.email,
                userLinkedIn: userProfile.linkedin_url,
                userGitHub: userProfile.github_url,
                teamName: team.name,
                eventName: event.title,
                compatibilityScore
            });

            setPitch(generatedPitch);
            setCharCount(generatedPitch.length);

            // Validate initial pitch
            const validation = validatePitch(generatedPitch);
            setPitchQuality(validation);
        }
    }, [isOpen, userProfile, team, event, compatibilityScore]);

    // Fetch team creator's LinkedIn
    useEffect(() => {
        if (isOpen && team?.members && team.members.length > 0) {
            const creator = team.members[0]; // Assuming first member is creator
            if (creator?.linkedin_url) {
                setTeamCreatorLinkedIn(creator.linkedin_url);
            }
        }
    }, [isOpen, team]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Handle outside click
    const handleOverlayClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    // Handle pitch edit
    const handlePitchChange = (e) => {
        const newPitch = e.target.value;
        setPitch(newPitch);
        setCharCount(newPitch.length);

        // Re-validate
        const validation = validatePitch(newPitch);
        setPitchQuality(validation);
    };

    // Handle copy to clipboard
    const handleCopy = async () => {
        const success = await copyToClipboard(pitch);
        if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // Handle email
    const handleEmail = () => {
        const mailtoLink = generateMailtoLink(pitch, `Team Collaboration - ${event?.title}`);
        window.location.href = mailtoLink;
    };

    // Handle LinkedIn contact
    const handleLinkedIn = () => {
        if (teamCreatorLinkedIn) {
            window.open(teamCreatorLinkedIn, '_blank', 'noopener,noreferrer');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Quick Pitch</h2>
                            <p className="text-sm text-indigo-100">Reach out to {team?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Compatibility Badge */}
                    {compatibilityScore && (
                        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-green-700">
                                {compatibilityScore}% Match
                            </span>
                        </div>
                    )}

                    {/* Editable Pitch */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Message
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={pitch}
                            onChange={handlePitchChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none font-mono text-sm"
                            rows={12}
                            placeholder="Your pitch will appear here..."
                        />
                    </div>

                    {/* Character Count & Quality */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <span className={`text-sm font-medium ${charCount < 150 ? 'text-orange-600' :
                                    charCount > 500 ? 'text-red-600' :
                                        'text-green-600'
                                }`}>
                                {charCount} characters
                            </span>
                            {pitchQuality && (
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${pitchQuality.quality === 'Excellent' ? 'bg-green-100 text-green-700' :
                                        pitchQuality.quality === 'Good' ? 'bg-blue-100 text-blue-700' :
                                            pitchQuality.quality === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                    }`}>
                                    {pitchQuality.quality}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500">
                            Recommended: 150-300 chars
                        </span>
                    </div>

                    {/* Quality Feedback */}
                    {pitchQuality && pitchQuality.feedback.length > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm font-semibold text-yellow-800 mb-2">💡 Tips to improve:</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                {pitchQuality.feedback.map((tip, index) => (
                                    <li key={index}>• {tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
                    <button
                        onClick={handleCopy}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isCopied
                                ? 'bg-green-600 text-white'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                            }`}
                    >
                        {isCopied ? (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Copied! ✓
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy to Clipboard
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleEmail}
                        className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                    </button>

                    {teamCreatorLinkedIn && (
                        <button
                            onClick={handleLinkedIn}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            LinkedIn
                        </button>
                    )}
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

export default QuickPitchModal;
