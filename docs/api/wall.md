# Team Wall

All endpoints require authentication. All authenticated workspace users can read and create notes and react or comment. Only authors can edit notes; authors and administrators can delete or pin notes and delete their own or (admin) any comments.

| Method | Path | Input |
| --- | --- | --- |
| GET | /wall/notes | — |
| POST | /wall/notes | title, content, color |
| PATCH | /wall/notes/:id | partial title, content, color |
| DELETE | /wall/notes/:id | — |
| PATCH | /wall/notes/:id/pin | toggles pin |
| PATCH | /wall/notes/:id/like | toggle independent like |
| POST | /wall/notes/:id/reactions | custom emoji (one per user) |
| DELETE | /wall/notes/:id/reactions/me | — |
| GET | /wall/notes/:id/comments | — |
| POST | /wall/notes/:id/comments | content |
| DELETE | /wall/comments/:id | — |

Responses use the standard data envelope. Title max 80 characters, note content max 1500, comment max 500. Colors: yellow, pink, green, blue, purple, orange. Mock data persists in browser localStorage; cross-device sharing requires a real backend. Drag ordering is personal and session-only.
