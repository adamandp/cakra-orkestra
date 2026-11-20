# Attendance

All endpoints require authentication. Active users default to PRESENT unless an exception exists for the selected Jakarta calendar date.

- GET /api/attendance?date=YYYY-MM-DD&q=&status=ALL&limit=12&offset=0 — paginated active users and unfiltered daily summary.
- GET /api/attendance/me — own exception history.
- PUT /api/attendance/me — upsert own exceptions with start_date, end_date, status, optional reason. PRESENT removes exceptions. Today/future only, inclusive maximum 91 days. Status: PRESENT, ABSENT, SICK, LEAVE, PERMISSION, WFH.

Reasons are returned only to the owner and admins. Changes notify other active admins and are audited. Mock data persists locally; no attendance clock-in or payroll integration.

The daily response includes birthday_days (days until the next birthday, or null) and birthdays_today (all active birthday members, independent of pagination and filters). Calculated relative to the selected Jakarta date; no birth year is exposed.
