# REQ-fs-004 — Manual checklist for the owner

This list covers what a build cannot prove (AC65). You run it in a browser against the real backend. Tick a step when you see exactly what it says under "Must see". If you see something else, write one line beside the step and carry on.

It takes about 45 minutes, plus one step (step 50) that needs the page left open for a little over an hour. Start that step before a break.

## Read this first

- **Sign-up steps create real rows in the database.** Steps 1, 3 and 5 each make a test account in the `"User"` table. The app has no "delete account" button, so the rows stay until you remove them yourself. Use the test emails below so they are easy to recognise later.
- **If you run this list a second time**, the emails are taken. Change the `1` in each email to `2`.
- Emails are case-sensitive in the database. Type them exactly as written here.
- Nothing in this list needs a database command or a look into a `.env` file.

### Test accounts

| Name used below | Full name | Email | Password |
|---|---|---|---|
| **Student** | Test Student One | `test-student-1@example.com` | `Test1234` |
| **Graduate** | Test Graduate One | `test-graduate-1@example.com` | `Test1234` |
| **Space** | Test Space One | `test-space-1@example.com` | `Test1234` followed by one space (9 characters) |

### Set-up

1. From the repo root run `npm run dev`. The API must answer on port 3000 and the frontend on the address Vite prints (usually `http://localhost:5173`).
2. Use Chrome or Edge. Open the developer tools (F12). You will use three parts of them:
   - **Network** tab, to see what is sent. Tick "Preserve log".
   - **Application** tab → Local Storage → your address, to see the keys `ua.token`, `ua.theme`, `ua.rememberedEmail`.
   - **Console** tab, for two short commands in part I.
3. Start logged out: if the header shows, open the phone menu or My profile and log out. In Local Storage delete `ua.rememberedEmail` and `ua.theme` if they are there.

---

## A. Sign up

- [ ] **1. Sign up as Student.** Open `/signup`. Fill in the **Student** account. Leave "Student" chosen and Photo link empty. Press "Create account".
  **Must see:** the button reads "Creating account…" for a moment. You land on `/dashboard`. One toast "Account created" shows in the bottom corner and leaves by itself after about 5 seconds. The header shows "Test Student One" with the initials "TO". In Network: `POST /api/users` with `"role":"student"` in the request body, then `POST /api/auth/login`.

- [ ] **2. The toast shows once.** Reload the Dashboard.
  **Must see:** no toast.

- [ ] **3. Sign up as Graduate, with a photo.** Log out (My profile → Log out). Open `/signup`. Fill in the **Graduate** account, choose "Graduate", and in Photo link type the address of the frontend plus `/favicon.svg` (for example `http://localhost:5173/favicon.svg`). Press "Create account".
  **Must see:** in Network, the request body of `POST /api/users` has `"role":"alumni"` (not "graduate") and the photo link. The answer to it also says `"role":"alumni"`. You land on the Dashboard and the header shows the small picture, not initials, beside "Test Graduate One". The answer to `GET /api/users/<number>` says `"role":"alumni"`. No answer in the Network tab contains a `password` field.

- [ ] **4. A taken email.** Log out. Open `/signup`. Fill in any name, the **Student** email again, password `Test1234`. Press "Create account".
  **Must see:** "This email is already registered." under the Email field, in words, and the cursor is in the Email field. No red box at the top of the form. What you typed is still there. Network shows 409.

- [ ] **5. A password that ends with a space.** Still on `/signup`: fill in the **Space** account. Type the password as `Test1234` and then press the space bar once. Press "Create account".
  **Must see:** you land on the Dashboard as "Test Space One". (Step 13 uses this account.)

- [ ] **6. Sign-up messages.** Log out. Open `/signup`. Press "Create account" with everything empty.
  **Must see:** "Enter your full name.", "Enter your email." and "Use at least 8 characters.", each under its own field. The cursor is in Full name. Network shows no new request.

- [ ] **7. Sign-up messages, one by one.** Fill in a name. Then try each of these and press "Create account" after each:
  - Email `abc` → "Enter a valid email, like name@example.com." and the cursor in Email.
  - A good email that is not used yet, password `Test123` (7 characters) → "Use at least 8 characters." and the cursor in Password.
  - Password `Test1234`, Photo link `www.example.com/a.png` → "Enter a link that starts with https://" and the cursor in Photo link.
  **Must see:** the messages above, and no request in Network for any of the three. A message goes away when you start typing in its field. Do not send a valid form here (it would make another account).

## B. Log in

- [ ] **8. Log-in messages.** Open `/login`. Press "Log in" with both fields empty.
  **Must see:** "Enter your email." and "Enter your password." under their fields, the cursor in Email, no request in Network.

- [ ] **9. More log-in messages.** Email `abc`, any password → "Enter a valid email, like name@example.com." Then a good email and an empty password → "Enter your password." and the cursor in Password.
  **Must see:** those messages; still no request in Network.

- [ ] **10. Log in.** Log in as **Student** with "Remember my email on this device" unticked.
  **Must see:** the button reads "Logging in…". You land on `/dashboard`. The header shows "Test Student One". The tab title is "Dashboard · University Alumni".

- [ ] **11. Wrong password.** Log out. Log in as **Student** with the password `Wrong1234`.
  **Must see:** one red message above the fields: "The email or password is not correct." It does not say which one was wrong. Email and password are still filled in. Network shows 401. The server's own text is not on the page.

- [ ] **12. Unknown email.** Email `nobody-here@example.com`, password `Test1234`.
  **Must see:** exactly the same words as in step 11.

- [ ] **13. The password is sent as typed.** Log in as **Space** with `Test1234` and no space at the end.
  **Must see:** "The email or password is not correct."
  Now add one space at the end of the password and press "Log in".
  **Must see:** you are logged in as "Test Space One". (If the first try logs in, the password is being trimmed somewhere: that is a fail.)

- [ ] **14. A double press sends one request.** Log out. Fill in the **Student** account. Clear the Network list, then press Enter twice quickly in the Password field.
  **Must see:** exactly one `POST /api/auth/login` in Network.

- [ ] **15. Remember my email, ticked.** Log out. Log in as **Student** with the box ticked. Then log out again.
  **Must see:** on the log-in page the Email field already holds the Student email and the box is ticked. The Password field is empty. In Local Storage, `ua.rememberedEmail` holds the email, and no key holds the password.

- [ ] **16. Remember my email, unticked.** Untick the box. Log in as **Student**. Log out.
  **Must see:** the Email field is empty, the box is unticked, and `ua.rememberedEmail` is gone from Local Storage.

- [ ] **17. Server stopped.** Log in as **Student** and stay logged in for a moment. Stop the API server and keep the frontend running. (If one `npm run dev` started both, stop it and run `npm run dev:frontend` alone.) Open My profile and press "Log out".
  **Must see:** you are on the log-in page all the same.
  Now fill in the Student account and press "Log in".
  **Must see:** "Something went wrong. Try again." above the fields, and what you typed is still there.
  Start `npm run dev` again before the next step.

## C. Theme

- [ ] **18. Dark.** On `/login`, press the moon button at the top right.
  **Must see:** the whole page turns dark at once. The moon button is the filled one. `ua.theme` in Local Storage is `dark`.

- [ ] **19. Reload in dark, no flash.** Reload `/login` several times. Then in the Network tab set throttling to "Slow 4G" (or "Slow 3G") and reload again. Log in and do the same on `/dashboard`. Set throttling back to "No throttling" after.
  **Must see:** the page is dark from the first moment, every time. Never a white page first.

- [ ] **20. The choice survives closing the browser.** Close every browser window. Open the app again.
  **Must see:** dark.

- [ ] **21. Light.** Press the sun button. Reload.
  **Must see:** light before and after the reload, also if Windows itself is set to dark.

- [ ] **22. System, live.** Press the monitor button. Now change the system setting while the page is open: Windows Settings → Personalization → Colors → "Choose your mode" (or "Choose your default app mode") → switch between Light and Dark.
  **Must see:** the page follows each change within a second, with no reload. `ua.theme` is `system`.

- [ ] **23. Nothing saved means system.** Delete `ua.theme` in Local Storage and reload.
  **Must see:** the page matches the Windows setting, and the monitor button is the filled one.

## D. The shell on a wide screen

Log in as **Student**. Make the window at least 1100px wide.

- [ ] **24. Header.**
  **Must see:** a white bar with a line under it. Left: "University Alumni", then Dashboard, Directory, Feed. **No "Users" link.** Right: three theme icon buttons, then the avatar and "Test Student One". The link of the page you are on is bold with a coloured line under it.

- [ ] **25. The six pages.** Press Dashboard, Directory, Feed and the avatar (My profile). Then type `/directory/5` in the address bar.
  **Must see:** each shows the dark band with its own heading and one line of text, and a card that overlaps the band and says "This page is being built". The header and footer stay. The tab title changes each time ("Feed · University Alumni"). On `/directory/5` the heading is "Alumni profile" and "Directory" is still the bold link.

- [ ] **26. Footer.** Scroll to the bottom of any page.
  **Must see:** "University Alumni" and no "About" link.

- [ ] **27. The header while the name loads.** In Network set throttling to "Slow 4G" and reload the Dashboard. Set it back after.
  **Must see:** a grey block where the avatar and name go, then the name. No spinner.

- [ ] **28. Only the log-in page is downloaded at first.** Log out. In Network, filter on "JS", clear the list and reload `/login`. (Under `npm run dev` the files are many and small; step 58 repeats this on the real build, where it counts.)
  **Must see:** no file with Dashboard, Directory, Feed, Users or MyProfile in its name.

## E. Phone layout

Open the device toolbar in the developer tools (Ctrl+Shift+M) and set the width to **360**. Log in as **Student**.

- [ ] **29. Phone header.**
  **Must see:** a lower bar with only "University Alumni" and a menu button. No row of links.

- [ ] **30. Phone menu.** Press the menu button.
  **Must see:** the menu fills the screen. Large links: Dashboard, Directory, Feed, My profile (no Users). The current page is bold with a coloured bar at its left. Under "Theme": three text buttons, Light, Dark, System. At the bottom: the avatar, "Test Student One", the email, and "Log out".

- [ ] **31. Closing the menu.** Close it with the X. Open it and press Escape. Open it and choose Feed. Open it and drag the window wider than 768px.
  **Must see:** it closes each time. Choosing Feed also opens the Feed page.

- [ ] **32. Theme from the menu.** Open the menu and press Dark, then Light.
  **Must see:** the theme changes behind and inside the menu; the pressed button is the filled one.

- [ ] **33. Nothing scrolls sideways at 360px.** Look at the Dashboard, My profile, and (logged out) `/login` and `/signup`. On the two forms also press the submit button with empty fields so the messages show.
  **Must see:** no sideways scroll bar and no cut-off text. On log in and sign-up the dark panel sits above the form, in one column.

- [ ] **34. Log out from the phone menu.** Log in, open the menu, press "Log out".
  **Must see:** the log-in page, with no "session has ended" message. Network shows `PUT /api/users/<number>/logout` answered 200. `ua.token` is gone from Local Storage.

Turn the device toolbar off again.

## F. Keyboard only

Put the mouse aside for this part.

- [ ] **35. Log-in form.** On `/login`, click once in the address bar, then press Tab again and again.
  **Must see:** the order is: Light, Dark, System, Email, Password, Show, the checkbox, Log in, Create an account, the email link. Every stop shows a thick ring around it. Space ticks the checkbox. Enter on "Show" shows the password. Enter in a field sends the form.

- [ ] **36. Errors move the cursor.** Send the log-in form empty with Enter.
  **Must see:** the cursor is in Email without you pressing Tab.

- [ ] **37. Sign-up form.** On `/signup`, Tab through the form. On the "I am a" choice press the right and left arrow keys.
  **Must see:** the order follows the page from top to bottom. The arrows switch between Student and Graduate, and the choice is one Tab stop.

- [ ] **38. Skip link.** Log in (with the keyboard). On the Dashboard, click in the address bar, then press Tab once.
  **Must see:** a "Skip to content" link appears at the top. Press Enter: the next Tab goes into the page, not back to the header.

- [ ] **39. Header by keyboard.** Tab through the header.
  **Must see:** the order is: Skip to content, University Alumni, Dashboard, Directory, Feed, the three theme buttons, My profile. Each shows the ring. Enter on Feed opens Feed.

- [ ] **40. Phone menu by keyboard.** Make the window narrower than 768px. Tab to the menu button and press Enter.
  **Must see:** the menu opens and the ring is on the close button. Tab goes round inside the menu and never reaches the page behind it. Escape closes it and the ring is back on the menu button.

- [ ] **41. Dialog by keyboard.** Open `/dev/components` (this page exists only under `npm run dev`). Tab to the "Delete post" button in the Dialog section and press Enter.
  **Must see:** a small card in the middle with two buttons; the ring is on "Cancel". Tab stays inside the card. Escape closes it and the ring is back on the button that opened it.

## G. Who may see what

- [ ] **42. Users, as a non-admin.** Logged in as **Student**, clear the Network list and type `/users` in the address bar.
  **Must see:** the heading "Users" and a card "You do not have access to this page" with a link "Go to the Dashboard", inside the normal header and footer. In Network the only API call is `GET /api/users/<your number>`. There is **no** call to plain `GET /api/users`.

- [ ] **43. Unknown address.** Type `/nothing-here` in the address bar.
  **Must see:** the heading "Page not found", a card "There is no page at this address" and a link "Go to the Dashboard" that works.

- [ ] **44. Logged in, opening log in or sign-up.** Type `/login`, then `/signup`, then `/` in the address bar.
  **Must see:** the Dashboard each time.

- [ ] **45. Admin (only if you have an admin account).** Log in as the admin.
  **Must see:** a "Users" link in the header and in the phone menu. `/users` shows "This page is being built".

## H. Where you land

- [ ] **46. Logged out, asking for a page.** Log out. Type `/feed` in the address bar.
  **Must see:** the log-in page, with no "session has ended" message.
  Log in as **Student**.
  **Must see:** the **Feed** page, not the Dashboard.

- [ ] **47. After a log out, the Dashboard.** Open My profile and press "Log out". Log in again.
  **Must see:** the **Dashboard**, not My profile.

- [ ] **48. Back after log out.** Log out, then press the browser's Back button.
  **Must see:** you stay on (or come back to) the log-in page. No page of the shell shows.

## I. When a session ends

Each of the three ways must show the red message **"Your session has ended. Log in again."** on the log-in page.

- [ ] **49. The server refuses the token (a 401).** Log in as **Student** and open Directory. In the Console paste this line and press Enter. It spoils the end of the stored token, so the server will refuse it:

  ```js
  localStorage.setItem("ua.token", localStorage.getItem("ua.token").slice(0, -3) + "AAA");
  ```

  Reload the page.
  **Must see:** Network shows `GET /api/users/<number>` answered 401. You are on the log-in page with "Your session has ended. Log in again." `ua.token` is gone.
  Log in as **Student**.
  **Must see:** you are back on **Directory**. The message is gone.

- [ ] **50. The token runs out while the page is open (takes an hour).** Log in as **Student** and open Feed. Leave the tab open and do not touch or reload it for at least 61 minutes. Then click "Directory" in the header.
  **Must see:** the log-in page with "Your session has ended. Log in again."
  Log in.
  **Must see:** you land on **Directory**, the page you clicked.

- [ ] **51. A reload with an expired token stored.** Log in as **Student** and open Feed. In the Console paste this and press Enter. It sets the token's expiry time to one minute ago:

  ```js
  (() => {
    const parts = localStorage.getItem("ua.token").split(".");
    const data = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    data.exp = Math.floor(Date.now() / 1000) - 60;
    parts[1] = btoa(JSON.stringify(data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    localStorage.setItem("ua.token", parts.join("."));
  })();
  ```

  Reload the page.
  **Must see:** the log-in page with "Your session has ended. Log in again.", and no page of the shell shown first, not even for a moment. Network shows no API call with the old token.

- [ ] **52. The message leaves, and a log out does not show it.** On that log-in page type a wrong password and press "Log in".
  **Must see:** "The email or password is not correct." and the session message is gone (the two never stand together).
  Then log in, log out with the button, and look at the log-in page.
  **Must see:** no "session has ended" message.

- [ ] **53. A second user after the first one's session ended.** Log in as **Student**. Run the line of step 49 again and reload, so you are on the log-in page with the message. Now log in as **Graduate**.
  **Must see:** the header shows "Test Graduate One" and the Graduate's picture. At no moment, not even briefly, does it show "Test Student One" or "TO".

- [ ] **54. Two tabs.** Log in as **Student**. Open the app in a second tab, so both show the Dashboard. In tab 1 log out. Look at tab 2 without reloading it.
  **Must see:** tab 2 is on the log-in page, with no "session has ended" message.
  Now log in in tab 1 and look at tab 2 again.
  **Must see:** tab 2 is logged in too.

## J. Looks

- [ ] **55. Hover.** Open `/dev/components` under `npm run dev`. Move the mouse over: each kind of button, a link, a table row, a page number, a theme button that is not pressed, and the Dismiss button of a toast ("Show a toast").
  **Must see:** buttons, the link and the table row change a little (the row turns light grey and the "Student" tag on it is still easy to see). Nothing jumps or changes size. A disabled or busy button does not react. The toast stays as long as the mouse is on it. Do this in light and in dark.

- [ ] **56. 200% zoom.** Make the window 1280px wide. Press Ctrl and + until the zoom reads 200%. Look at `/login`, `/signup`, the Dashboard, My profile and `/dev/components`. Press Ctrl+0 after.
  **Must see:** each page shows its phone layout (menu button in the header, one column). No sideways scroll bar, no cut-off text, no text on top of other text.

- [ ] **57. Beside the pictures.** Open `docs/design/screens/login.html`, `login-dark.html`, `signup.html`, `phone-menu.html`, `system.html` and `system-dark.html` from the repo in other tabs. Put each beside the matching page of the app, in the matching theme.
  **Must see:** the same layout, colors and wording. Known, agreed differences are listed in `check-notes.md` under "Decisions for you" and in the "size-snapping" table of `architecture.md`; anything else is worth a note.

## K. The real build, and a second browser

- [ ] **58. The production build in a browser.** Stop `npm run dev:frontend` (keep the API running, or start it with `npm run dev:api`). Run `npm run build`, then `npm run preview --workspace=@alumni/frontend`, and open the address it prints (usually `http://localhost:4173`).
  Do these on that address: log in as **Student**; choose Dark and reload; open `/dev/components`; log out, then with Network filtered on "JS" reload `/login`.
  **Must see:** the log in works and the header shows the name. Dark is there from the first moment after the reload. `/dev/components` shows "Page not found" (the components page is not in the build). On `/login` only four script files load: one starting with `index`, one with `LoginPage`, one with `TextInput`, one with `Link`.
  If the log in says "Something went wrong" here but works under `npm run dev`, the preview server is not passing `/api` on to the backend. Write that down and skip the step; it does not mean the build is wrong.

- [ ] **59. Firefox (only if it is installed).** Under `npm run dev`, in Firefox: log in, switch the theme and reload, open the phone menu at a narrow width and close it with Escape, open the dialog on `/dev/components` and close it with Escape, Tab through the log-in form.
  **Must see:** the same as in Chrome.

## L. The deployed site

- [ ] **60. Reload on a deep address (only once the site is on the Apache server).** On the deployed site open `/login` and reload. Log in, open `/feed` and reload.
  **Must see:** the same page again both times, never Apache's own "404 Not Found". If you get the 404, Apache needs a rule that sends unknown addresses to `index.html`.

---

## Not covered

These were not proven by any task and have no step above. Each line says why.

| What | Why it is not on the list | What it would take |
|---|---|---|
| **Safari** (Mac and iPhone) | This is a Windows machine. No task ran Safari. | Someone with a Mac or an iPhone runs steps 10, 18, 19, 30, 31 and 41. |
| **A screen reader** (NVDA, Narrator, VoiceOver) | No task ran one. The labels, roles and live regions are in the code and were read by a script, but nobody heard them. | With NVDA or Windows Narrator on: an error under a field is read with the field (step 8); "The email or password is not correct." is read when it appears (step 11); the toast is read (step 1); the dialog is announced as a dialog with its heading (step 41). Also decide the "Show / Hide password" question in `check-notes.md`. |
| **A real phone and a touch screen** | Only the developer tools' phone view was used. | Open the app on a phone on the same network and run steps 29 to 34. |
| **A password manager and the browser's autofill** | Not seen by any task. | Let the browser save the Student password, then see that it fills both fields on `/login` and that "Log in" works. |
| **A slow network between two pages** | Reasoned from the router's code, not seen. | With "Slow 4G", click from Dashboard to Feed: the old page should stay until the new one is ready. |
| **A device clock that is more than an hour fast** | Not handled by the code: every new token then looks expired, and the user is sent back to log in each time. | A decision, not a test. Listed in `check-notes.md`. |
| **The header when the profile call fails**, with the real backend | Seen only with a server that was not there (plain avatar and "My profile"). The real backend does not fail on demand. | Nothing more is needed unless it is seen to go wrong. |
| **"Account created. Log in to continue."** (AC55, second half) | It shows only when the account is made but the log in right after it fails. The real backend does not fail on demand. It was seen once, against made-up answers, in TASK-009. | Hard to force by hand. If you want to try: press "Create account" for a new test email and stop the API server in the same second. |
| **Contrast measured with a tool** (AC59) | The colors are the 27 approved tokens, so the pairs are the design's. No task measured them on the built pages. One known low pair was fixed by a deviation (the toast's Dismiss ring; see `check-notes.md`). | Run a contrast checker (for example the Lighthouse tab in Chrome) on `/login` and `/dev/components` in both themes. |
| **Apache** before the site is deployed | Step 60 can only be done on the server. | Run step 60 at the first deploy. |

## When you are done

Tell Claude which steps failed or surprised you, by number. The test accounts stay in the database: `test-student-1@example.com`, `test-graduate-1@example.com`, `test-space-1@example.com`.
