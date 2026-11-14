# REQ-fs-006 — manual checklist for the owner

| Field | Value |
|---|---|
| REQ | REQ-fs-006 |
| Written by | task-implementer, TASK-013 |
| Date | 2026-10-08 |

These are the checks no script can prove. Tick each line when it holds.

**The real-backend steps are yours to run, not the agents'.** The agents never start the real backend, never point a browser or a script at it, and never touch the database. Run `npm run dev` from the repo root yourself.

**The writes below go into your real database.** Use test accounts only. The database already holds test rows (users whose email starts with `b2test`, `apitest` or `apicheck`, and their alumni profiles); `docs/roadmap.md` lists removing them under "Later", before the demo. Posts and comments you write here are more test rows: delete them when you are done, or add them to that clean-up.

## Before you start

- [ ] The API dev server runs on port 3000 and `/api/health` answers.
- [ ] You have three test accounts: a student, an alumnus, and an admin.
- [ ] You are logged out in a second browser (or a private window) for the two-browser step.

## The one real call for the new filter

Log in, copy your token, and call the API directly with Postman (or any tool that can send an `Authorization: Bearer <token>` header). The browser's address bar will not do, because the route needs the token.

- [ ] `GET /api/posts?user_id=<id>&limit=3` for a user who has posts: the answer has at most 3 `items`, every item has that `user_id`, and `total` equals the number of posts that user really has (not all posts).
- [ ] The same call for a user with no posts: `items` is empty and `total` is 0.
- [ ] A 500 here means the SQL is wrong in a way the build cannot see (the count query and the page query share one condition). Write down the error and stop.
- [ ] A bad value gives 400: try `user_id=abc`, `user_id=0` and `user_id=` (empty).
- [ ] `GET /api/posts` with no `user_id` still gives the whole feed as before.

## Feed, as each role

- [ ] As the student: the posts and comments show; there is no "Write a post" form; you can comment and reply; you see Edit and Delete only on your own comments.
- [ ] As the alumnus: write a post with a caption only, then one with an image link. Each appears on top, a toast says it was published, and focus is back in the caption field.
- [ ] Edit your post: change the caption, Save. The post shows the new text; focus is on its Edit button.
- [ ] Delete your post: the dialog names the action and says its comments go too. Confirm. The post is gone, a toast says so, and the "Showing N of M posts" count drops by one.
- [ ] Open a post's comments, add a comment, then reply to it, then reply to that reply. The reply to the reply shows under the first comment, and the count on the toggle equals the number of comments in the list.
- [ ] Delete a comment that has replies: the comment and its replies go, and the count drops by all of them.
- [ ] As the admin: you see Delete (no Edit) on another person's post and comment, and the delete works.
- [ ] "Load more" shows the next posts with no post twice. Delete one of your own posts, press "Load more": still no post twice and none missing.
- [ ] Known limit (ADV-001), with two browsers: open the feed in both as two users. Delete a post in browser A. In browser B press "Load more". B may miss one post, and still shows the deleted one, until you reload. That is accepted; just confirm it is no worse than one post.

## Dashboard and profile, real data

- [ ] The three counts (alumni, open to mentoring, posts) equal what the directory and the feed show: the alumni count equals the directory's count, the mentoring count equals the directory with "Only show alumni open to mentoring" ticked.
- [ ] Clicking the mentoring count opens the directory with that filter on.
- [ ] "Recent posts" shows the newest 3 posts of everyone. "New in the directory" shows the newest 3 alumni.
- [ ] "Your profile": the student sees a prompt (and the server log shows no call to `/api/alumni/me`); an alumnus with a profile sees its summary; an alumnus with no profile sees the prompt to create one.
- [ ] An alumni profile at `/directory/<id>` shows that person's own newest posts under "Recent posts" (at most 3), and a person with no posts shows "<Name> has not posted yet".
- [ ] Go from person A's profile back to the directory, then to person B: B's profile never shows A's posts, not even for a moment.

## Dates and time zone

- [ ] Write one post near midnight (for example 23:50 your time). The date under it is today's date, not tomorrow's or yesterday's. If it is one day off, tell the agents: the date rule assumes the viewer's local day (`STATUS: needs verification` in the spec).

## Screen reader (NVDA on Windows, or VoiceOver)

- [ ] After the feed loads, and after "Load more", a publish and a delete, the reader says "Showing N of M posts".
- [ ] The comments toggle is read as collapsed or expanded.
- [ ] The delete dialog is read with its title and text; focus starts on Cancel; Escape closes it.
- [ ] A field error on a post or comment is read with its field; a failed save reads its message.
- [ ] The toasts ("published", "deleted", and so on) are read.
- [ ] On the Dashboard, a block that is loading says "Loading" once, not once per card.

## Look, zoom, phone and keyboard

- [ ] Both themes, by eye: the feed, the dashboard and a profile with recent posts look right in light and in dark, and match `docs/design/screens/feed.html`, `docs/design/screens/dashboard.html` and `docs/design/screens/profile.html`. Known differences: the dashboard avatar (44 instead of 56) and the big counts (44 instead of 52) moved to the nearest token step.
- [ ] At 360px wide, and at 200% browser zoom: no sideways scroll, nothing overlaps, and a very long word in a caption wraps inside the card.
- [ ] On a real phone (or 360px), open the menu, go to Feed, open the menu, go to Dashboard, close the menu: each page shows and focus lands on its heading.
- [ ] Keyboard only: Tab through the composer, each post's buttons, the comments, "Load more" and the side list on the feed, and every block on the dashboard. Every stop has a visible focus ring, in both themes.
- [ ] Turn on "reduce motion" in your system settings (`prefers-reduced-motion`): nothing slides or fades on the feed and the dashboard.

## Added by the review phase (round 3)

- [ ] Comments: press Reply on one comment and type a few words, but do not send. In the same moment send a different comment (or save an edit) on a slow connection. When the answer arrives, the words you were typing in the Reply box are still there (review item n1; checked by reading only, no browser run).
- [ ] Feed: press "Load more" on a slow connection and publish a post while it loads. The "Showing N of M posts" line may be off by one until the next load; it must never show more posts than the total (known limit n2, accepted).
- [ ] Edit a post and press Save without changing anything. Today it sends the request and shows "Post saved". Tell the agents if you want it blocked (review item m6, your call).
## Left open by the implement phase

The agents did not use a browser in this phase. The review phase checks focus by a real Tab key, 360px and 200% zoom, and takes screenshots against a mock API. The lines above are still yours to run against the real backend.
