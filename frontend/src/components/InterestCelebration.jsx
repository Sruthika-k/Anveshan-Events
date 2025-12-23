import { useState, useEffect } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';

function InterestCelebration({ show, interestCount, onComplete }) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showPlusOne, setShowPlusOne] = useState(false);

    useEffect(() => {
        if (show) {
            // Trigger confetti
            setShowConfetti(true);

            // Show +1 indicator
            setShowPlusOne(true);
            setTimeout(() => setShowPlusOne(false), 1000);

            // Show toast
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                if (onComplete) onComplete();
            }, 3000);

            // Reset confetti after animation
            setTimeout(() => setShowConfetti(false), 2000);
        }
    }, [show, onComplete]);

    const getToastMessage = () => {
        if (interestCount <= 10) {
            return "You're among the early adopters! 🎉";
        } else if (interestCount <= 50) {
            return `You're one of ${interestCount} interested students! 🎉`;
        } else {
            return `Join ${interestCount}+ students already interested! 🎉`;
        }
    };

    return (
        <>
            {/* Confetti Explosion */}
            {showConfetti && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <ConfettiExplosion
                        force={0.6}
                        duration={2000}
                        particleCount={50}
                        width={800}
                        colors={['#6366f1', '#8b5cf6', '#3b82f6', '#a855f7', '#6366f1']}
                    />
                </div>
            )}

            {/* +1 Floating Indicator */}
            {showPlusOne && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                    <div className="animate-float-up text-4xl font-bold text-indigo-600">
                        +1
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="font-semibold">{getToastMessage()}</p>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1.5);
          }
        }

        @keyframes slide-down {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
}

export default InterestCelebration;
