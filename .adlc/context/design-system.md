# Design system — Alumni Details System ("University Alumni")

| Field | Value |
|---|---|
| Status | agreed (what the owner decided) |
| Approved | 2026-10-06, by farhansadik10-ai (owner). Direction name: **Oak, ink band** |
| Last audited | not audited yet (`/ux-doctor` has not run) |
| Token source | decide in the REQ that builds it. The README fixes the mechanism (CSS variables on the root element, switched with a `data-theme` attribute, plus `color-scheme`) but not the file |
| Component library | none. We build our own components on the tokens. Ant Design (`antd`) is legacy and is removed screen by screen; no new `antd` imports ([[architecture/adr-07-design-direction-oak-ink-band\|ADR-07]]) |
| Copied from | `docs/design/README.md` (sections 1 to 10), on 2026-10-06. Rules marked "owner, 2026-10-06" are the owner's answers to gaps in the README, given the same day |

This file is the UI contract the toolkit audits against: `/ux-doctor` measures drift from it, the `ui-reviewer` design-matches against it in `/review`, and the `architecture-adversary`'s UX lens checks plans against it in `/architect`. Keep it honest — a stale rule here produces false findings everywhere.

**Where the truth lives**

- `docs/design/README.md` holds the rules. This file is a copy of them in the vault's shape, plus the owner's answers where the README is silent (marked "owner, 2026-10-06"). If the two differ on something the README does say, the README is right: stop and tell the owner.
- `docs/design/screens/*.html` are static pictures (plain HTML, inline styles, no JavaScript). Use them for layout, wording and proportions. Where a screen and the README disagree, the README wins; tell the owner about the difference.
- Do not copy the inline styles from the screens into React. Build real components that read the tokens.
- "decide in the REQ that builds it" below means neither the README nor the owner has fixed a value (owner, 2026-10-06). The REQ that builds that part proposes one and the owner approves it at that REQ's gate. Do not fill the gap silently.

Decisions behind this file: [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]], [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]].

## Tokens

Components use the semantic tokens only. Never copy a hex value into a component.

| Tier | Examples | Source |
|---|---|---|
| Palette | decide in the REQ that builds it. The README defines no raw palette tier (no names like `oak-500`); it gives semantic tokens with their values directly | — |
| Semantic | `--ground`, `--surface`, `--text`, `--edge`, `--action`, `--accent`, `--danger`, `--band` — full list under "Color" | `docs/design/README.md` section 2; code file: decide in the REQ that builds it |

Token **names** exist only for color. The README gives values for type, spacing, radius, borders and control heights, but no token names for them. Names: decide in the REQ that builds it.

## Scales

A value outside a scale is a finding, not a variation.

### Type

Font: **Hanken Grotesk**, weights 400, 500, 600, 700. Fallback: `'Segoe UI', Helvetica, sans-serif`. How the font is loaded (self-hosted or from a font service): decide in the REQ that builds it.

| Style | Size / line height / weight |
|---|---|
| Band heading (desktop) | 60px / 1 / 700, letter-spacing -0.035em |
| Band heading (phone) | 36px / 1.05 / 700, letter-spacing -0.03em |
| Display | 44px / 1.05 / 700 |
| H1 | 32px / 1.15 / 700 |
| H2 | 24px / 1.2 / 700 |
| H3 | 18px / 1.3 / 600 |
| Body | 16px / 1.5 / 400 |
| Small | 14px / 1.45 / 400 |
| Caption | 13px / 1.4 / 400, muted |

The weight 400 for Small and Caption is from the owner, 2026-10-06. Field labels are Small at weight 600. Primary button text is weight 700; secondary button text is weight 600.

### Spacing

Steps: 4, 8, 12, 16, 24, 32, 48, 64 px.

### Shape and size

- **Radius:** 2px everywhere.
- **Borders:** 1.5px `--edge` for cards and controls; 1px `--line` for dividers.
- **Shadows:** none.
- **Gradients:** none.
- **Control height:** 44px. Small: 36px. Log in and phone: 48px.
- **Focus ring:** 3px `--focus`, offset 2px, on every control and link.
- **Content width:** max 1200px, centered, 32px side padding (16px on phone).
- **Header height:** 72px (60px on phone).
- **z-index:** decide in the REQ that builds it.

### Breakpoints

The switch width: decide in the REQ that builds it. What the README does give:

- The layout must work from 360px wide.
- The phone pictures are drawn at 390px.
- "Phone and other narrow screens" get the phone layout; the width at which the layout switches is not given.

## Color

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
- Brick red (`--danger`) is only for Delete and for errors.
- Never use color as the only signal. Tags and messages always carry words.
- `--accent` is never used as text, and never as the only border, on a light surface. Its contrast on `--surface` in light is 2.76:1. _(Owner, 2026-10-06.)_

### Hover

| Element | On hover | Source |
|---|---|---|
| Primary button | background `--accent-hover` | README |
| Secondary button | background `--sunken`; border and text unchanged | owner, 2026-10-06 |
| Link | text `--accent-soft-text` | owner, 2026-10-06 |
| Danger text button ("Delete" in tables) | text `--danger-hover` | owner, 2026-10-06 |
| Solid danger button | `--danger-hover` | README ("Danger hover") |

A hover color for table rows, a pressed (active) color for buttons, and a warning or info color: decide in the REQ that builds it.

### Themes

- Three choices: light, dark, system. Default is system.
- The choice is saved in the browser. The storage key and method: decide in the REQ that builds it.
- System mode follows `prefers-color-scheme` (from [[context/conventions]]).
- Screens without a dark picture (sign-up, dashboard, feed, users, my profile) use the same layout with the dark tokens.

### Contrast floor

WCAG AA in both themes. In the standard, AA means 4.5:1 for body text and 3:1 for large text and for the parts of controls; the README itself says only "WCAG AA".

Checked by the owner, 2026-10-06:

| What | Result | Lowest pair |
|---|---|---|
| Text pairs, both themes | all pass AA | 5.33:1 — `--on-accent` on `--accent-hover`, light |
| Borders and focus ring, both themes | all pass 3:1 | 3.18:1 — `--edge` on `--surface`, dark |
| `--accent` on `--surface`, light | 2.76:1, below 3:1 | so `--accent` is never text and never the only border on a light surface |

## Components

Before building a new component, check this list. All are drawn in `docs/design/screens/system.html` (light) and `docs/design/screens/system-dark.html` (dark). No component is built yet, so every path is "not built".

| Component | Path | Variants / states | Notes |
|---|---|---|---|
| Button, primary | not built | hover uses `--accent-hover` | `--accent` background, `--on-accent` text, 1.5px `--accent-edge` border, weight 700. One per view |
| Button, secondary | not built | hover: `--sunken` background, border and text unchanged | `--surface` background, 1.5px `--edge` border, weight 600 |
| Button, danger | not built | text link in tables; solid in the confirm dialog; hover uses `--danger-hover` | Red text link style in tables ("Delete"); solid `--danger` with `--on-danger` text in the confirm dialog |
| Text input, select, textarea | not built | default, disabled, error | 1.5px `--edge` border, label above (14px, 600), help or error text below |
| Disabled input | not built | — | `--sunken` background, `--muted` text |
| Checkbox | not built | — | Real checkbox with a label. The mentoring one sits in an `--accent-soft` box |
| Tag, plain | not built | — | 1px `--line` outline. For facts: department, class year, field |
| Tag, mentoring | not built | — | `--accent-soft` background, text "Open to mentoring" |
| Tag, role | not built | Student, Alumni, Admin | Student `--sunken`, Alumni `--accent`, Admin `--action` |
| Avatar | not built | initials, photo | Square, `--accent-soft`, initials. Shows the photo when `photo_url` is set ([[architecture/adr-04-profile-photo-is-a-url-field\|ADR-04]]) |
| Card | not built | — | `--surface`, 1.5px `--edge` border, 24 to 32px padding |
| Table | not built | desktop table, phone cards | Head row `--sunken`, 1px row dividers. On phone each row becomes a card |
| Pagination | not built | current page | Previous, page numbers, Next, "Page 1 of 25". Current page uses `--action` |
| Dialog | not built | — | Centered card, heading, one sentence, two buttons. Used to confirm Delete |
| Messages | not built | error, success, toast | Error `--danger-soft`, success `--success-soft`, toast `--action` |
| Link | not built | hover: `--accent-soft-text` | Real `<a>`. Focus ring like every control |
| States | not built | loading, empty, error | For every list. An empty state says what to do next |
| Skeleton | not built | — | The loading state: blocks in the shape of the content, filled with `--sunken`. No spinner |
| Theme switch | not built | light, dark, system; pressed | Three icon buttons in the header; three text buttons (Light, Dark, System) in the phone menu. The pressed one uses `--action` |
| Header | not built | desktop, phone | See "Page pattern" |
| Band | not built | page heading; avatar and name on profile pages | See "Page pattern" |
| Footer | not built | before and after the About page exists | App name on the left. The "About" link on the right is not rendered until the About page exists; the About REQ adds it. No dead links |
| Icons | not built | — | Simple line icons, 2px stroke, `currentColor`. No emoji. The icon set: decide in the REQ that builds it |

## Patterns

### Page pattern

Every main page after log in has the same three parts:

1. **Header.** 72px high, `--surface`, 1.5px bottom border. Left: app name and nav links (Dashboard, Directory, Feed, plus Users for admins). The current link is bold with a 4px accent line under it. Right: theme switch (three icon buttons: light, dark, system) and the user's avatar and name, which link to My profile.
2. **Band.** Full-width `--band` block. Inside: a 72×8px accent bar, the page heading, one line of sub text.
3. **First card overlaps the band** by 56px (`margin-top: -56px`, 52px on phone). On the Profile and My profile pages the band holds the avatar and name instead, and the cards start below it.

Footer: app name on the left. The README also draws an "About" link on the right, but the link is not rendered until the About page exists; the About REQ adds it. No dead links. _(Owner, 2026-10-06; this overrides README sections 1 and 4 until then.)_

Phone and other narrow screens: the header is 60px with the app name and a menu button. The menu opens full screen with large links, the theme switch as three text buttons (Light, Dark, System), the user block and Log out. The band heading drops to 36px. Cards stack in one column. Screens without a phone picture follow these rules.

### Screens

Names, companies and numbers in the screen files are sample data.

| File | Screen | Who sees it | Main content |
|---|---|---|---|
| `login.html`, `login-dark.html` | Log in | Everyone | Email, password, link to sign up. Plus one line not in the picture: "Forgot your password? Contact the alumni office." with the contact email (owner, 2026-10-06) |
| `signup.html` | Create an account | Everyone | Name, email, password, optional photo link, role choice (Student or Graduate) |
| `dashboard.html` | Dashboard | Logged in | Greeting, counts, recent posts, a summary of your own profile, new people in the directory |
| `feed.html` | Feed | Logged in | Write a post (optional image link), posts with author and date, Reply, Edit and Delete, comments |
| `directory.html`, `directory-dark.html` | Alumni directory | Logged in | Search, filters (department, graduation year, field, mentoring), cards, pagination |
| `profile.html`, `profile-dark.html` | Alumni profile | Logged in | One person's public profile, contact links |
| `users.html` | Users | Admin only | Search by name or email, role filter, table, Delete, pagination |
| `my-profile.html` | My profile | Logged in | Edit own alumni profile and account, Log out |
| `phone-directory.html`, `phone-menu.html` | Phone size, 390px | Logged in | Directory and the open menu |

Not designed yet ([[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]): About page (planned, built last), Privacy page, password reset.

The About page will say: what the system is, who can join, how to contact the alumni office (the contact email), and the app version. _(Owner, 2026-10-06.)_ Its layout: decide in the REQ that builds it.

### Loading, empty and error states

- Every list has a loading, an empty and an error state. An empty state says what to do next.
- Every form has them too (from [[context/conventions]]).
- Loading shows skeleton blocks in the shape of the content, filled with `--sunken`. No spinner. No animation when `prefers-reduced-motion` is set. _(Owner, 2026-10-06.)_

### Forms

- Forms validate on submit. Errors show under the field, in words.
- Label above the field (14px, 600); help or error text below.
- A user cannot change their own email. The field is disabled with the note "Ask an admin to change your email."
- Students do not have an alumni profile form. They see only the Account card on My profile.
- On My profile, Field is a free text input. _(Owner, 2026-10-06.)_
- The log-in page shows one line: "Forgot your password? Contact the alumni office." with the contact email. It stays until reset by email is built in a later REQ. _(Owner, 2026-10-06.)_
- Sign-up shows the roles "Student" and "Graduate". "Graduate" saves the role `alumni` ([[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]]).

### Deleting

- Delete always opens the confirm dialog first.
- In the Users table the admin's own row shows a "You" tag and has no Delete button.

### Navigation and filters

- Nav links: Dashboard, Directory, Feed, plus Users for admins.
- On phone the directory filters sit behind a "Filters" button. Search stays visible.
- The Field filter lists the distinct non-empty values of `alumni.field`, sorted A to Z. The Department and Graduation year filters work the same way, from `alumni.department` and `alumni.graduation_year`. _(Owner, 2026-10-06.)_
- The footer's "About" link is not rendered until the About page exists. No dead links.

### Fields the screens need that the database does not have yet

The mentoring tag, the mentoring checkbox and filter, and the field tag and filter need two new `alumni` columns: `mentorship_available` (boolean, default `false`) and `field` (text, nullable). The names are final. See [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]]. The owner runs the migration in a later REQ. Until the columns exist in `db/schema.md`, these parts cannot be built.

## Exceptions

Places we deliberately break our own rules, each with a reason and scope. If it's written down here it's a decision; if it isn't, it's drift.

| Where | Diverges how | Why | Since |
|---|---|---|---|
| (none) | | | |

---

## Optional — fill on recurrence

### Voice & UX copy

- App name: "University Alumni", text from one constant ([[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]]).
- Dates are written as "3 October 2026".
- An action keeps one name through the flow: the button "Save profile" leads to the message "Profile saved".
- Error messages are in words, under the field.
- No emoji.

### Accessibility beyond the floor

- WCAG AA contrast in both themes.
- Works from 360px wide. No layout breaks at 200% zoom (from [[context/conventions]]).
- Every control is reachable by keyboard, with a visible focus ring.
- Real `<button>`, `<a>`, `<label>` and `<input>` elements.
- Respect `prefers-reduced-motion`. Motion only answers a user action. Skeletons do not animate when it is set.
- Never color alone: tags and messages always carry words.

### Theming / brands

- White-label: no university logo. The app name is text from one constant (a single exported constant in one config file); it is never hard-coded in components ([[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]]).
- One contact email for the alumni office, a constant in the same config file as the app name. Used on the log-in page and the About page. Its value: decide in the REQ that builds it.
- Two token sets (light, dark) under one set of names. Components never branch on the theme; they read the tokens.
- Whether a buyer may change the tokens (their own accent color, for example): decide in the REQ that builds it.

### How the system grows

Decide in the REQ that builds it.

## Related

- Source: `docs/design/README.md`, `docs/design/screens/*.html`
- Context: [[context/conventions]] (Frontend), [[context/project-overview]], [[context/architecture]]
- ADRs: [[architecture/adr-01-sign-up-role-is-student-or-alumni|ADR-01]], [[architecture/adr-04-profile-photo-is-a-url-field|ADR-04]], [[architecture/adr-07-design-direction-oak-ink-band|ADR-07]], [[architecture/adr-08-mentoring-and-field-stay-two-new-alumni-columns|ADR-08]], [[architecture/adr-09-white-label-app-name-from-one-constant|ADR-09]], [[architecture/adr-10-about-page-last-privacy-and-password-reset-later|ADR-10]]
