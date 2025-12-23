# VERIFICATION CHECKLIST
## Post-Repair Testing Guide

**Status:** Ready for Testing  
**Dev Servers:** ✅ Running

---

## QUICK VERIFICATION (5 minutes)

### Step 1: Verify Organizer Tab Behavior
**Expected:** Tab appears ONLY for organizers, NEVER for students

1. Open browser to `http://localhost:5173`
2. Login as a **student** user
3. ✅ **CHECK:** Navbar should show: Dashboard | Events | Profile
4. ✅ **CHECK:** NO "Organizer" tab visible
5. Logout
6. Login as an **organizer** user (role = 'organizer' in profiles table)
7. ✅ **CHECK:** Navbar should show: Dashboard | Events | Organizer | Profile
8. ✅ **CHECK:** "Organizer" tab appears AFTER page loads (not immediately)

---

### Step 2: Verify Event Creation
**Expected:** Organizer can create events successfully

1. As organizer, click "Organizer" tab
2. Click "Create Event" button
3. Fill out the form:
   - **Title:** Test Event 2025
   - **College:** Your College Name
   - **Category:** Hackathon
   - **Location:** Test Location
   - **Event Date:** 2025-12-30
   - **Deadline:** 2025-12-28
   - **Organizer Name:** Test Organizer
   - **Eligibility:** Open to all
   - **Description:** This is a test event
   - **Required Skills:** React, Python
   - **Tags:** Test, Demo
   - **Restrict to College:** (leave empty for public)
4. Click "Create Event"
5. ✅ **CHECK:** Success message appears
6. ✅ **CHECK:** Redirects to event detail page
7. ✅ **CHECK:** Event appears in "My Events" list on organizer dashboard

---

### Step 3: Verify Events Page
**Expected:** Events page loads and displays events

1. Click "Events" tab
2. ✅ **CHECK:** Events page loads without errors
3. ✅ **CHECK:** Event cards are displayed
4. ✅ **CHECK:** Can see the test event you just created
5. Click on any event card
6. ✅ **CHECK:** Event detail page opens

---

### Step 4: Verify "I'm Interested" Button
**Expected:** Button is visible and functional

1. On event detail page
2. ✅ **CHECK:** "Mark Interest" button is visible
3. Click the button
4. ✅ **CHECK:** Button changes to "I'm Interested" (green)
5. ✅ **CHECK:** Interest count increases by 1
6. Click button again
7. ✅ **CHECK:** Button changes back to "Mark Interest"
8. ✅ **CHECK:** Interest count decreases by 1

---

### Step 5: Verify Event Visibility Rules
**Expected:** College-restricted events only visible to allowed students

1. As organizer, create a new event
2. Set "Restrict to College" to a specific college name (e.g., "IIT Bombay")
3. Create the event
4. Logout
5. Login as a student with **different** college in profile
6. Go to Events page
7. ✅ **CHECK:** Restricted event is NOT visible
8. Logout
9. Login as a student with **matching** college in profile
10. Go to Events page
11. ✅ **CHECK:** Restricted event IS visible

---

## BROWSER CONSOLE CHECK

Open browser DevTools (F12) → Console tab

✅ **CHECK:** No red errors
✅ **CHECK:** No warnings about missing fields
✅ **CHECK:** No "undefined" errors

---

## COMMON ISSUES & FIXES

### Issue: "Organizer tab appears for students"
**Cause:** Profile role not set correctly in database  
**Fix:** Run SQL in Supabase:
```sql
UPDATE profiles SET role = 'student' WHERE user_id = 'USER_ID_HERE';
```

### Issue: "Event creation fails"
**Cause:** RLS policy may be blocking insert  
**Fix:** Verify RLS policy exists:
```sql
SELECT * FROM pg_policies WHERE tablename = 'events' AND policyname = 'Organizers can create events';
```

### Issue: "Events page is empty"
**Cause:** All events are college-restricted and user has no college  
**Fix:** Add college to user profile:
```sql
UPDATE profiles SET college = 'IIT Bombay' WHERE user_id = 'USER_ID_HERE';
```

---

## SUCCESS CRITERIA

All checkboxes above should be ✅

If any fail, refer to ROOT_CAUSE_REPAIR_REPORT.md for detailed analysis.

---

## NEXT STEPS

After verification:
1. Test with real users (students + organizers)
2. Monitor for any edge cases
3. Consider adding automated tests
4. Deploy to production when stable

**System Status:** ✅ Ready for Demo
