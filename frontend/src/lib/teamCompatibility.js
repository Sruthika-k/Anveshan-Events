/**
 * Team Compatibility & Discovery Logic
 * Helps interested users find compatible teams
 * 100% deterministic, explainable, no AI
 */

/**
 * Calculate compatibility score between user and team
 * @param {array} userSkills - User's skills
 * @param {array} teamMembers - Team members with skills
 * @param {array} eventRequiredSkills - Event's required skills
 * @param {string} userCollege - User's college
 * @param {string} teamCollege - Team's primary college (from members)
 * @returns {object} Compatibility analysis
 */
export function calculateTeamCompatibility(
    userSkills = [],
    teamMembers = [],
    eventRequiredSkills = [],
    userCollege = null,
    teamCollege = null
) {
    // Get all team skills
    const teamSkills = teamMembers
        .flatMap(member => member.skills || [])
        .filter((skill, index, self) => self.indexOf(skill) === index);

    // Normalize for comparison
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const teamSkillsLower = teamSkills.map(s => s.toLowerCase());
    const eventSkillsLower = eventRequiredSkills.map(s => s.toLowerCase());

    // 1. Skills user brings that team doesn't have
    const uniqueSkills = userSkills.filter(skill =>
        !teamSkillsLower.includes(skill.toLowerCase())
    );

    // 2. Event skills team is missing
    const teamMissingSkills = eventRequiredSkills.filter(skill =>
        !teamSkillsLower.includes(skill.toLowerCase())
    );

    // 3. Skills user can fill (intersection of unique and missing)
    const skillsUserFills = uniqueSkills.filter(skill =>
        eventSkillsLower.includes(skill.toLowerCase())
    );

    // 4. Skill overlap (skills in common)
    const sharedSkills = userSkills.filter(skill =>
        teamSkillsLower.includes(skill.toLowerCase())
    );

    // Calculate score
    let score = 0;
    const scoreFactors = [];

    // +50 points per missing skill user can fill
    if (skillsUserFills.length > 0) {
        const points = skillsUserFills.length * 50;
        score += points;
        scoreFactors.push({
            factor: 'Fills missing skills',
            points,
            details: skillsUserFills.join(', ')
        });
    }

    // +30 points per shared skill
    if (sharedSkills.length > 0) {
        const points = sharedSkills.length * 30;
        score += points;
        scoreFactors.push({
            factor: 'Shared skills',
            points,
            details: sharedSkills.join(', ')
        });
    }

    // +20 points if same college
    if (userCollege && teamCollege && userCollege === teamCollege) {
        score += 20;
        scoreFactors.push({
            factor: 'Same college',
            points: 20,
            details: userCollege
        });
    }

    // Determine fit level
    let fitLevel = 'Low fit';
    if (score >= 100) fitLevel = 'High fit';
    else if (score >= 50) fitLevel = 'Medium fit';

    return {
        score,
        fitLevel,
        scoreFactors,
        uniqueSkills,
        teamMissingSkills,
        skillsUserFills,
        sharedSkills,
        gapsFilled: skillsUserFills.length,
        totalGaps: teamMissingSkills.length
    };
}

/**
 * Check if user can see a team
 * @param {string} userId - Current user ID
 * @param {object} team - Team object with members
 * @param {array} interestedUserIds - IDs of users interested in the event
 * @returns {boolean} Can user see this team?
 */
export function canUserSeeTeam(userId, team, interestedUserIds = []) {
    // User is a team member
    if (team.members?.some(m => m.user_id === userId)) {
        return true;
    }

    // User is interested in the same event
    if (interestedUserIds.includes(userId)) {
        return true;
    }

    // No access
    return false;
}

/**
 * Get team visibility level for user
 * @param {string} userId - Current user ID
 * @param {object} team - Team object
 * @returns {string} 'full' | 'preview' | 'none'
 */
export function getTeamVisibilityLevel(userId, team) {
    // Full access if team member
    if (team.members?.some(m => m.user_id === userId)) {
        return 'full';
    }

    // Preview access if interested in event
    // (This will be checked by parent component)
    return 'preview';
}

/**
 * Filter team data based on visibility level
 * @param {object} team - Full team data
 * @param {string} visibilityLevel - 'full' | 'preview'
 * @returns {object} Filtered team data
 */
export function filterTeamDataByVisibility(team, visibilityLevel) {
    if (visibilityLevel === 'full') {
        // Show everything
        return team;
    }

    // Preview mode - limited data
    return {
        id: team.id,
        name: team.name,
        member_count: team.member_count,
        // Aggregate skills (no personal info)
        team_skills: team.members
            ?.flatMap(m => m.skills || [])
            .filter((s, i, arr) => arr.indexOf(s) === i) || [],
        // NO personal links
        // NO member names
        // NO individual skills
    };
}
