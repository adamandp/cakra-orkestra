# Notifications
All endpoints require authentication and only return or mutate the caller's notifications.
- GET /notifications?limit=10&offset=0&is_read=false — data: {items,total,limit,offset}
- GET /notifications/unread-count — data: {count}
- PATCH /notifications/:id/read
- PATCH /notifications/:id/unread
- PATCH /notifications/read-all
- DELETE /notifications/:id

Notification fields: id, user_id, actor_id (nullable), type, title, message, entity_type, entity_id, read_at (nullable), created_at.
No public create endpoint. Generate notifications after successful workflow mutations; exclude the actor and deduplicate recipients. Production should persist records transactionally and use a scheduler for deadline reminders. MSW uses local storage.

- GET /notifications/:id — recipient-owned notification detail.
