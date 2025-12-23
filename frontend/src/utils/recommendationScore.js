import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculate skill match percentage
 * @param {Array} userSkills - User's skills
 * @param {Array} requiredSkills - Event's required skills
 * @returns {number} Match percentage (0-100)
 */
export const calculateSkillMatch = (userSkills = [], requiredSkills = []) => {
    if (!requiredSkills || requiredSkills.length === 0) return 0;

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const matchingSkills = requiredSkills.filter(skill =>
        userSkillsLower.includes(skill.toLowerCase())
    );

    return Math.round((matchingSkills.length / requiredSkills.length) * 100);
};

/**
 * Calculate urgency score based on deadline
 * @param {string} deadline - Event deadline (ISO string)
 * @returns {number} Urgency score (0-100)
 */
export const calculateUrgencyScore = (deadline) => {
    if (!deadline) return 0;

    const daysUntil = differenceInDays(parseISO(deadline), new Date());

    // More urgent = higher score
    if (daysUntil < 0) return 0; // Past deadline
    if (daysUntil <= 3) return 100; // Very urgent
    if (daysUntil <= 7) return 80;
    if (daysUntil <= 14) return 60;
    if (daysUntil <= 30) return 40;
    return 20; // More than 30 days
};

/**
 * Calculate college match score
 * @param {string} userCollege - User's college
 * @param {string} eventCollege - Event's college
 * @returns {number} College match score (0-100)
 */
export const calculateCollegeMatch = (userCollege, eventCollege) => {
    if (!userCollege || !eventCollege) return 0;
    return userCollege.toLowerCase() === eventCollege.toLowerCase() ? 100 : 0;
};

/**
 * Calculate overall recommendation score
 * @param {object} event - Event object
 * @param {object} userProfile - User profile
 * @returns {number} Overall score (0-100)
 */
export const calculateRecommendationScore = (event, userProfile) => {
    const skillMatch = calculateSkillMatch(
        userProfile?.skills || [],
        event?.required_skills || []
    );

    const urgency = calculateUrgencyScore(event?.deadline);

    const collegeMatch = calculateCollegeMatch(
        userProfile?.college,
        event?.college
    );

    // Weighted average: skills (60%), urgency (30%), college (10%)
    const score = (skillMatch * 0.6) + (urgency * 0.3) + (collegeMatch * 0.1);

    return Math.round(score);
};

/**
 * Categorize skills into matching and missing
 * @param {Array} userSkills - User's skills
 * @param {Array} requiredSkills - Event's required skills
 * @returns {object} Categorized skills
 */
export const categorizeSkills = (userSkills = [], requiredSkills = []) => {
    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    const matching = requiredSkills.filter(skill =>
        userSkillsLower.includes(skill.toLowerCase())
    );

    const missing = requiredSkills.filter(skill =>
        !userSkillsLower.includes(skill.toLowerCase())
    );

    return { matching, missing };
};

/**
 * Get match quality label
 * @param {number} score - Match score (0-100)
 * @returns {string} Quality label
 */
export const getMatchQuality = (score) => {
    if (score >= 90) return 'Perfect Match';
    if (score >= 80) return 'Excellent Match';
    if (score >= 70) return 'Great Match';
    if (score >= 60) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Low Match';
};

/**
 * Get match color classes
 * @param {number} score - Match score (0-100)
 * @returns {object} Color classes
 */
export const getMatchColors = (score) => {
    if (score >= 80) {
        return {
            badge: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
            border: 'border-l-4 border-green-500',
            text: 'text-green-600',
            ring: 'ring-2 ring-green-500 ring-offset-2'
        };
    }
    if (score >= 60) {
        return {
            badge: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
            border: 'border-l-4 border-blue-500',
            text: 'text-blue-600',
            ring: 'ring-2 ring-blue-500 ring-offset-2'
        };
    }
    return {
        badge: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
        border: 'border-l-4 border-gray-500',
        text: 'text-gray-600',
        ring: ''
    };
};

/**
 * Sort events by recommendation score
 * @param {Array} events - Array of events
 * @param {object} userProfile - User profile
 * @returns {Array} Sorted events with scores
 */
export const rankRecommendations = (events, userProfile) => {
    return events
        .map(event => ({
            ...event,
            recommendationScore: calculateRecommendationScore(event, userProfile),
            skillMatch: calculateSkillMatch(userProfile?.skills, event?.required_skills)
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);
};
