# Acceptance test checklist

Use two Google accounts (Student A, Student B) and one admin (promote with the SQL in the README). A second browser profile or incognito window keeps both signed in. Tick each box as you go.

| # | Test | How to check | Enforced by |
|---|------|--------------|-------------|
| 1 | Register and log in | Sign in with Google; header shows your name | Supabase Auth + `profiles` trigger |
| 2 | Submit a valid issue | A: Report an Issue, fill all fields, submit | form validation + table checks |
| 3 | Stored in database | Supabase Table Editor > `issues` shows the row | Postgres |
| 4 | Appears on map at correct place | Click the map to drop a pin, report from it; a dot appears there | `latitude`/`longitude` columns |
| 5 | Another student confirms | A's report is already published (it passed the checks); B opens it and clicks "I'm experiencing this too" | `confirmations` insert policy |
| 6 | No double confirmation | B clicks again: button is disabled; in SQL a second insert fails | primary key (issue_id, user_id) |
| 7 | Cannot confirm own issue | A opens own issue: already marked; direct insert raises SELF_CONFIRM | `confirmations_before_insert` |
| 8 | Max 3 reports per 24h | A submits a 4th: error "Daily allowance reached" | `issues_before_insert` (advisory lock) |
| 9 | Possible duplicates shown | B starts a report in the same building and category with similar wording | `find_similar_issues` (pg_trgm) |
| 10 | Flag inappropriate content | B opens an issue, Flag Issue, submit | `flags` insert policy |
| 11 | Flag reaches admin queue | Admin: Flag Management shows it. Three flags on a published issue set it to Flagged | `flags_after_insert` |
| 12 | Admin approves | Moderation Queue: Approve & Publish | admin-only update policy |
| 13 | Reject with reason | Reject requires text; via the status dropdown it errors with "A reason is required" | `issues_before_update` |
| 14 | Request clarification | Admin: Request Clarification; A sees the note and can reply in My Reports | RPC `respond_to_clarification` |
| 15 | Student sees updated status | A: My Reports and the notification bell | `issues_after_update` notifications |
| 16 | AFS uses real data | Confirm/link an issue; R, V, S and AFS change on the details card | computed from loaded rows |
| 17 | Students blocked from admin | A has no admin tabs; in the browser console, `supabase.from('issues').update(...)` changes 0 rows | RLS |
| 18 | Admin actions audited | Open an issue: Moderation & Status History lists each change | `audit_log` triggers |
| 19 | Abuse triggers restrictions | Admin: Confirm abuse twice on A's reports; A's next submission is blocked; lift it in Settings & Abuse | `record_abuse`, `issues_before_insert` |
| 20 | Desktop and mobile | Resize to ~390px or use device mode; check nav menu, map and forms | responsive Tailwind layout |

## Auto-publish checks
- A normal report appears on the map right away with status Published and a "Report published" notification.
- A report containing `http://` or `www.`, a blocked word, a run like `aaaaaaa`, or an exact repeat of your last report is created as Pending Review. My Reports shows why, and the admin card shows the same reason.
- A student with a recorded strike has every new report held. Turning off auto-publish in Settings & Abuse holds all reports.

Known gaps to be aware of: only the report form has fully associated labels; other forms use visible labels without `for`/`id` links. Status badges always include text, so they do not rely on color alone.
