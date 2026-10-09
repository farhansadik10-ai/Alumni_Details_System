# REQ-fs-007 — checks for you (the owner)

Nothing in this work reached the real backend or the database, by your session rules. These are the checks only you can run. Each line says what to look at. Everything else was checked in headless Chrome against a mock API (`phone-audit.md`, `verification.md`, `ui-evidence/`).

## Users page (log in as an admin)

- [ ] `/users` lists real users: name, email, role tag, joined date. A user with no role shows "No role" and no photo shows initials. Assumptions A1 and A2 of the spec: the real answer is `{ items, total, page, limit }` of users without the password column.
- [ ] Search by part of a name, then of an email; the box waits about a third of a second; the address changes (`?q=`); Back restores the box.
- [ ] Role filter: Student, Alumni, Admin; the address gets `role=`; page 2 keeps the role.
- [ ] Your own row has a "You" tag and no Delete button. Other rows have Delete.
- [ ] Delete a user that has no posts, comments or alumni profile (make a test sign-up first): the dialog opens with Cancel focused; Escape closes it; Delete removes the row, shows a toast, total goes down by one.
- [ ] Press Delete on a user that has an alumni profile or posts: the dialog stays open and says the person has posts, comments or an alumni profile and nothing was changed (the real 409). Check that the words are right for a user with only a profile.
- [ ] Log in as a student or an alumnus, open `/users`: the no-access page, and no request to `/api/users` in the network tab.
- [ ] Delete all rows on the last page of a longer list: the page moves to the new last page.

## About page and footer

- [ ] The footer shows the app name on the left and "About" on the right on every logged-in page, including at 360px. The link goes to `/about`; Tab reaches it and shows the ring.
- [ ] Read the About text. Is the wording right for you? It states no fact about any university. The contact email is still the placeholder `alumni-office@example.com` in `frontend/src/config/app.ts`: replace it before the demo.
- [ ] You decided: no "who can join" and no app version on the page (ADR-10 update). Say if you want either added.

## Phone and zoom (a real phone and a real browser)

- [ ] On a real phone (or the browser's phone mode): the Users page cards, the open menu, a dialog, a toast. No sideways scroll.
- [ ] Browser zoom 200 percent on a normal window: Users, Directory, Feed. The audit used an emulated 640×400 at 2×, not real zoom.
- [ ] Two delete toasts in a row on a phone near the bottom of a page: they can cover pagination Next or the About link for about 5 seconds (known, listed in `skipped.md`). Tell me if you want it changed.

## Performance and build

- [ ] On your Apache build (`scripts/build.sh`), open the site and check in the network tab that one font file (`hanken-grotesk-latin-wght-normal-….woff2`) is requested once and no "preloaded but not used" warning shows in the console.
- [ ] Post a picture with a link to a wide image and a tall image: the post does not jump when it loads. A link that fails to load is hidden after a moment.

## Screen reader (one pass)

- [ ] The Delete buttons are announced with the person's name ("Delete <name>"). The delete dialog is read with its title and message. The count line ("124 users") is read after a search.

## Decisions waiting for you

- [ ] The loading / error / empty / ready chain is copied between the Users and Directory pages. Leave, or make one shared function?
- [ ] Toasts on a phone: leave, or show one at a time / lift them above the footer?
- [ ] Remove the test rows from the database before the demo (`docs/roadmap.md`, Later).
