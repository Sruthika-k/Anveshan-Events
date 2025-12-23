// =====================================================
// TEAM COMPATIBILITY ALGORITHM
// =====================================================
// Purpose: Calculate how well a user matches with a team
// Returns: Score (0-100) + detailed breakdown
// =====================================================

/**
 * Calculate team compatibility score for a user
 * @param {Object} userProfile - User's profile with skills, college, etc.
 * @param {Object} team - Team object with members array
 * @param {Object} event - Event object with required_skills
 * @returns {Object} Compatibility data with score and breakdown
 */
export function calculateTeamCompatibility(userProfile, team, event) {
    // Safety checks
    if (!userProfile || !team || !event) {
        return getDefaultCompatibility();
    }

    let score = 0;
    const weights = {
        skillMatch: 0.50,      // 50% - most important
        skillGap: 0.25,        // 25% - what you bring that they need
        collegeMatch: 0.15,    // 15% - same college bonus
        teamSize: 0.10         // 10% - smaller teams preferred
    };

    // Get skills
    const userSkills = userProfile.skills || [];
    const teamSkills = getTeamCombinedSkills(team.members || []);
    const eventRequired = event.required_skills || [];

    // Handle edge case: no required skills
    if (eventRequired.length === 0) {
        return {
            score: 50, // Neutral score
            matchingSkills: [],
            missingSkills: [],
            gapSkills: [],
            sameCollege: false,
            breakdown: {
                skillMatch: 0,
                skillGap: 0,
                college: 0,
                teamSize: 50
            },
            reasons: ['No specific skills required for this event']
        };
    }

    // 1. SKILL MATCH (your skills they already have)
    const matchingSkills = userSkills.filter(s =>
        eventRequired.includes(s) && teamSkills.includes(s)
    );
    const skillMatchScore = (matchingSkills.length / eventRequired.length) * 100;

    // 2. SKILL GAP (skills you have that team is missing)
    const missingSkills = eventRequired.filter(s =>
        userSkills.includes(s) && !teamSkills.includes(s)
    );
    const skillGapScore = (missingSkills.length / eventRequired.length) * 100;

    // 3. COLLEGE MATCH
    const sameCollege = (team.members || []).some(m =>
        m.college === userProfile.college
    );
    const collegeScore = sameCollege ? 100 : 0;

    // 4. TEAM SIZE (prefer teams with 1-2 members over 3+)
    const memberCount = team.member_count || (team.members || []).length;
    const teamSizeScore = memberCount <= 2 ? 100 : 50;

    // WEIGHTED TOTAL
    score = (
        skillMatchScore * weights.skillMatch +
        skillGapScore * weights.skillGap +
        collegeScore * weights.collegeMatch +
        teamSizeScore * weights.teamSize
    );

    // Calculate skills still needed by team
    const gapSkills = eventRequired.filter(s => !teamSkills.includes(s));

    // Generate reasons for joining
    const reasons = generateReasons({
        missingSkills,
        matchingSkills,
        sameCollege,
        memberCount,
        gapSkills
    });

    return {
        score: Math.round(Math.min(score, 100)),
        matchingSkills,
        missingSkills,
        gapSkills,
        sameCollege,
        breakdown: {
            skillMatch: Math.round(skillMatchScore * weights.skillMatch),
            skillGap: Math.round(skillGapScore * weights.skillGap),
            college: Math.round(collegeScore * weights.collegeMatch),
            teamSize: Math.round(teamSizeScore * weights.teamSize)
        },
        reasons
    };
}

/**
 * Get combined unique skills from all team members
 * @param {Array} members - Array of team member objects
 * @returns {Array} Unique skills array
 */
function getTeamCombinedSkills(members) {
    if (!Array.isArray(members)) return [];

    const allSkills = members.flatMap(m => {
        // Handle different possible data structures
        if (m.profile?.skills) return m.profile.skills;
        if (m.skills) return m.skills;
        return [];
    });

    return [...new Set(allSkills)]; // unique skills
}

/**
 * Generate human-readable reasons for match score
 * @param {Object} data - Match data
 * @returns {Array} Array of reason strings
 */
function generateReasons({ missingSkills, matchingSkills, sameCollege, memberCount, gapSkills }) {
    const reasons = [];

    // Skill gap reasons (most important)
    if (missingSkills.length > 0) {
        if (missingSkills.length === 1) {
            reasons.push(`You fill a critical skill gap: ${missingSkills[0]}`);
        } else {
            reasons.push(`You fill ${missingSkills.length} critical skill gaps`);
        }
    }

    // Skill match reasons
    if (matchingSkills.length > 0) {
        if (matchingSkills.length === 1) {
            reasons.push(`You share ${matchingSkills[0]} expertise`);
        } else {
            reasons.push(`You share ${matchingSkills.length} key skills with the team`);
        }
    }

    // College match
    if (sameCollege) {
        reasons.push('Team members from your college');
    }

    // Team size
    if (memberCount === 1) {
        reasons.push('Solo founder looking for teammates');
    } else if (memberCount === 2) {
        reasons.push('Small team with room to grow');
    }

    // Still needed skills
    if (gapSkills.length > 0 && missingSkills.length === 0) {
        reasons.push(`Team still needs: ${gapSkills.slice(0, 2).join(', ')}`);
    }

    // Default if no specific reasons
    if (reasons.length === 0) {
        reasons.push('Good general fit for this team');
    }

    return reasons;
}

/**
 * Get default compatibility object for error cases
 * @returns {Object} Default compatibility data
 */
function getDefaultCompatibility() {
    return {
        score: 0,
        matchingSkills: [],
        missingSkills: [],
        gapSkills: [],
        sameCollege: false,
        breakdown: {
            skillMatch: 0,
            skillGap: 0,
            college: 0,
            teamSize: 0
        },
        reasons: ['Unable to calculate compatibility']
    };
}

/**
 * Get color classes based on compatibility score
 * @param {number} score - Compatibility score (0-100)
 * @returns {Object} Color classes for different elements
 */
export function getScoreColors(score) {
    if (score >= 80) {
        return {
            gradient: 'from-green-400 to-green-600',
            text: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-500',
            ring: 'ring-green-500'
        };
    }
    if (score >= 60) {
        return {
            gradient: 'from-yellow-400 to-orange-500',
            text: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-500',
            ring: 'ring-orange-500'
        };
    }
    return {
        gradient: 'from-gray-400 to-gray-600',
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-500',
        ring: 'ring-gray-500'
    };
}

/**
 * Categorize skills into different types
 * @param {Array} skills - Array of skill strings
 * @returns {Object} Categorized skills
 */
export function categorizeSkills(skills) {
    const categories = {
        programming: ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust', 'TypeScript'],
        ml: ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science'],
        web: ['React', 'Node.js', 'HTML', 'CSS', 'Vue', 'Angular', 'Next.js'],
        mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'],
        data: ['SQL', 'MongoDB', 'PostgreSQL', 'Data Analysis', 'Big Data'],
        design: ['UI/UX', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
        other: []
    };

    const categorized = {
        programming: [],
        ml: [],
        web: [],
        mobile: [],
        data: [],
        design: [],
        other: []
    };

    skills.forEach(skill => {
        let placed = false;
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()))) {
                categorized[category].push(skill);
                placed = true;
                break;
            }
        }
        if (!placed) {
            categorized.other.push(skill);
        }
    });

    return categorized;
}
