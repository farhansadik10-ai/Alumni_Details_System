# REQ-fs-003-finish-backend-api — Review Packet

`Packet: 30KB · round 3 · 9 files in this round`

## Round 3 — what changed since round 2

| ID | Round-2 finding | Disposition in fix round 3 |
|---|---|---|
| n1 (ARCH-101, QUAL-102) | no accurate shared type for sign-up and user-update bodies; barrel exported the legacy `User` | fixed: `SignUpUserDTO`, `UpdateUserDTO` added; `User` and `CreateUserDTO` out of `shared/index.ts` (still in `user.types.ts` for the legacy frontend) |
| n2 (ARCH-102) | `getAllComments` and `findCommentById` answered bare rows | fixed: both use `COMMENT_READ`; list order gains an `id` tie-break |
| n4 (QUAL-103) | `queryFilterValue` repeated `queryText` | fixed: one private reader, a linear space strip |
| m6 (QUAL-005 leftover) | role names as bare strings in routes and `UserController.ts` | fixed: `ADMIN_ROLE`, `ALUMNI_ROLE`, `STUDENT_ROLE` from `requestHelpers.ts` |
| n3, m1, m4, m9 | the owner's call; not in this round | unchanged |

Files in this round: the 7 tracked source files below, diffed against the last commit with full context (so each also shows its round-2 changes, which you have already reviewed — the round-3 parts are the ones named in the table), `shared/index.ts` (new file, full text), and one changed check (J14) in `scripts/api-check.mjs`.

**Review only what round 3 changed**, plus anything it broke. `Packet-gap` rules are as in round 1. The spec and architecture are unchanged; read them from the REQ folder if you need them (required reading, not a packet gap).

## Diff with full context (vs the last commit)

```diff
diff --git a/backend/src/api/controllers/UserController.ts b/backend/src/api/controllers/UserController.ts
index 9dbcb033..e26dd838 100644
--- a/backend/src/api/controllers/UserController.ts
+++ b/backend/src/api/controllers/UserController.ts
@@ -1,148 +1,154 @@
 import { Request, Response } from "express";
 import {
   UserManager,
   ForbiddenError,
   NotFoundError,
   ValidationError,
 } from "@alumni/businesslogic";
 import { UserDTO } from "@alumni/dal";
 import bcrypt from "bcrypt";
 import {
   pickSent,
   isAdmin,
   isSelf,
   isNonEmptyString,
   isStringOrNull,
   parseId,
   parsePaging,
   queryText,
   checkFields,
+  ALUMNI_ROLE,
+  STUDENT_ROLE,
+  CREDENTIALS_REQUIRED_MESSAGE,
+  NO_FIELDS_MESSAGE,
 } from "../utils/requestHelpers";
 
 const PASSWORD_SALT_ROUNDS = 10;
 
 // The roles a person may pick at sign-up. Admin is never one of them (ADR-01).
-const SIGNUP_ROLES: readonly unknown[] = ["student", "alumni"];
+const SIGNUP_ROLES: readonly unknown[] = [STUDENT_ROLE, ALUMNI_ROLE];
 
 // The only fields PUT /api/users/:id may change. `role` and `id` are not here.
 const USER_UPDATE_FIELDS = ["name", "email", "password", "photo_url"] as const;
 // NOT NULL in the database: when sent, must be a non-empty string.
 const REQUIRED_USER_FIELDS = ["email", "password"] as const;
 // One rule per updatable field. `name` and `photo_url` are nullable in the
 // database: when sent, a string or null.
+// `email` and `password` must stay listed: `checkFields` passes on only the
+// keys that have a rule, so without them an email or password change would be
+// dropped. Their rules never fail in `updateUser`, because the loop over
+// REQUIRED_USER_FIELDS refuses a bad value first, with its own message.
 const USER_UPDATE_RULES = {
   email: isNonEmptyString,
   password: isNonEmptyString,
   name: isStringOrNull,
   photo_url: isStringOrNull,
 };
 
 const SIGNUP_ROLE_MESSAGE = "Role must be student or alumni";
-const CREDENTIALS_REQUIRED_MESSAGE = "Email and password are required";
 const USER_NOT_FOUND_MESSAGE = "User not found";
 const UPDATE_FORBIDDEN_MESSAGE = "Not authorized to update this user";
 const LOGOUT_FORBIDDEN_MESSAGE = "Not authorized to log out this user";
-const NO_FIELDS_MESSAGE = "No fields to update";
 const USER_DELETED_MESSAGE = "User deleted successfully";
 
 export class UserController {
   private readonly userManager = new UserManager();
 
   public async createUser(req: Request, res: Response): Promise<void> {
     const { name, email, password, role, photo_url } = req.body ?? {};
     if (!SIGNUP_ROLES.includes(role)) {
       throw new ValidationError(SIGNUP_ROLE_MESSAGE);
     }
     if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
       throw new ValidationError(CREDENTIALS_REQUIRED_MESSAGE);
     }
 
     const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
     const user = new UserDTO(name, email, hashedPassword, role, photo_url);
     const newUser = await this.userManager.createUser(user);
     res.status(201).json(newUser);
   }
 
   public async getAllUsers(req: Request, res: Response): Promise<void> {
     const { page, limit, offset } = parsePaging(req.query);
     const filter = {
       q: queryText(req.query, "q"),
       role: queryText(req.query, "role"),
     };
 
     const { rows, total } = await this.userManager.listUsers(filter, {
       limit,
       offset,
     });
     res.status(200).json({ items: rows, total, page, limit });
   }
 
   public async findUserById(req: Request, res: Response): Promise<void> {
     const id = parseId(req.params.id);
     const user = await this.userManager.findUserById(id);
     if (!user) {
       throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
     }
     res.status(200).json(user);
   }
 
   public async findUserByEmail(req: Request, res: Response): Promise<void> {
     const email = Array.isArray(req.params.email)
       ? req.params.email[0]
       : req.params.email;
     const user = await this.userManager.findUserByEmail(email);
     if (!user) {
       throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
     }
     res.status(200).json(user);
   }
 
   public async updateUser(req: Request, res: Response): Promise<void> {
     const id = parseId(req.params.id);
     // 403 comes before the 400 body checks and the 404 here, so a non-admin
     // cannot learn which user ids exist.
     if (!isSelf(req, id) && !isAdmin(req)) {
       throw new ForbiddenError(UPDATE_FORBIDDEN_MESSAGE);
     }
 
     const sent = pickSent(req.body, USER_UPDATE_FIELDS);
     if (Object.keys(sent).length === 0) {
       throw new ValidationError(NO_FIELDS_MESSAGE);
     }
 
     for (const field of REQUIRED_USER_FIELDS) {
       if (field in sent && !isNonEmptyString(sent[field])) {
         throw new ValidationError(`${field} must be a non-empty string`);
       }
     }
     const fields = checkFields(sent, USER_UPDATE_RULES);
 
     if (typeof fields.password === "string") {
       fields.password = await bcrypt.hash(fields.password, PASSWORD_SALT_ROUNDS);
     }
 
     const updated = await this.userManager.updateUser(id, fields);
     if (!updated) {
       throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
     }
     res.status(200).json(updated);
   }
 
   public async deleteUser(req: Request, res: Response): Promise<void> {
     const id = parseId(req.params.id);
     const deleted = await this.userManager.deleteUser(id);
     if (!deleted) {
       throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
     }
     res.status(200).json({ message: USER_DELETED_MESSAGE });
   }
 
   public async updateLogoutTime(req: Request, res: Response): Promise<void> {
     const id = parseId(req.params.id);
     if (!isSelf(req, id)) {
       throw new ForbiddenError(LOGOUT_FORBIDDEN_MESSAGE);
     }
     const updated = await this.userManager.updateLogoutTime(id);
     res.status(200).json(updated);
   }
 }
diff --git a/backend/src/api/routes/AlumniRoutes.ts b/backend/src/api/routes/AlumniRoutes.ts
index 86414ffa..7c598ae7 100644
--- a/backend/src/api/routes/AlumniRoutes.ts
+++ b/backend/src/api/routes/AlumniRoutes.ts
@@ -1,25 +1,26 @@
 import { Router } from "express";
 import { AlumniController } from "../controllers/AlumniController";
 import { authMiddleware } from "../MiddleWare/authMiddleware";
 import { requireRole } from "../MiddleWare/roleMiddleware";
 import { handler } from "../utils/asyncHandler";
+import { ADMIN_ROLE, ALUMNI_ROLE } from "../utils/requestHelpers";
 
 const router = Router();
 const alumniController = new AlumniController();
 
 router.post(
   "/",
   authMiddleware,
-  requireRole("alumni", "admin"),
+  requireRole(ALUMNI_ROLE, ADMIN_ROLE),
   handler(alumniController, "createAlumni"),
 );
 router.get("/", authMiddleware, handler(alumniController, "getAllAlumni"));
 
 // The fixed paths must stay above "/:id", or Express reads "filters" and "me" as an id.
 router.get("/filters", authMiddleware, handler(alumniController, "getAlumniFilters"));
 router.get("/me", authMiddleware, handler(alumniController, "getMyAlumni"));
 router.get("/email/:email", authMiddleware, handler(alumniController, "findAlumniByEmail"));
 router.get("/:id", authMiddleware, handler(alumniController, "findAlumniById"));
 router.put("/:id", authMiddleware, handler(alumniController, "updateAlumni")); // owner or admin only; checked in the controller
 
 export default router;
diff --git a/backend/src/api/routes/PostRoutes.ts b/backend/src/api/routes/PostRoutes.ts
index 4d587c49..fa778753 100644
--- a/backend/src/api/routes/PostRoutes.ts
+++ b/backend/src/api/routes/PostRoutes.ts
@@ -1,18 +1,19 @@
 import { Router } from "express";
 import { PostController } from "../controllers/PostController";
 import { CommentController } from "../controllers/CommentController";
 import { authMiddleware } from "../MiddleWare/authMiddleware";
 import { requireRole } from "../MiddleWare/roleMiddleware";
 import { handler } from "../utils/asyncHandler";
+import { ADMIN_ROLE, ALUMNI_ROLE } from "../utils/requestHelpers";
 
 const router = Router();
 const posts = new PostController();
 const comments = new CommentController();
 
-router.post("/", authMiddleware, requireRole("alumni", "admin"), handler(posts, "createPost"));
+router.post("/", authMiddleware, requireRole(ALUMNI_ROLE, ADMIN_ROLE), handler(posts, "createPost"));
 router.get("/", authMiddleware, handler(posts, "getAllPosts"));
 router.get("/:id/comments", authMiddleware, handler(comments, "getCommentsByPost"));
 router.put("/:id", authMiddleware, handler(posts, "updatePost"));   // author only, even for admins (ADR-02); checked in the controller
 router.delete("/:id", authMiddleware, handler(posts, "deletePost")); // author or admin; checked in the controller
 
 export default router;
diff --git a/backend/src/api/routes/UserRoutes.ts b/backend/src/api/routes/UserRoutes.ts
index f63a45a9..9cdb2a13 100644
--- a/backend/src/api/routes/UserRoutes.ts
+++ b/backend/src/api/routes/UserRoutes.ts
@@ -1,18 +1,19 @@
 import { Router } from "express";
 import { UserController } from "../controllers/UserController";
 import { authMiddleware } from "../MiddleWare/authMiddleware";
 import { requireRole } from "../MiddleWare/roleMiddleware";
 import { handler } from "../utils/asyncHandler";
+import { ADMIN_ROLE } from "../utils/requestHelpers";
 
 const router = Router();
 const users = new UserController();
 
 router.post("/", handler(users, "createUser"));                                          // signup — public
-router.get("/", authMiddleware, requireRole("admin"), handler(users, "getAllUsers"));    // admin only — full user list
+router.get("/", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "getAllUsers"));    // admin only — full user list
 router.get("/:id", authMiddleware, handler(users, "findUserById"));                      // any logged-in user
-router.get("/email/:email", authMiddleware, requireRole("admin"), handler(users, "findUserByEmail"));
+router.get("/email/:email", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "findUserByEmail"));
 router.put("/:id", authMiddleware, handler(users, "updateUser"));                        // self or admin — checked in the controller
-router.delete("/:id", authMiddleware, requireRole("admin"), handler(users, "deleteUser"));
+router.delete("/:id", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "deleteUser"));
 router.put("/:id/logout", authMiddleware, handler(users, "updateLogoutTime"));           // self only — checked in the controller
 
 export default router;
diff --git a/backend/src/api/utils/requestHelpers.ts b/backend/src/api/utils/requestHelpers.ts
index 3582c2f2..4ffeeef9 100644
--- a/backend/src/api/utils/requestHelpers.ts
+++ b/backend/src/api/utils/requestHelpers.ts
@@ -1,212 +1,260 @@
 import { Request } from "express";
 import { ValidationError } from "@alumni/businesslogic";
 import type { UpdateFields, UpdateValue } from "@alumni/dal";
 
 export const ADMIN_ROLE = "admin";
+export const ALUMNI_ROLE = "alumni";
+export const STUDENT_ROLE = "student";
 export const DEFAULT_PAGE_SIZE = 12;
 export const MAX_PAGE_SIZE = 50;
 /** The largest value a PostgreSQL `integer` column can hold. */
 export const MAX_DB_INTEGER = 2147483647;
 
 const FIRST_PAGE = 1;
 /** The highest page whose offset is still a whole number JavaScript holds exactly. */
 const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / MAX_PAGE_SIZE);
 const DIGITS_ONLY = /^\d+$/;
+/** The space character (U+0020), the only one SQL `btrim(x)` strips. */
+const SPACE = " ";
+
+// Messages more than one controller answers with: one copy, so the wording
+// cannot drift between them.
+export const CREDENTIALS_REQUIRED_MESSAGE = "Email and password are required";
+export const NO_FIELDS_MESSAGE = "No fields to update";
 
 /**
  * The allowed fields a request actually sent.
  * A key is kept when it is an own property of the body and its value is not
  * `undefined`. `null` is kept, so a nullable field can be cleared.
  * A missing or non-object body gives `{}`.
  */
 export function pickSent<K extends string>(
   body: unknown,
   keys: readonly K[]
 ): Partial<Record<K, unknown>> {
   const sent: Partial<Record<K, unknown>> = {};
   if (typeof body !== "object" || body === null || Array.isArray(body)) {
     return sent;
   }
 
   const source = body as Record<string, unknown>;
   for (const key of keys) {
     if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
     const value = source[key];
     if (value !== undefined) sent[key] = value;
   }
   return sent;
 }
 
 export function isAdmin(req: Request): boolean {
   return req.user?.role === ADMIN_ROLE;
 }
 
 /**
  * True when `userId` is the id in the caller's token.
  * `Number(null)` and `Number("")` are 0, so those are refused before the
  * comparison instead of being read as user 0.
  */
 export function isSelf(req: Request, userId: unknown): boolean {
   const callerId = toUserId(req.user?.sub);
   const otherId = toUserId(userId);
   if (callerId === undefined || otherId === undefined) return false;
   return callerId === otherId;
 }
 
 function toUserId(value: unknown): number | undefined {
   if (typeof value === "string") {
     if (value.trim() === "") return undefined;
   } else if (typeof value !== "number") {
     return undefined;
   }
   const id = Number(value);
   return Number.isNaN(id) ? undefined : id;
 }
 
 /** A string with at least one character that is not white space. */
 export function isNonEmptyString(value: unknown): value is string {
   return typeof value === "string" && value.trim().length > 0;
 }
 
 export function isStringOrNull(value: unknown): boolean {
   return value === null || typeof value === "string";
 }
 
 /** A numeric string such as "2020" is not an integer here. */
 export function isIntegerOrNull(value: unknown): boolean {
   return value === null || Number.isInteger(value);
 }
 
-/**
- * The first key in `fields` whose value fails `check`, or `undefined` when
- * every value passes. Lets a controller answer 400 "<key> has the wrong type".
- */
-export function findWrongType(
-  fields: Readonly<Record<string, unknown>>,
-  check: (value: unknown) => boolean
-): string | undefined {
-  return Object.keys(fields).find((key) => !check(fields[key]));
-}
-
 export function isBoolean(value: unknown): value is boolean {
   return typeof value === "boolean";
 }
 
+/** A checked field as the text a DTO takes; absent or `null` is `null`. */
+export function textOrNull(value: unknown): string | null {
+  return typeof value === "string" ? value : null;
+}
+
 /**
  * A string of digits only, or a number, read as a whole number that JavaScript
  * holds exactly. Everything else gives `undefined`: `null`, `""`, `"1.5"`,
  * `"-3"`, `"12abc"`, arrays and objects never reach `Number(...)`, which
  * would read several of them as 0.
  */
-function toWholeNumber(value: unknown): number | undefined {
+export function toWholeNumber(value: unknown): number | undefined {
   if (typeof value === "string") {
     if (!DIGITS_ONLY.test(value)) return undefined;
   } else if (typeof value !== "number") {
     return undefined;
   }
   const whole = Number(value);
   return Number.isSafeInteger(whole) ? whole : undefined;
 }
 
 /**
  * An id from the URL or the body: a positive whole number.
  * Throws `ValidationError("Invalid <label>")` for anything else.
  */
 export function parseId(value: unknown, label = "id"): number {
   const id = toWholeNumber(value);
   // Ids are PostgreSQL `integer` columns: a larger number can match no row,
   // so it is refused here instead of being sent to the database.
   if (id === undefined || id < 1 || id > MAX_DB_INTEGER) {
     throw new ValidationError("Invalid " + label);
   }
   return id;
 }
 
 export interface Paging {
   page: number;
   limit: number;
   offset: number;
 }
 
 /**
  * `page` and `limit` from the query string (ADR-12).
  * Absent: page 1, limit `DEFAULT_PAGE_SIZE`. Sent: a string of digits, 1 or
  * more, else `ValidationError`. A limit above `MAX_PAGE_SIZE` becomes
  * `MAX_PAGE_SIZE`.
  */
 export function parsePaging(query: Readonly<Record<string, unknown>>): Paging {
   const page = readCount(query, "page", MAX_PAGE) ?? FIRST_PAGE;
   const limit = readCount(query, "limit", MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE;
   return { page, limit, offset: (page - 1) * limit };
 }
 
 /**
  * A count of 1 or more from the query string, lowered to `max` when it is
  * above it. The cap is applied to the number as read, so a digit string too
  * long to hold exactly is still capped instead of refused.
  */
 function readCount(
   query: Readonly<Record<string, unknown>>,
   key: string,
   max: number
 ): number | undefined {
   const sent = query[key];
   if (sent === undefined) return undefined;
 
   const count = typeof sent === "string" && DIGITS_ONLY.test(sent) ? Number(sent) : 0;
   if (count < 1) {
     throw new ValidationError(key + " must be a whole number of 1 or more");
   }
   return Math.min(count, max);
 }
 
 /**
- * One text value from the query string, trimmed. Absent or blank gives
- * `undefined`. A repeated key (`?q=a&q=b`) or a nested one (`?q[x]=a`) arrives
- * as an array or an object and is refused.
+ * One value from the query string, with its outer characters removed by
+ * `strip`. Absent, or empty after `strip`, gives `undefined` ("not sent").
+ * A repeated key (`?q=a&q=b`) or a nested one (`?q[x]=a`) arrives as an array
+ * or an object and is refused.
  */
-export function queryText(
+function readSingleValue(
   query: Readonly<Record<string, unknown>>,
-  key: string
+  key: string,
+  strip: (sent: string) => string
 ): string | undefined {
   const sent = query[key];
   if (sent === undefined) return undefined;
   if (typeof sent !== "string") {
     throw new ValidationError(key + " must be a single value");
   }
-  const text = sent.trim();
+  const text = strip(sent);
   return text === "" ? undefined : text;
 }
 
+/**
+ * `text` without its leading and trailing space characters (U+0020), which is
+ * what SQL `btrim(x)` strips. Two index walks, so the work grows in step with
+ * the length of the text, however many spaces it holds.
+ */
+function stripOuterSpaces(text: string): string {
+  let start = 0;
+  let end = text.length;
+  while (start < end && text[start] === SPACE) start += 1;
+  while (end > start && text[end - 1] === SPACE) end -= 1;
+  return text.slice(start, end);
+}
+
+/**
+ * One text value from the query string, trimmed. Absent or blank gives
+ * `undefined`. A repeated or nested key is refused (see `readSingleValue`).
+ */
+export function queryText(
+  query: Readonly<Record<string, unknown>>,
+  key: string
+): string | undefined {
+  return readSingleValue(query, key, (sent) => sent.trim());
+}
+
+/**
+ * One filter value that is compared in SQL against `btrim(column)`, such as
+ * the alumni `department` and `field` filters. Absent or blank gives
+ * `undefined`; an array or an object is refused, as in `queryText`.
+ *
+ * It differs from `queryText` in what it strips: only leading and trailing
+ * space characters, because that is all `btrim` strips. `queryText` uses
+ * JavaScript `trim()`, which also removes tabs and line breaks. A value stored
+ * as "Eng<tab>" is offered by GET /api/alumni/filters with its tab, and
+ * `trim()` would turn it into "Eng", which matches no row. Here the value the
+ * filter list gave comes back unchanged.
+ */
+export function queryFilterValue(
+  query: Readonly<Record<string, unknown>>,
+  key: string
+): string | undefined {
+  return readSingleValue(query, key, stripOuterSpaces);
+}
+
 function isUpdateValue(value: unknown): value is UpdateValue {
   return (
     value === null ||
     typeof value === "string" ||
     typeof value === "number" ||
     typeof value === "boolean"
   );
 }
 
 /**
  * Checks each sent field against its own rule and returns the fields as the
  * update input type, so the controller needs no cast.
  * Throws `ValidationError("<key> has the wrong type")` for the first key, in
  * the order of `rules`, whose value fails. A value that is not a string,
  * number, boolean or `null` fails whatever its rule says.
  */
 export function checkFields<K extends string>(
   fields: Partial<Record<K, unknown>>,
   rules: Record<K, (value: unknown) => boolean>
 ): UpdateFields<K> {
   const checked: UpdateFields<K> = {};
   for (const key in rules) {
     if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
     const value = fields[key];
     if (value === undefined) continue;
     if (!rules[key](value) || !isUpdateValue(value)) {
       throw new ValidationError(key + " has the wrong type");
     }
     checked[key] = value;
   }
   return checked;
 }
diff --git a/backend/src/dal/query/CommentQuery.ts b/backend/src/dal/query/CommentQuery.ts
index 9f104bac..5821f071 100644
--- a/backend/src/dal/query/CommentQuery.ts
+++ b/backend/src/dal/query/CommentQuery.ts
@@ -1,77 +1,113 @@
 import pool from "../config/db";
 import { CommentDTO } from "../dto/CommentDTO";
+import { withTransaction } from "./transaction";
+
+// The one joined comment read: the comment's own columns plus its author's
+// name and photo. The "User" columns are named one by one (never u.*), so
+// `password` can never come along. Create, update and the list of a post's
+// comments all return this shape, and so does every other comment read.
+const COMMENT_READ = `
+  SELECT c.*, u.name, u.photo_url
+  FROM comment c LEFT JOIN "User" u ON u.id = c.user_id`;
 
 export class CommentQuery {
   constructor() {}
+
+  /**
+   * Inserts the comment, then returns it through the joined read.
+   *
+   * Both statements run on one transaction's client, so the re-read always
+   * finds the row: nothing else can see or delete it before the commit.
+   */
   public async createComment(comment: CommentDTO): Promise<CommentDTO> {
-    const info = await pool.query(
-      "INSERT INTO comment (user_id, posts_id,parent_id,content)VALUES ($1,$2,$3,$4) RETURNING * ",
-      [comment.user_id, comment.posts_id, comment.parent_id, comment.content],
-    );
-    return info.rows[0];
+    return withTransaction(async (client) => {
+      const inserted = await client.query(
+        `INSERT INTO comment (user_id, posts_id, parent_id, content)
+        VALUES ($1, $2, $3, $4) RETURNING id`,
+        [comment.user_id, comment.posts_id, comment.parent_id, comment.content],
+      );
+      const info = await client.query(
+        `${COMMENT_READ}
+        WHERE c.id = $1`,
+        [inserted.rows[0].id],
+      );
+      return info.rows[0];
+    });
   }
+  /** Every comment, newest first; the id breaks a tie so the order is fixed. */
   public async getAllComments(): Promise<CommentDTO[]> {
     const info = await pool.query(
-      "SELECT * FROM comment ORDER BY created_at DESC",
+      `${COMMENT_READ}
+      ORDER BY c.created_at DESC, c.id DESC`,
     );
-     const comments: CommentDTO[] = [];
-        for (const comment of info.rows) {
-            comments.push(comment);
-        }
-        return comments;
+    return info.rows;
   }
 
   public async findCommentById(id: number): Promise<CommentDTO | undefined> {
-    const info = await pool.query("SELECT * FROM comment WHERE id = $1", [id]);
+    const info = await pool.query(
+      `${COMMENT_READ}
+      WHERE c.id = $1`,
+      [id],
+    );
     return info.rows[0];
   }
 
+  /**
+   * Writes the new content, then returns the comment through the joined read.
+   * Returns `undefined` when no comment has this id.
+   */
   public async updateComment(
     comment: CommentDTO,
   ): Promise<CommentDTO | undefined> {
-    const info = await pool.query(
-      `UPDATE comment SET content=$1, updated_at=NOW()
-            WHERE id=$2 RETURNING *`,
+    const updated = await pool.query(
+      `UPDATE comment SET content = $1, updated_at = NOW()
+      WHERE id = $2 RETURNING id`,
       [comment.content, comment.id],
     );
+    if (updated.rows.length === 0) {
+      return undefined;
+    }
+    const info = await pool.query(
+      `${COMMENT_READ}
+      WHERE c.id = $1`,
+      [updated.rows[0].id],
+    );
     return info.rows[0];
   }
 
   /**
    * The comments of one post, oldest first, each with its author's name and
-   * photo. The "User" columns are named one by one, so `password` can never
-   * come along.
+   * photo.
    */
   public async listCommentsByPost(postId: number): Promise<CommentDTO[]> {
     const info = await pool.query(
-      `SELECT c.*, u.name, u.photo_url
-      FROM comment c LEFT JOIN "User" u ON u.id = c.user_id
+      `${COMMENT_READ}
       WHERE c.posts_id = $1
       ORDER BY c.created_at ASC, c.id ASC`,
       [postId],
     );
     return info.rows;
   }
 
   /**
    * Deletes the comment and every reply under it, in one statement, so it is
    * all or nothing without a transaction. Returns how many rows were deleted;
    * 0 means no comment has this id.
    *
    * No foreign key cascades (gotcha G08, ADR-06). The walk starts from this
    * one comment and goes parent -> child only. UNION (not UNION ALL) drops
    * repeats, so a loop in the data cannot make it run forever.
    */
   public async deleteComment(id: number): Promise<number> {
     const info = await pool.query(
       `WITH RECURSIVE doomed AS (
         SELECT id FROM comment WHERE id = $1
         UNION
         SELECT c.id FROM comment c JOIN doomed d ON c.parent_id = d.id
       )
       DELETE FROM comment WHERE id IN (SELECT id FROM doomed)`,
       [id],
     );
     return info.rowCount ?? 0;
   }
 }
diff --git a/shared/types/user.types.ts b/shared/types/user.types.ts
index ca48af3e..ed536fcd 100644
--- a/shared/types/user.types.ts
+++ b/shared/types/user.types.ts
@@ -1,25 +1,73 @@
+// Kept as it is for the legacy frontend, which imports it by file path.
+// It has `password`, so it is not in index.ts. New code uses `PublicUser`.
 export interface User {
   id: number;
   name: string;
   email: string;
   password: string;
   role: string;
   photo_url?: string;
   login_at?: Date;
   logout_at?: Date;
   created_at?: Date;
   updated_at?: Date;
 }
 
+// Kept as it is for the legacy frontend, which imports it by file path.
+// New code uses `SignUpUserDTO` and `UpdateUserDTO`.
 export interface CreateUserDTO {
   name: string;
   email: string;
   password: string;
   role?: string;
   photo_url?: string;
 }
 
 export interface LoginUserDTO {
   email: string;
   password: string;
 }
+
+// A user as the API answers it: every "User" column except password.
+// New code uses this type, not `User` above (kept as it is for the legacy
+// screens). The four dates travel as JSON, so they are ISO date strings.
+export interface PublicUser {
+  id: number;
+  name: string | null;
+  email: string;
+  role: string | null;
+  photo_url: string | null;
+  login_at: string | null;
+  logout_at: string | null;
+  created_at: string | null;
+  updated_at: string | null;
+}
+
+// The body of POST /api/users (sign-up). `role` is required; admin is not a choice.
+export interface SignUpUserDTO {
+  email: string;
+  password: string;
+  role: "student" | "alumni";
+  name?: string | null;
+  photo_url?: string | null;
+}
+
+// The body of PUT /api/users/:id. Send at least one field; `role` cannot be changed here.
+export interface UpdateUserDTO {
+  name?: string | null;
+  // When sent, a non-empty string.
+  email?: string;
+  // When sent, a non-empty string.
+  password?: string;
+  photo_url?: string | null;
+}
+
+// The answer of POST /api/auth/login.
+export interface LoginResponse {
+  token: string;
+}
+
+// The body of every error answer (ADR-11).
+export interface ApiError {
+  error: string;
+}
```

## New files (untracked — full contents)

### shared/index.ts

```ts
// The one door into @alumni/shared: every type the API accepts or answers.
// Types only, no runtime code.
export type {
  Alumni,
  CreateAlumniDTO,
  UpdateAlumniDTO,
} from "./types/alumni.types";
export type {
  Post,
  CreatePostDTO,
  UpdatePostDTO,
} from "./types/posts.types";
export type {
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
} from "./types/comment.types";
export type { Paged, AlumniFilters, Stats } from "./types/list.types";
// The legacy `User` (it has `password`) and `CreateUserDTO` are left out on
// purpose: the legacy frontend reaches them by file path.
export type {
  SignUpUserDTO,
  UpdateUserDTO,
  LoginUserDTO,
  PublicUser,
  LoginResponse,
  ApiError,
} from "./types/user.types";

```

## scripts/api-check.mjs — check J14 as it is now

```js
  await check("J14", "AC12", "GET /api/comments answers 200 with an array, no password in any item, name and photo_url on this run's comments, and none of the deleted comments", async () => {
    const res = await get("/api/comments", tokenOf("dana"));
    expectStatus(res, 200);
    if (!Array.isArray(res.json)) fail("the answer is not an array");
    expectNoPassword(res.json, "the comment list");
    res.json.forEach((item) => expectKeys(item, ["id", "posts_id", "parent_id", "user_id", "content"], "a comment"));
    const all = new Set(res.json.map((item) => item.id));
    if (!all.has(need(ids.s1, "the sibling comment's id"))) fail("the sibling comment is missing");
    if (!all.has(need(ids.extra, "the second post's comment id"))) fail("the second post's comment is missing");
    // Only this run's own comments are held to the joined shape.
    for (const item of res.json) {
      if (item.id === ids.s1) expectKeys(item, ["name", "photo_url"], "the sibling comment in the list");
      if (item.id === ids.extra) expectKeys(item, ["name", "photo_url"], "the second post's comment in the list");
    }
    for (const name of ["c1", "r1", "r2", "leaf"]) {
      if (all.has(need(ids[name], `${name}'s id`))) fail(`a deleted comment (${name}) is still listed`);
    }
  });
```
