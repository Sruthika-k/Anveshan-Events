import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-slate-200/60 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Anveshan Logo"
                                className="w-9 h-9 object-contain"
                            />

                            <span className="text-xl font-bold text-slate-900 tracking-tight">Anveshan</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden sm:block text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Mesh Gradient */}
            <HeroSection navigate={navigate} />

            {/* Problem Section - Plain White */}
            <ProblemSection />

            {/* Solution Section - Light Gray */}
            <SolutionSection />

            {/* How It Works - White */}
            <HowItWorksSection />

            {/* Trust Section - Dot Pattern */}
            <TrustSection />

            {/* CTA Section - Indigo Gradient */}
            <CTASection navigate={navigate} />

            {/* Footer */}
            <Footer navigate={navigate} />
        </div>
    );
}

// Hero Section Component
function HeroSection({ navigate }) {
    return (
        <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 mesh-gradient">
            <div className="max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200/60 rounded-full mb-8">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-sm font-semibold text-emerald-700">For College Students</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                        Discover Events.<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                            Connect with Teams.
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl sm:text-2xl text-slate-600 mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
                        Find hackathons, workshops, and competitions across India's top colleges. See who's interested and team up.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="group px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 w-full sm:w-auto"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Get Started Free
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Problem Section Component
function ProblemSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        The Problem
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        Students face real challenges discovering and participating in events
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <ProblemCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title="Events Are Scattered"
                        description="Opportunities spread across WhatsApp, Instagram, and notice boards. No single source of truth."
                    />
                    <ProblemCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title="Deadlines Get Missed"
                        description="Registration dates pass by because there's no centralized place to track what's coming up."
                    />
                    <ProblemCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                        title="Hard to Find Teammates"
                        description="You want to participate but don't know who else is interested or looking for a team."
                    />
                </div>
            </div>
        </section>
    );
}

// Solution Section Component
function SolutionSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        How Anveshan Helps
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        One platform to discover events and connect with the right people
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <FeatureCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                        title="Centralized Discovery"
                        description="Browse hackathons, workshops, and competitions from IITs, NITs, and top colleges in one place."
                    />
                    <FeatureCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title="Relevant Opportunities"
                        description="See events that match your eligibility. Filter by category, college, and deadline."
                    />
                    <FeatureCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        }
                        title="Never Miss Deadlines"
                        description="Track registration dates and get a clear view of what's closing soon."
                    />
                    <FeatureCard
                        icon={
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        }
                        title="Find Your Team"
                        description="See who else is interested in an event and connect with potential teammates."
                    />
                </div>
            </div>
        </section>
    );
}

// How It Works Section Component
function HowItWorksSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-5xl mx-auto">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        How It Works
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        Get started in three simple steps
                    </p>
                </div>

                <div className="space-y-12">
                    <StepCard
                        number="1"
                        title="Sign Up with Your College Email"
                        description="Create an account to start discovering events relevant to you."
                    />
                    <StepCard
                        number="2"
                        title="Explore Upcoming Events"
                        description="Browse hackathons, workshops, and competitions. Filter by category, deadline, and location."
                    />
                    <StepCard
                        number="3"
                        title="Connect and Team Up"
                        description="View other students interested in the same event and form teams together."
                    />
                </div>
            </div>
        </section>
    );
}

// Trust Section with Dot Pattern
function TrustSection() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 dot-pattern">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        Built for Students
                    </h2>
                    <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                        Designed to reduce noise, not add more. We focus on showing you relevant events and helping you connect—nothing more, nothing less.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Simple & Focused</h3>
                        <p className="text-slate-600 font-medium">
                            No clutter. Just events, deadlines, and connections.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Student-First</h3>
                        <p className="text-slate-600 font-medium">
                            Built by students who understand the problem firsthand.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Always Improving</h3>
                        <p className="text-slate-600 font-medium">
                            Continuously adding features based on real feedback.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// CTA Section Component
function CTASection({ navigate }) {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-indigo-700">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                    Ready to Get Started?
                </h2>
                <p className="text-xl text-indigo-100 mb-10 font-medium max-w-2xl mx-auto">
                    Join students across India discovering opportunities and building teams
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="group px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Sign Up Now
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all hover:-translate-y-0.5"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </section>
    );
}

// Footer Component
function Footer({ navigate }) {
    return (
        <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Anveshan Logo"
                            className="w-9 h-9 object-contain"
                        />

                        <div>
                            <span className="text-lg font-bold text-slate-900">Anveshan</span>
                            <p className="text-sm text-slate-600 font-medium">Discover events. Connect with teams.</p>
                        </div>
                    </div>
                    <div className="flex gap-8">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
                <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                    © 2025 Anveshan. Built for college students.
                </div>
            </div>
        </footer>
    );
}

// Reusable Components

function ProblemCard({ icon, title, description }) {
    return (
        <div className="group bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all hover:-translate-y-1 hover:scale-[1.02]">
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-200 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">{description}</p>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="group bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all hover:-translate-y-1 hover:scale-[1.02]">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 text-white shadow-sm group-hover:shadow-md transition-shadow">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }) {
    return (
        <div className="flex gap-6 items-start group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                {number}
            </div>
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    );
}

export default LandingPage;
