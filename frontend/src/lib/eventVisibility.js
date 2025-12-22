/**
 * Event Visibility Helper
 * Filters events based on college-based visibility rules
 */

/**
 * Build Supabase query with visibility filtering
 * @param {object} supabase - Supabase client
 * @param {string} userCollege - User's college from profile (can be null)
 * @returns {object} Supabase query builder
 */
export function buildEventVisibilityQuery(supabase, userCollege) {
    let query = supabase.from('events').select('*');

    // Apply visibility filter:
    // Show events where:
    // 1. allowed_college IS NULL (public events), OR
    // 2. allowed_college matches user's college
    if (userCollege) {
        query = query.or(`allowed_college.is.null,allowed_college.eq.${userCollege}`);
    } else {
        // If user has no college, only show public events
        query = query.is('allowed_college', null);
    }

    return query;
}

/**
 * Filter events client-side (backup/additional layer)
 * @param {array} events - Array of events
 * @param {string} userCollege - User's college
 * @returns {array} Filtered events
 */
export function filterEventsByVisibility(events, userCollege) {
    return events.filter(event => {
        // Public event (allowed_college is null)
        if (!event.allowed_college) {
            return true;
        }

        // College-restricted event
        if (userCollege && event.allowed_college === userCollege) {
            return true;
        }

        // User doesn't have access
        return false;
    });
}
