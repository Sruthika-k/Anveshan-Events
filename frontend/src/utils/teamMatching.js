/**
 * Team Matching Utility Functions
 * Calculates team compatibility scores and categorizes skills
 */

/**
 * Calculate compatibility score between user and team
 * @param {string[]} userSkills - User's skills array
 * @param {string[]} teamSkills - Combined skills of all team members
 * @param {string[]} requiredSkills - Event's required skills
 * @param {string} userCollege - User's college
 * @param {string} teamCollege - Team members' college (first member's college)
 * @returns {number} Compatibility score (0-100)
 */
export const calculateTeamCompatibility = (
    userSkills = [],
    teamSkills = [],
    requiredSkills = [],
    userCollege = '',
    teamCollege = ''
) => {
    // Normalize to lowercase for comparison
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
    const normalizedTeamSkills = teamSkills.map(s => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    // If no required skills, base score on user-team skill overlap
    if (normalizedRequiredSkills.length === 0) {
        const combinedSkills = [...new Set([...normalizedTeamSkills])];
        const matchingSkills = normalizedUserSkills.filter(skill =>
            combinedSkills.includes(skill)
        );

        let baseScore = combinedSkills.length > 0
            ? (matchingSkills.length / combinedSkills.length) * 100
            : 50; // Default score if no skills

        // College bonus
        if (userCollege && teamCollege && userCollege.toLowerCase() === teamCollege.toLowerCase()) {
            baseScore += 10;
        }

        return Math.min(Math.round(baseScore), 100);
    }

    // Calculate how many required skills the user has that the team needs
    const userHasRequired = normalizedUserSkills.filter(skill =>
        normalizedRequiredSkills.includes(skill)
    );

    // Calculate how many required skills the team already has
    const teamHasRequired = normalizedTeamSkills.filter(skill =>
        normalizedRequiredSkills.includes(skill)
    );

    // Skills user brings that team doesn't have
    const userBringsNew = userHasRequired.filter(skill =>
        !normalizedTeamSkills.includes(skill)
    );

    // Base score: percentage of required skills covered by user + team
    const combinedCoverage = new Set([...userHasRequired, ...teamHasRequired]);
    let baseScore = (combinedCoverage.size / normalizedRequiredSkills.length) * 100;

    // Bonus for bringing new skills (up to 20%)
    const newSkillBonus = Math.min((userBringsNew.length / normalizedRequiredSkills.length) * 20, 20);
    baseScore += newSkillBonus;

    // College bonus (10%)
    if (userCollege && teamCollege && userCollege.toLowerCase() === teamCollege.toLowerCase()) {
        baseScore += 10;
    }

    // Cap at 100%
    return Math.min(Math.round(baseScore), 100);
};

/**
 * Categorize skills for visualization
 * @param {string[]} userSkills - User's skills
 * @param {string[]} teamSkills - Team's combined skills
 * @param {string[]} requiredSkills - Event's required skills
 * @returns {object} Categorized skills
 */
export const categorizeSkills = (
    userSkills = [],
    teamSkills = [],
    requiredSkills = []
) => {
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
    const normalizedTeamSkills = teamSkills.map(s => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    // Skills you have that they need (in required but not in team)
    const youHaveTheyNeed = userSkills.filter(skill => {
        const normalized = skill.toLowerCase().trim();
        return normalizedRequiredSkills.includes(normalized) &&
            !normalizedTeamSkills.includes(normalized);
    });

    // Skills they already have (in team and in required)
    const theyAlreadyHave = teamSkills.filter(skill => {
        const normalized = skill.toLowerCase().trim();
        return normalizedRequiredSkills.includes(normalized);
    });

    // Skills you're missing (in required but not in user or team)
    const youAreMissing = requiredSkills.filter(skill => {
        const normalized = skill.toLowerCase().trim();
        return !normalizedUserSkills.includes(normalized) &&
            !normalizedTeamSkills.includes(normalized);
    });

    return {
        youHaveTheyNeed: [...new Set(youHaveTheyNeed)],
        theyAlreadyHave: [...new Set(theyAlreadyHave)],
        youAreMissing: [...new Set(youAreMissing)]
    };
};

/**
 * Get color class based on compatibility score
 * @param {number} score - Compatibility score (0-100)
 * @returns {object} Color classes for gradient and text
 */
export const getScoreColors = (score) => {
    if (score >= 80) {
        return {
            gradient: 'from-green-500 to-emerald-600',
            text: 'text-green-600',
            ring: 'text-green-500',
            bg: 'bg-green-50'
        };
    } else if (score >= 60) {
        return {
            gradient: 'from-orange-500 to-amber-600',
            text: 'text-orange-600',
            ring: 'text-orange-500',
            bg: 'bg-orange-50'
        };
    } else {
        return {
            gradient: 'from-gray-400 to-gray-500',
            text: 'text-gray-600',
            ring: 'text-gray-400',
            bg: 'bg-gray-50'
        };
    }
};
