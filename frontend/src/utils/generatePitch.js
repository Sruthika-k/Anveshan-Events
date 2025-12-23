/**
 * Generate personalized team outreach pitch
 * @param {object} params - Pitch generation parameters
 * @returns {string} Formatted pitch message
 */
export const generatePitch = ({
    userName,
    userCollege,
    userSkills = [],
    userEmail,
    userLinkedIn,
    userGitHub,
    teamName,
    eventName,
    compatibilityScore
}) => {
    // Get top 3 skills
    const topSkills = userSkills.slice(0, 3);
    const skillsText = topSkills.length > 0
        ? topSkills.join(', ')
        : 'various technical skills';

    // Build the pitch
    let pitch = `Hi ${teamName}! 👋\n\n`;

    pitch += `I'm ${userName || 'a student'}`;
    if (userCollege) {
        pitch += ` from ${userCollege}`;
    }
    pitch += `, and I came across your team for ${eventName}.\n\n`;

    if (compatibilityScore) {
        pitch += `I noticed we have a ${compatibilityScore}% compatibility match, and I bring skills in ${skillsText} that could complement your team.\n\n`;
    } else {
        pitch += `I bring skills in ${skillsText} that could complement your team.\n\n`;
    }

    pitch += `I'm really excited about this event and would love to collaborate. Are you still looking for team members?\n\n`;
    pitch += `Looking forward to connecting!\n\n`;
    pitch += `${userName || 'Best regards'}`;

    // Add contact info
    if (userEmail || userLinkedIn || userGitHub) {
        pitch += `\n\n---\n`;
        if (userEmail) {
            pitch += `📧 ${userEmail}\n`;
        }
        if (userLinkedIn) {
            pitch += `🔗 ${userLinkedIn}\n`;
        }
        if (userGitHub) {
            pitch += `💻 ${userGitHub}`;
        }
    }

    return pitch;
};

/**
 * Validate pitch quality
 * @param {string} pitch - The pitch message
 * @returns {object} Validation result with score and feedback
 */
export const validatePitch = (pitch) => {
    const length = pitch.length;
    const hasGreeting = /hi|hello|hey/i.test(pitch);
    const hasSkills = /skill|experience|expertise/i.test(pitch);
    const hasContact = /email|linkedin|github/i.test(pitch);

    let score = 0;
    let feedback = [];

    // Length check
    if (length < 150) {
        feedback.push('Message is too short. Add more details about your skills.');
    } else if (length > 500) {
        feedback.push('Message is too long. Keep it concise and focused.');
        score += 5;
    } else {
        score += 30;
    }

    // Content checks
    if (hasGreeting) score += 20;
    else feedback.push('Add a friendly greeting.');

    if (hasSkills) score += 30;
    else feedback.push('Mention your relevant skills.');

    if (hasContact) score += 20;
    else feedback.push('Include your contact information.');

    // Quality rating
    let quality = 'Poor';
    if (score >= 80) quality = 'Excellent';
    else if (score >= 60) quality = 'Good';
    else if (score >= 40) quality = 'Fair';

    return {
        score,
        quality,
        feedback,
        isValid: score >= 40
    };
};

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
    try {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        return success;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Generate mailto link for email
 * @param {string} pitch - The pitch message
 * @param {string} subject - Email subject
 * @returns {string} Mailto URL
 */
export const generateMailtoLink = (pitch, subject = 'Team Collaboration Request') => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(pitch);
    return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
};
