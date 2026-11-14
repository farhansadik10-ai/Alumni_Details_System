// Words the app shows or reads out in more than one place, and every word of
// the directory, alumni profile, My profile, feed, dashboard, users and about
// pages (grouped by page below).
// Plain values only: no DOM, no React. The one import is the plural rule from
// lib/postDisplay.ts, a plain function that itself imports nothing (the Vite
// config reads config/app.ts and config/storageKeys.ts, not this file).
// A function is used only for a word with a hole in it (a name, a count, a year).

import { COMMENT_COUNT_MANY_WORD, COMMENT_COUNT_ONE_WORD, countText } from "../lib/postDisplay";

// The loading message, for the screen and for a screen reader.
export const LOADING_TEXT = "Loading";

// ----- Shared words: alumni details on cards, profiles and forms -----------

export const NOT_GIVEN = "Not given";
export const NAME_NOT_GIVEN = "Name not given";
// Joins a job title and a company: "Software Engineer at Nordlys Systems".
export const JOB_LINE_JOINER = " at ";
export const CLASS_OF_PREFIX = "Class of";
export const OPEN_TO_MENTORING = "Open to mentoring";
export const RETRY_LABEL = "Try again";

// The name of each stored role, read by the role tag and the Users role
// filter. The keys are the words in the "User".role column. Typed here, not
// with lib/token's Role, so this file gains no import (G58).
export const ROLE_WORDS: Record<"student" | "alumni" | "admin", string> = {
  student: "Student",
  alumni: "Alumni",
  admin: "Admin",
};
// A user whose role is empty: plain muted text, not a tag.
export const NO_ROLE = "No role";

// ----- Failure words: one pair for every load that can fail (pattern 9) -----

// No answer came: server down, no connection, or an answer that made no sense.
export const FAILURE_NO_ANSWER_TEXT =
  "We could not reach the server. Check your connection and try again.";
// The server answered with an error status. Its own text is never shown.
export const FAILURE_SERVER_TEXT =
  "Something went wrong on our side. Try again in a moment.";

// ----- Directory (/directory) ----------------------------------------------

export const DIRECTORY_HEADING = "Alumni directory";
export const DIRECTORY_SUB =
  "Find graduates by name, company or job title, and see who is open to mentoring.";

export const DIRECTORY_SEARCH_LABEL = "Search";
export const DIRECTORY_SEARCH_PLACEHOLDER = "Name, company or job title";
export const DIRECTORY_SEARCH_BUTTON = "Search";
export const DIRECTORY_DEPARTMENT_LABEL = "Department";
export const DIRECTORY_YEAR_LABEL = "Graduation year";
export const DIRECTORY_FIELD_LABEL = "Field";
export const DIRECTORY_MENTORING_LABEL = "Only show alumni open to mentoring";
export const DIRECTORY_ALL_DEPARTMENTS = "All departments";
export const DIRECTORY_ANY_YEAR = "Any year";
export const DIRECTORY_ANY_FIELD = "Any field";
export const DIRECTORY_CLEAR_BUTTON = "Clear search and filters";

// The phone "Filters" button: "Filters", or "Filters (2)" when two are active.
export const DIRECTORY_FILTERS_BUTTON = "Filters";
export function directoryFiltersButton(activeCount: number): string {
  return activeCount > 0
    ? `${DIRECTORY_FILTERS_BUTTON} (${activeCount})`
    : DIRECTORY_FILTERS_BUTTON;
}

// The card link. Seen as "View profile"; read out with the person's name.
export const DIRECTORY_VIEW_PROFILE = "View profile";
export function directoryViewProfileName(name: string): string {
  return `${DIRECTORY_VIEW_PROFILE} of ${name}`;
}

// The count line (a polite live region): "86 alumni", "1 alumnus".
export function directoryCount(total: number): string {
  return total === 1 ? "1 alumnus" : `${total} alumni`;
}
export const DIRECTORY_COUNT_LOADING = "Loading alumni";
export const DIRECTORY_COUNT_NONE = "No alumni found";
export const DIRECTORY_COUNT_FAILED = "Could not load alumni";

// Empty result, with search or filters set.
export const DIRECTORY_EMPTY_MATCH_HEADING = "No alumni match your search";
export const DIRECTORY_EMPTY_MATCH_TEXT =
  "Try a different name, or clear the search and filters.";
// Empty result, with nothing set: the directory itself is empty.
export const DIRECTORY_EMPTY_NONE_HEADING = "No alumni yet";
export const DIRECTORY_EMPTY_NONE_TEXT =
  "No alumni have joined yet. Check back later.";

// The list failed. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const DIRECTORY_ERROR_HEADING = "The directory could not be loaded";

// The filter options failed. The list still works.
export const DIRECTORY_FILTERS_ERROR_TEXT =
  "The filter options could not be loaded. You can still search.";

// ----- Alumni profile (/directory/:id) -------------------------------------

// The band heading and tab title before the profile has loaded.
export const PROFILE_HEADING = "Alumni profile";
export const PROFILE_BACK_LINK = "Back to directory";

// The contact links.
export function profileEmailLink(firstName: string): string {
  return `Email ${firstName}`;
}
export const PROFILE_LINKEDIN_LINK = "LinkedIn profile";
// Hidden on screen, read out after a link that opens a new tab.
export const OPENS_IN_NEW_TAB = "(opens in a new tab)";

export const PROFILE_ABOUT_HEADING = "About";
export const PROFILE_DETAILS_HEADING = "Details";

// The rows of the Details card.
export const PROFILE_DEPARTMENT_LABEL = "Department";
export const PROFILE_YEAR_LABEL = "Graduation year";
export const PROFILE_FIELD_LABEL = "Field";
export const PROFILE_COMPANY_LABEL = "Company";
export const PROFILE_JOB_TITLE_LABEL = "Job title";
export const PROFILE_EXPERIENCE_LABEL = "Experience";
export const PROFILE_EMAIL_LABEL = "Email";
export const PROFILE_MENTORING_LABEL = "Mentoring";
export const PROFILE_MENTORING_YES = "Open to students";
export const PROFILE_MENTORING_NO = "Not at the moment";

// No such profile: an id that is not a whole number, or a 404.
export const PROFILE_NOT_FOUND_HEADING = "This profile does not exist";
export const PROFILE_NOT_FOUND_TEXT =
  "The link may be wrong, or the profile was removed.";
export const PROFILE_NOT_FOUND_LINK = "Go to the directory";

// Any other failure. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const PROFILE_ERROR_HEADING = "This profile could not be loaded";

// ----- My profile (/profile) -----------------------------------------------

export const MY_PROFILE_HEADING = "My profile";
// The band sub line: "Tanvir Ahmed, tanvir.ahmed@example.com", only the parts that exist.
export function myProfileSub(name: string | null, email: string | null): string {
  return [name, email].filter((part) => part !== null && part !== "").join(", ");
}
export const MY_PROFILE_PUBLIC_LINK = "See my public profile";
export const OPTIONAL_MARK = "(optional)";

// The Alumni profile card.
export const ALUMNI_CARD_HEADING = "Alumni profile";
export const ALUMNI_CARD_INTRO = "This is what other people see in the directory.";
export const ALUMNI_DEPARTMENT_LABEL = "Department";
export const ALUMNI_YEAR_LABEL = "Graduation year";
export const ALUMNI_COMPANY_LABEL = "Current company";
export const ALUMNI_JOB_TITLE_LABEL = "Job title";
export const ALUMNI_FIELD_LABEL = "Field";
export const ALUMNI_EXPERIENCE_LABEL = "Experience";
export const ALUMNI_LINKEDIN_LABEL = "LinkedIn link";
export const ALUMNI_BIO_LABEL = "Bio";
export const ALUMNI_MENTORING_LABEL = "I am open to mentoring students";
export const ALUMNI_SAVE_BUTTON = "Save profile";
export const ALUMNI_DISCARD_BUTTON = "Discard changes";
export const ALUMNI_SAVED_TOAST = "Profile saved";
export const ALUMNI_LOAD_ERROR_HEADING = "Your alumni profile could not be loaded";

// The Account card.
export const ACCOUNT_CARD_HEADING = "Account";
export const ACCOUNT_ROLE_LABEL = "Role";
export const ACCOUNT_NAME_LABEL = "Full name";
export const ACCOUNT_EMAIL_LABEL = "Email";
export const ACCOUNT_EMAIL_HELP = "Ask an admin to change your email.";
export const ACCOUNT_PHOTO_LABEL = "Photo link";
export const ACCOUNT_PHOTO_PLACEHOLDER = "https://";
export const ACCOUNT_PHOTO_HELP = "Without a photo, your initials are shown.";
export const ACCOUNT_SAVE_BUTTON = "Save account";
export const ACCOUNT_LOG_OUT_BUTTON = "Log out";
export const ACCOUNT_SAVED_TOAST = "Account saved";
export const ACCOUNT_LOAD_ERROR_HEADING = "Your account could not be loaded";
// 403 or 404 on saving the Account card: the account, not a profile, is gone.
export const ACCOUNT_SAVE_FAILED_GONE =
  "Your account can no longer be saved. It may have been removed, or you may no longer have access.";

// A failed save, shown in the card that failed. What the user typed is kept.
export const SAVE_FAILED_NO_ANSWER =
  "Your changes were not saved. We could not reach the server. Check your connection and try again.";
export const SAVE_FAILED_SERVER =
  "Your changes were not saved. Something went wrong on our side. Try again.";
// 409 on create: the profile already existed and has been loaded into the form.
export const SAVE_FAILED_CONFLICT =
  "You already had a profile, so we loaded it. Check the details and save again.";
// 403 or 404 on edit. Its button reloads the profile.
export const SAVE_FAILED_GONE =
  "This profile can no longer be saved. It may have been removed, or you may no longer have access.";
export const SAVE_FAILED_GONE_RETRY = RETRY_LABEL;

// ----- Shared words: post and comment actions (REQ-fs-006) -----------------

export const EDIT_LABEL = "Edit";
export const DELETE_LABEL = "Delete";
export const SAVE_LABEL = "Save";
export const CANCEL_LABEL = "Cancel";
export const SAVING_LABEL = "Saving";
export const DELETING_LABEL = "Deleting";

// A failed write of a post or a comment (publish, save or delete). Nothing
// changed and what was typed is kept. Read only through POST_SAVE_FAILURE_WORDS
// and COMMENT_SAVE_FAILURE_WORDS, both shaped as lib/saveFailure's
// SaveFailureWords, so these three are not exported.
const WRITE_FAILED_NO_ANSWER =
  "Nothing was changed. We could not reach the server. Check your connection and try again.";
const WRITE_FAILED_SERVER =
  "Nothing was changed. Something went wrong on our side. Try again in a moment.";
const WRITE_FAILED_GENERAL = "Nothing was changed. Something went wrong. Try again.";

// The comment-count words ("No comments yet", "1 comment", "N comments")
// live in lib/postDisplay.ts (commentCountText), not here.

// ----- Feed (/feed) --------------------------------------------------------

export const FEED_HEADING = "Feed";
export const FEED_SUB = "News, job openings and events from alumni.";
// Visually hidden heading above the list; focus goes here after a post delete.
export const FEED_POSTS_HEADING = "Posts";
// The polite status line above the list: "Showing 12 of 42 posts".
export function feedShowingText(shown: number, total: number): string {
  return `Showing ${shown} of ${countText(total, "post", "posts")}`;
}
export const FEED_LOADING_TEXT = "Loading posts";

export const FEED_LOAD_MORE_BUTTON = "Load more posts";
export const FEED_LOAD_MORE_BUSY = "Loading more posts";
// "Load more" failed. The posts shown stay. The text is a load-failure text.
export const FEED_MORE_ERROR_HEADING = "More posts could not be loaded";

// Empty feed. Alumni and admin get an action that moves focus to the form.
export const FEED_EMPTY_HEADING = "No posts yet";
export const FEED_EMPTY_WRITER_TEXT = "Be the first to share news, a job opening or an event.";
export const FEED_EMPTY_WRITER_ACTION = "Write the first post";
export const FEED_EMPTY_READER_TEXT = "Posts from alumni will appear here. Check back later.";

// The first load failed. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const FEED_ERROR_HEADING = "The feed could not be loaded";

// The side block on the feed: people open to mentoring.
export const FEED_MENTORING_HEADING = OPEN_TO_MENTORING;

// ----- Posts: the form, the post card, edit and delete ---------------------

// Who can post: said to a student instead of the form, and on a 403 on publish.
export const POST_WHO_CAN_POST = "Only alumni and admins can write posts.";
export const FEED_STUDENT_NOTE = `${POST_WHO_CAN_POST} You can read and comment on every post.`;

// The "Write a post" form. Its label is also the Dashboard's link to the feed.
export const POST_FORM_HEADING = "Write a post";
export const POST_CAPTION_PLACEHOLDER = "Share news, a job opening or an event";
export const POST_IMAGE_LABEL = "Image link";
export const POST_IMAGE_OPTIONAL = OPTIONAL_MARK;
export const POST_IMAGE_PLACEHOLDER = ACCOUNT_PHOTO_PLACEHOLDER;
export const POST_PUBLISH_BUTTON = "Publish post";
export const POST_PUBLISH_BUSY = "Publishing";
export const POST_PUBLISHED_TOAST = "Post published";

// Edit in place: label of the caption field, then Save and Cancel.
export const POST_EDIT_LABEL = "Edit post";
export const POST_SAVED_TOAST = "Post saved";

// The delete dialog. The sentence says the post's comments go with it.
export const POST_DELETE_TITLE = "Delete this post?";
export function postDeleteBody(commentCount: number): string {
  if (commentCount === 0) {
    return "The post and any comments on it will be removed for everyone. This cannot be undone.";
  }
  const comments = countText(commentCount, COMMENT_COUNT_ONE_WORD, COMMENT_COUNT_MANY_WORD);
  return `The post and its ${comments} will be removed for everyone. This cannot be undone.`;
}
export const POST_DELETE_CONFIRM = "Delete post";
export const POST_DELETED_TOAST = "Post deleted";

// 403 on edit or delete; 404 on edit or delete (the post is removed from the list).
export const POST_CHANGE_FORBIDDEN_TEXT = "You can only edit or delete your own posts.";
export const POST_NOT_FOUND_TEXT =
  "This post had already been deleted, so it was removed from the list.";
// The fallback "gone" words, for a 403 or 404 the page does not explain itself.
export const POST_GONE_TEXT =
  "This post can no longer be changed. It may have been deleted, or you may no longer have access.";

export const POST_SAVE_FAILURE_WORDS = {
  noAnswer: WRITE_FAILED_NO_ANSWER,
  server: WRITE_FAILED_SERVER,
  gone: POST_GONE_TEXT,
  general: WRITE_FAILED_GENERAL,
};

// ----- Comments: the open thread under a post ------------------------------

export const COMMENTS_ERROR_HEADING = "The comments could not be loaded";
// No comments yet ("No comments yet" itself is the count, in lib/postDisplay.ts).
export const COMMENTS_EMPTY_HEADING = "Start the conversation";
export const COMMENTS_EMPTY_TEXT = "Be the first to comment on this post.";

export const COMMENT_FIELD_LABEL = "Add a comment";
export const COMMENT_SUBMIT_BUTTON = "Comment";
export const COMMENT_SUBMIT_BUSY = "Posting";
export const COMMENT_POSTED_TOAST = "Comment posted";

export const COMMENT_REPLY_BUTTON = "Reply";
// Above the comment field while replying; its Cancel is CANCEL_LABEL.
export function commentReplyingTo(name: string): string {
  return `Replying to ${name}`;
}

export const COMMENT_EDIT_LABEL = "Edit comment";
export const COMMENT_SAVED_TOAST = "Comment saved";

// The delete dialog. The sentence says the replies go with it.
export const COMMENT_DELETE_TITLE = "Delete this comment?";
export function commentDeleteBody(replyCount: number): string {
  if (replyCount === 0) {
    return "The comment will be removed for everyone. This cannot be undone.";
  }
  const replies = countText(replyCount, "reply", "replies");
  return `The comment and its ${replies} will be removed for everyone. This cannot be undone.`;
}
export const COMMENT_DELETE_CONFIRM = "Delete comment";
export const COMMENT_DELETED_TOAST = "Comment deleted";

// 403 on edit or delete; 404 on edit or delete (removed from the list);
// 404 on adding a comment (the post itself is gone).
export const COMMENT_CHANGE_FORBIDDEN_TEXT = "You can only edit or delete your own comments.";
export const COMMENT_NOT_FOUND_TEXT =
  "This comment had already been deleted, so it was removed from the list.";
export const COMMENT_POST_GONE_TEXT =
  "This post has been deleted, so your comment could not be added.";
export const COMMENT_GONE_TEXT =
  "This comment can no longer be changed. It may have been deleted, or you may no longer have access.";

export const COMMENT_SAVE_FAILURE_WORDS = {
  noAnswer: WRITE_FAILED_NO_ANSWER,
  server: WRITE_FAILED_SERVER,
  gone: COMMENT_GONE_TEXT,
  general: WRITE_FAILED_GENERAL,
};

// ----- Dashboard (/dashboard) ----------------------------------------------

// The band heading: "Welcome back, Tanvir", or "Welcome back" while the name is unknown.
export const DASHBOARD_GREETING = "Welcome back";
export function dashboardGreeting(firstName: string | null): string {
  return firstName ? `${DASHBOARD_GREETING}, ${firstName}` : DASHBOARD_GREETING;
}
export const DASHBOARD_SUB = "Here is what is new in your alumni network.";

// The counts block: three cards, each a label, a number and a link. Its
// heading is visually hidden (the design shows none).
export const DASHBOARD_COUNTS_HEADING = "Counts";
export const DASHBOARD_COUNT_ALUMNI_LABEL = "Alumni in the directory";
export const DASHBOARD_COUNT_ALUMNI_LINK = "Browse the directory";
export const DASHBOARD_COUNT_MENTORING_LABEL = OPEN_TO_MENTORING;
export const DASHBOARD_COUNT_MENTORING_LINK = "See who can help";
export const DASHBOARD_COUNT_POSTS_LABEL = "Posts in the feed";
export const DASHBOARD_COUNT_POSTS_LINK = "Open the feed";
export const DASHBOARD_COUNTS_ERROR_HEADING = "The counts could not be loaded";

// The recent posts block. Its "Write a post" link is for alumni and admin only.
export const DASHBOARD_RECENT_HEADING = "Recent posts";
export const DASHBOARD_WRITE_POST_LINK = POST_FORM_HEADING;
export const DASHBOARD_RECENT_EMPTY_HEADING = FEED_EMPTY_HEADING;
export const DASHBOARD_RECENT_EMPTY_WRITER_TEXT =
  "Nobody has posted yet. Share news, a job opening or an event in the feed.";
export const DASHBOARD_RECENT_EMPTY_READER_TEXT =
  "Nobody has posted yet. New posts from alumni will show here.";
export const DASHBOARD_RECENT_EMPTY_LINK = DASHBOARD_COUNT_POSTS_LINK;
export const DASHBOARD_RECENT_ERROR_HEADING = "Recent posts could not be loaded";

// The "Your profile" block, by role.
export const DASHBOARD_PROFILE_HEADING = "Your profile";
export const DASHBOARD_PROFILE_EDIT_LINK = "Edit my profile";
// Alumni or admin without an alumni profile yet.
export const DASHBOARD_PROFILE_NONE_HEADING = "You have no alumni profile yet";
export const DASHBOARD_PROFILE_NONE_TEXT =
  "Create one so other alumni and students can find you in the directory.";
export const DASHBOARD_PROFILE_NONE_LINK = "Create my profile";
// A student: no alumni profile, only the account.
export const DASHBOARD_PROFILE_STUDENT_HEADING = "Complete your account";
export const DASHBOARD_PROFILE_STUDENT_TEXT =
  "Add a photo and check your name, so other people know who you are.";
export const DASHBOARD_PROFILE_STUDENT_LINK = "Go to My profile";
export const DASHBOARD_PROFILE_ERROR_HEADING = ALUMNI_LOAD_ERROR_HEADING;

// ----- People lists: "New in the directory" and "Open to mentoring" --------

export const PEOPLE_NEW_HEADING = "New in the directory";
export const PEOPLE_MENTORING_HEADING = OPEN_TO_MENTORING;
// The link under either list to the directory (with the mentoring filter on for that list).
export const PEOPLE_DIRECTORY_LINK = "See all in the directory";
export const PEOPLE_NEW_EMPTY_HEADING = "Nobody in the directory yet";
export const PEOPLE_NEW_EMPTY_TEXT = "New alumni profiles will show here. Check back later.";
export const PEOPLE_MENTORING_EMPTY_HEADING = "Nobody is open to mentoring yet";
export const PEOPLE_MENTORING_EMPTY_TEXT =
  "Check back later, or look through the whole directory.";
export const PEOPLE_ERROR_HEADING = "These people could not be loaded";

// ----- Alumni profile (/directory/:id): Recent posts -----------------------

export const PROFILE_POSTS_HEADING = DASHBOARD_RECENT_HEADING;
// Empty: "Nadia has not posted yet", or without a name "No posts yet".
export function profilePostsEmptyHeading(firstName: string | null): string {
  return firstName ? `${firstName} has not posted yet` : FEED_EMPTY_HEADING;
}
export const PROFILE_POSTS_EMPTY_TEXT = "Their posts will show here when they share something.";
export const PROFILE_POSTS_ERROR_HEADING = DASHBOARD_RECENT_ERROR_HEADING;

// ----- Posts and comments: words added by TASK-007 --------------------------

// The image of a post names its author: "Image shared by Nadia Rahman".
export function postImageAlt(authorName: string): string {
  return `Image shared by ${authorName}`;
}
// Visually hidden heading of the open comment thread under a post.
export const COMMENTS_HEADING = "Comments";
// A 400 on a reply: the comment replied to was removed meanwhile (ADV-005).
export const COMMENT_REPLY_TARGET_GONE_TEXT = "That comment is gone. Your reply was not sent.";
// A 403 on a new comment or reply (not the edit wording: nothing existed yet).
export const COMMENT_ADD_FORBIDDEN_TEXT =
  "You cannot comment on this post. Your comment was not sent.";
// The comment-count link of a post summary goes to the feed. Its hidden end
// says which post it belongs to: "No comments yet, on the post by Nadia
// Rahman from 3 October 2026". The date is left out when there is none.
export function postSummaryLinkContext(authorName: string, date: string | null): string {
  return date !== null
    ? `, on the post by ${authorName} from ${date}`
    : `, on the post by ${authorName}`;
}

// ----- Users (/users, admin only) ------------------------------------------

export const USERS_HEADING = "Users";
export const USERS_SUB = "Everyone with an account.";

export const USERS_SEARCH_LABEL = "Search";
export const USERS_SEARCH_PLACEHOLDER = "Name or email";
export const USERS_SEARCH_BUTTON = "Search";
export const USERS_ROLE_LABEL = "Role";
export const USERS_ALL_ROLES = "All roles";
export const USERS_CLEAR_BUTTON = "Clear search and role";

// The table column heads.
export const USERS_COLUMN_NAME = "Name";
export const USERS_COLUMN_EMAIL = "Email";
export const USERS_COLUMN_ROLE = "Role";
export const USERS_COLUMN_JOINED = "Joined";
export const USERS_COLUMN_ACTIONS = "Actions";

// The tag beside the logged-in admin's own name (that row has no Delete).
export const USERS_YOU_TAG = "You";

// The row's Delete button. Seen as "Delete"; read out with the person's name.
export const USERS_DELETE_BUTTON = DELETE_LABEL;
export function usersDeleteButtonName(name: string): string {
  return `${USERS_DELETE_BUTTON} ${name}`;
}

// The count line (a polite live region): "124 users", "1 user".
export function usersCount(total: number): string {
  return countText(total, "user", "users");
}
export const USERS_COUNT_LOADING = "Loading users";
export const USERS_COUNT_NONE = "No users found";
export const USERS_COUNT_FAILED = "Could not load users";

// Empty result, with search or role set.
export const USERS_EMPTY_MATCH_HEADING = "No users match your search";
export const USERS_EMPTY_MATCH_TEXT =
  "Try a different name or email, or clear the search and role.";
// Empty result, with nothing set.
export const USERS_EMPTY_NONE_HEADING = "No users yet";
export const USERS_EMPTY_NONE_TEXT = "Nobody has an account yet. Check back later.";

// The list failed. The text is FAILURE_NO_ANSWER_TEXT or FAILURE_SERVER_TEXT.
export const USERS_ERROR_HEADING = "The users could not be loaded";

// The delete dialog. The body names the person and says what goes.
export const USER_DELETE_TITLE = "Delete this user?";
export function userDeleteBody(name: string): string {
  return `The account of ${name} will be removed for everyone. This cannot be undone.`;
}
export const USER_DELETE_CONFIRM = "Delete user";
export function userDeletedToast(name: string): string {
  return `${name} was deleted`;
}
// 404 on delete: the person was already gone, so the row is removed.
export const USER_ALREADY_GONE_TOAST =
  "This user had already been deleted, so they were removed from the list.";

// 409 on delete: the server refuses while the person still owns content
// (ADR-06; spec A3 names all three). Nothing was removed and the row stays.
export function userDeleteBlockedText(name: string): string {
  return `${name} cannot be deleted because they still have posts, comments or an alumni profile. Nothing was changed.`;
}
const USER_DELETE_FORBIDDEN_TEXT = "Only admins can delete users. Nothing was changed.";
const USER_GONE_TEXT =
  "This user can no longer be deleted. They may have been deleted already, or you may no longer have access.";

// The words of a failed user delete, shaped as lib/writeFailure's
// UserDeleteFailureWords (WriteFailureWords plus `blocked` for the 409).
export function userDeleteFailureWords(name: string) {
  return {
    blocked: userDeleteBlockedText(name),
    forbidden: USER_DELETE_FORBIDDEN_TEXT,
    notFound: USER_ALREADY_GONE_TOAST,
    save: {
      noAnswer: WRITE_FAILED_NO_ANSWER,
      server: WRITE_FAILED_SERVER,
      gone: USER_GONE_TEXT,
      general: WRITE_FAILED_GENERAL,
    },
  };
}

// ----- About (/about) and its footer link ----------------------------------

// The app name is not typed here: the page passes APP_NAME from config/app.ts
// into the functions below, and the contact email is CONTACT_EMAIL from there.
// No fact about any school: no year, no number, no name, no address.
export const FOOTER_ABOUT_LINK = "About";
export const ABOUT_HEADING = "About";
export function aboutSub(appName: string): string {
  return `What ${appName} is for, and who to ask.`;
}

export const ABOUT_PURPOSE_HEADING = "What it is for";
export function aboutPurposeText(appName: string): string {
  return `${appName} helps graduates and students stay in touch with each other.`;
}

export const ABOUT_USE_HEADING = "What you can do here";
export const ABOUT_USE_TEXT =
  "Find alumni in the directory and see who is open to mentoring. Read news, job openings and events in the feed, and comment on them. Keep your own profile up to date, so other people can find you.";

export const ABOUT_CONTACT_HEADING = "Who to ask";
// Followed by the contact email as a link.
export const ABOUT_CONTACT_TEXT =
  "For a question about your account or this site, write to";
