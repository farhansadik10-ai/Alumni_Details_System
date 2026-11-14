# Design handoff: University Alumni

Approved by Farhan on 6 October 2026. Direction name: **Oak, ink band**.

This folder is the visual source for the frontend redesign.

- `screens/*.html` are static pictures of each screen. Plain HTML with inline styles, no JavaScript. Open them in a browser to see the target.
- This file holds the rules behind the screens.

How to use it when building:

1. Take colors, sizes and spacing from the tokens below. Never copy a hex value into a component.
2. Use the screen files for layout, wording and proportions.
3. Do not copy the inline styles into React. Build real components that read the tokens.
4. Where a screen and this file disagree, this file wins. Tell Farhan about the difference.

## 1. Product decisions

| Decision | Value |
|---|---|
| App name | "University Alumni". White-label: the name comes from one config value, never hard-coded in components. |
| Style | Scandinavian: flat, calm, strong type, no shadows, no gradients. |
| Themes | Light, dark, system. Default is system. The choice is saved in the browser. |
| Font | Hanken Grotesk (400, 500, 600, 700). Fallback: 'Segoe UI', Helvetica, sans-serif. |
| Mentoring | Kept. Needs a new `alumni` column, for example `mentorship_available` (boolean). |
| Field | Kept. Needs a new `alumni` column `field` (text). Also a directory filter. |
| About page | Planned, built last. The footer link to it is added by the About REQ; until then the footer has no "About" link. |
| Sign-up roles | The form shows "Student" and "Graduate". "Graduate" saves the role `alumni`. |
| Dates | Written as "3 October 2026". |
| Icons | Simple line icons, 2px stroke, `currentColor`. No emoji. |

## 2. Color tokens

Set these as CSS variables on the root element. Switch the set with a `data-theme` attribute. Also set `color-scheme`.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--ground` | `#F7F5EF` | `#121212` | Page background |
| `--surface` | `#FFFFFF` | `#1B1B1A` | Cards, header, inputs |
| `--sunken` | `#EFECE4` | `#242422` | Table head, disabled input, Student tag |
| `--text` | `#161616` | `#F2F1EC` | Main text |
| `--muted` | `#5C5B55` | `#A8A7A0` | Secondary text |
| `--line` | `#D2CFC6` | `#3A3A36` | Dividers, plain tag outline (1px) |
| `--edge` | `#161616` | `#6B6A64` | Card and control borders (1.5px) |
| `--focus` | `#9A6B12` | `#E0AE4A` | Focus ring |
| `--action` | `#161616` | `#F2F1EC` | Selected state: pressed theme button, current page number, Admin tag, toast |
| `--on-action` | `#FFFFFF` | `#161616` | Text on `--action` |
| `--accent` | `#C8922A` | `#E0AE4A` | Primary button, band bar, current nav marker, Alumni tag |
| `--on-accent` | `#161616` | `#161616` | Text on `--accent` |
| `--accent-hover` | `#B58222` | `#EBC06A` | Primary button hover |
| `--accent-edge` | `#161616` | `#E0AE4A` | Primary button border |
| `--accent-soft` | `#F4E6C4` | `#3A2E12` | Avatars, "Open to mentoring" tag |
| `--accent-soft-text` | `#5A3F06` | `#EBC878` | Text on `--accent-soft` |
| `--danger` | `#A3311F` | `#F08A78` | Delete, error text |
| `--on-danger` | `#FFFFFF` | `#161616` | Text on `--danger` |
| `--danger-hover` | `#862616` | `#F5A99B` | Danger hover |
| `--danger-soft` | `#F6E1DC` | `#3D1A14` | Error message background |
| `--danger-soft-text` | `#7A2114` | `#F3A898` | Error message text |
| `--success` | `#2F6B45` | `#7CC796` | Success mark |
| `--success-soft` | `#DDEBDF` | `#16301F` | Success message background |
| `--success-soft-text` | `#1F4A2F` | `#9BD8AE` | Success message text |
| `--band` | `#161616` | `#262624` | Page band background |
| `--band-text` | `#FFFFFF` | `#F2F1EC` | Band heading |
| `--band-muted` | `#D9D6CD` | `#A8A7A0` | Band sub text |

Color rules:

- One primary (accent) button per view.
- Brick red is only for Delete and for errors.
- Never use color as the only signal. Tags and messages always carry words.

## 3. Type, space, shape

| Style | Size / line height / weight |
|---|---|
| Band heading (desktop) | 60px / 1 / 700, letter-spacing -0.035em |
| Band heading (phone) | 36px / 1.05 / 700, letter-spacing -0.03em |
| Display | 44px / 1.05 / 700 |
| H1 | 32px / 1.15 / 700 |
| H2 | 24px / 1.2 / 700 |
| H3 | 18px / 1.3 / 600 |
| Body | 16px / 1.5 / 400 |
| Small | 14px / 1.45 |
| Caption | 13px / 1.4, muted |

- Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64 px.
- Radius: 2px everywhere.
- Borders: 1.5px `--edge` for cards and controls, 1px `--line` for dividers.
- No shadows.
- Control height: 44px. Small: 36px. Log in and phone: 48px.
- Focus ring: 3px `--focus`, offset 2px, on every control and link.
- Content width: max 1200px, centered, 32px side padding (16px on phone).

## 4. Page pattern

Every main page after log in has the same three parts:

1. **Header.** 72px high, `--surface`, 1.5px bottom border. Left: app name and nav links (Dashboard, Directory, Feed, plus Users for admins). The current link is bold with a 4px accent line under it. Right: theme switch (three icon buttons: light, dark, system) and the user's avatar and name, which link to My profile.
2. **Band.** Full-width `--band` block. Inside: a 72×8px accent bar, the page heading, one line of sub text.
3. **First card overlaps the band** by 56px (`margin-top: -56px`, 52px on phone). On the Profile and My profile pages the band holds the avatar and name instead, and the cards start below it.

Footer: app name on the left, "About" link on the right. The link is added by the About REQ; it is not shown before the About page exists.

Phone and other narrow screens: header is 60px with the app name and a menu button. The menu opens full screen with large links, the theme switch as three text buttons (Light, Dark, System), the user block and Log out. The band heading drops to 36px. Cards stack in one column.

## 5. Components

All are shown in `screens/system.html` (light) and `screens/system-dark.html` (dark).

| Component | Rules |
|---|---|
| Button, primary | `--accent` background, `--on-accent` text, 1.5px `--accent-edge` border, weight 700 |
| Button, secondary | `--surface` background, 1.5px `--edge` border, weight 600 |
| Button, danger | Red text link style in tables ("Delete"), solid `--danger` in the confirm dialog |
| Text input, select, textarea | 1.5px `--edge` border, label above (14px, 600), help or error text below |
| Disabled input | `--sunken` background, `--muted` text |
| Checkbox | Real checkbox with a label. The mentoring one sits in an `--accent-soft` box |
| Tag, plain | 1px `--line` outline. For facts: department, class year, field |
| Tag, mentoring | `--accent-soft` background, "Open to mentoring" |
| Tag, role | Student `--sunken`, Alumni `--accent`, Admin `--action` |
| Avatar | Square, `--accent-soft`, initials. Shows the photo when `photo_url` is set |
| Card | `--surface`, 1.5px `--edge` border, 24 to 32px padding |
| Table | Head row `--sunken`, 1px row dividers. On phone each row becomes a card |
| Pagination | Previous, page numbers, Next, "Page 1 of 25". Current page uses `--action` |
| Dialog | Centered card, heading, one sentence, two buttons. Used to confirm Delete |
| Messages | Error (`--danger-soft`), success (`--success-soft`), toast (`--action`) |
| States | Loading, empty and error states for every list. An empty state says what to do next |

## 6. Screens

| File | Screen | Who sees it | Main content |
|---|---|---|---|
| `login.html`, `login-dark.html` | Log in | Everyone | Email, password, link to sign up |
| `signup.html` | Create an account | Everyone | Name, email, password, optional photo link, role choice (Student or Graduate) |
| `dashboard.html` | Dashboard | Logged in | Greeting, counts, recent posts, a summary of your own profile, new people in the directory |
| `feed.html` | Feed | Logged in | Write a post (optional image link), posts with author and date, Reply, Edit and Delete, comments |
| `directory.html`, `directory-dark.html` | Alumni directory | Logged in | Search, filters (department, graduation year, field, mentoring), cards, pagination |
| `profile.html`, `profile-dark.html` | Alumni profile | Logged in | One person's public profile, contact links |
| `users.html` | Users | Admin only | Search by name or email, role filter, table, Delete, pagination |
| `my-profile.html` | My profile | Logged in | Edit own alumni profile and account, Log out |
| `phone-directory.html`, `phone-menu.html` | Phone size, 390px | Logged in | Directory and the open menu |

Names, companies and numbers in the screens are sample data.

## 7. Behaviour decisions

Farhan asked for the common standard wherever a choice was open. These are fixed:

- A user cannot change their own email. The field is disabled with the note "Ask an admin to change your email."
- In the Users table the admin's own row shows a "You" tag and has no Delete button.
- Delete always opens the confirm dialog first.
- On phone the directory filters sit behind a "Filters" button. Search stays visible.
- Forms validate on submit. Errors show under the field, in words.
- An action keeps one name through the flow: the button "Save profile" leads to the message "Profile saved".
- Screens without a dark picture (sign-up, dashboard, feed, users, my profile) use the same layout with the dark tokens.
- Screens without a phone picture follow the phone rules in section 4.
- Students do not have an alumni profile form. They see only the Account card on My profile.
- The log-in page shows "Forgot your password? Contact the alumni office." with the contact email until reset by email is built.

## 8. What the design needs from the backend

- `alumni.mentorship_available` (boolean) and `alumni.field` (text): new columns.
- Alumni reads return the user's name, email and photo (done in REQ-fs-001).
- Alumni search: text search on name, company and job title; filters for department, graduation year, field, mentoring; pagination with a total count.
- Posts return the author's name and a comment count. Comments can be listed by post.
- Users list for admins: search by name or email, role filter, pagination with a total count.

## 9. Not designed yet

- About page (planned, last).
- Privacy page. Needed before selling in Europe.
- Password reset.

## 10. Quality bar

- WCAG AA contrast in both themes.
- Works from 360px wide.
- Every control reachable by keyboard, with a visible focus ring.
- Real `<button>`, `<a>`, `<label>` and `<input>` elements.
- Respect `prefers-reduced-motion`. Motion only answers a user action.
