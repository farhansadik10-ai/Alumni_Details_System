import { useSetAtom } from "jotai";
import { useState } from "react";
import type { ComponentType, ReactNode, SyntheticEvent } from "react";
import type { Alumni, AlumniFilters, Comment, Post, Stats } from "@alumni/shared";
import { AlumniCard } from "../../../components/alumni/AlumniCard/AlumniCard";
import { AlumniCardSkeleton } from "../../../components/alumni/AlumniCard/AlumniCardSkeleton";
import { DirectoryFilters } from "../../../components/alumni/DirectoryFilters/DirectoryFilters";
import type { DirectoryFilterPatch } from "../../../components/alumni/DirectoryFilters/DirectoryFilters";
import { PeopleBlock } from "../../../components/alumni/PeopleBlock/PeopleBlock";
import type { PeopleBlockState } from "../../../components/alumni/PeopleBlock/PeopleBlock";
import { CountsBlock } from "../../../components/dashboard/CountsBlock/CountsBlock";
import type { CountsBlockState } from "../../../components/dashboard/CountsBlock/CountsBlock";
import { RecentPostsBlock } from "../../../components/dashboard/RecentPostsBlock/RecentPostsBlock";
import type { RecentPostsBlockState } from "../../../components/dashboard/RecentPostsBlock/RecentPostsBlock";
import { YourProfileBlock } from "../../../components/dashboard/YourProfileBlock/YourProfileBlock";
import { CommentForm } from "../../../components/posts/CommentForm/CommentForm";
import { CommentItem } from "../../../components/posts/CommentItem/CommentItem";
import { FeedPost } from "../../../components/posts/FeedPost/FeedPost";
import { PostByline } from "../../../components/posts/PostByline/PostByline";
import { PostForm } from "../../../components/posts/PostForm/PostForm";
import type { FormResult } from "../../../components/posts/PostForm/PostForm";
import { PostText } from "../../../components/posts/PostText/PostText";
import { ProfileBand, ProfileBandAction } from "../../../components/shell/ProfileBand/ProfileBand";
import { ThemeSwitch } from "../../../components/shell/ThemeSwitch/ThemeSwitch";
import { Avatar } from "../../../components/ui/Avatar/Avatar";
import { Button } from "../../../components/ui/Button/Button";
import type { ButtonProps } from "../../../components/ui/Button/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink/ButtonLink";
import { Card } from "../../../components/ui/Card/Card";
import { Checkbox } from "../../../components/ui/Checkbox/Checkbox";
import { ConfirmDialog } from "../../../components/ui/Dialog/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState/ErrorState";
import { Link } from "../../../components/ui/Link/Link";
import { Message } from "../../../components/ui/Message/Message";
import { Pagination } from "../../../components/ui/Pagination/Pagination";
import { PasswordInput } from "../../../components/ui/PasswordInput/PasswordInput";
import { RadioCards } from "../../../components/ui/RadioCards/RadioCards";
import { Select } from "../../../components/ui/Select/Select";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../../components/ui/Skeleton/Skeleton";
import { Table } from "../../../components/ui/Table/Table";
import type { TableColumn } from "../../../components/ui/Table/Table";
import { RoleTag } from "../../../components/ui/Tag/RoleTag";
import { Tag } from "../../../components/ui/Tag/Tag";
import { Textarea } from "../../../components/ui/Textarea/Textarea";
import { TextInput } from "../../../components/ui/TextInput/TextInput";
import { APP_NAME } from "../../../config/app";
import {
  CANCEL_LABEL,
  COMMENTS_EMPTY_HEADING,
  COMMENTS_EMPTY_TEXT,
  COMMENTS_ERROR_HEADING,
  COMMENT_EDIT_LABEL,
  COMMENT_FIELD_LABEL,
  COMMENT_SAVE_FAILURE_WORDS,
  COMMENT_SUBMIT_BUSY,
  COMMENT_SUBMIT_BUTTON,
  DASHBOARD_PROFILE_EDIT_LINK,
  DASHBOARD_RECENT_EMPTY_HEADING,
  DASHBOARD_RECENT_EMPTY_LINK,
  DASHBOARD_RECENT_EMPTY_WRITER_TEXT,
  DASHBOARD_RECENT_ERROR_HEADING,
  DASHBOARD_RECENT_HEADING,
  DASHBOARD_WRITE_POST_LINK,
  MY_PROFILE_HEADING,
  MY_PROFILE_PUBLIC_LINK,
  OPEN_TO_MENTORING,
  OPENS_IN_NEW_TAB,
  PEOPLE_DIRECTORY_LINK,
  PEOPLE_ERROR_HEADING,
  PEOPLE_MENTORING_EMPTY_HEADING,
  PEOPLE_MENTORING_EMPTY_TEXT,
  PEOPLE_MENTORING_HEADING,
  PEOPLE_NEW_EMPTY_HEADING,
  PEOPLE_NEW_EMPTY_TEXT,
  PEOPLE_NEW_HEADING,
  POST_CHANGE_FORBIDDEN_TEXT,
  POST_DELETE_CONFIRM,
  POST_DELETE_TITLE,
  POST_EDIT_LABEL,
  POST_FORM_HEADING,
  POST_PUBLISH_BUSY,
  POST_PUBLISH_BUTTON,
  POST_SAVE_FAILURE_WORDS,
  PROFILE_BACK_LINK,
  PROFILE_HEADING,
  PROFILE_LINKEDIN_LINK,
  PROFILE_POSTS_EMPTY_TEXT,
  PROFILE_POSTS_ERROR_HEADING,
  PROFILE_POSTS_HEADING,
  SAVE_LABEL,
  SAVING_LABEL,
  myProfileSub,
  postDeleteBody,
  profileEmailLink,
  profilePostsEmptyHeading,
} from "../../../config/text";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { buildThreads, countReplies } from "../../../lib/commentThread";
import { DEFAULT_DIRECTORY_QUERY } from "../../../lib/directoryQuery";
import type { DirectoryQuery } from "../../../lib/directoryQuery";
import { loadFailureText } from "../../../lib/loadFailure";
import { commentCountText } from "../../../lib/postDisplay";
import { saveFailureText } from "../../../lib/saveFailure";
import type { Session } from "../../../lib/token";
import { AlertIcon } from "../../../icons/AlertIcon";
import { CheckIcon } from "../../../icons/CheckIcon";
import { ChevronDownIcon } from "../../../icons/ChevronDownIcon";
import { CloseIcon } from "../../../icons/CloseIcon";
import type { IconProps } from "../../../icons/IconBase";
import { MenuIcon } from "../../../icons/MenuIcon";
import { MonitorIcon } from "../../../icons/MonitorIcon";
import { MoonIcon } from "../../../icons/MoonIcon";
import { SunIcon } from "../../../icons/SunIcon";
import { PATHS, alumniProfilePath } from "../../../routes/paths";
import type { MyAlumniState } from "../../../store/alumniAtoms";
import type { ApiFailure } from "../../../store/postAtoms";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./ComponentsPage.module.css";

// Development only: App.tsx registers this page when import.meta.env.DEV is
// true, so the production build does not contain it. It calls no API.
// Sections follow docs/design/screens/system.html, top to bottom.

const PAGE_TITLE = "Components";

type Swatch = { name: string; token: string; chip: string };

// Every color token of styles/tokens.css, in the order of that file.
const SWATCHES: readonly Swatch[] = [
  { name: "Ground", token: "--ground", chip: styles.ground },
  { name: "Surface", token: "--surface", chip: styles.surface },
  { name: "Sunken", token: "--sunken", chip: styles.sunken },
  { name: "Text", token: "--text", chip: styles.text },
  { name: "Muted", token: "--muted", chip: styles.muted },
  { name: "Line", token: "--line", chip: styles.line },
  { name: "Edge", token: "--edge", chip: styles.edge },
  { name: "Focus", token: "--focus", chip: styles.focus },
  { name: "Selected", token: "--action", chip: styles.action },
  { name: "On selected", token: "--on-action", chip: styles.onAction },
  { name: "Accent", token: "--accent", chip: styles.accent },
  { name: "On accent", token: "--on-accent", chip: styles.onAccent },
  { name: "Accent hover", token: "--accent-hover", chip: styles.accentHover },
  { name: "Accent edge", token: "--accent-edge", chip: styles.accentEdge },
  { name: "Accent soft", token: "--accent-soft", chip: styles.accentSoft },
  { name: "Accent soft text", token: "--accent-soft-text", chip: styles.accentSoftText },
  { name: "Danger", token: "--danger", chip: styles.danger },
  { name: "On danger", token: "--on-danger", chip: styles.onDanger },
  { name: "Danger hover", token: "--danger-hover", chip: styles.dangerHover },
  { name: "Danger soft", token: "--danger-soft", chip: styles.dangerSoft },
  { name: "Danger soft text", token: "--danger-soft-text", chip: styles.dangerSoftText },
  { name: "Success", token: "--success", chip: styles.success },
  { name: "Success soft", token: "--success-soft", chip: styles.successSoft },
  { name: "Success soft text", token: "--success-soft-text", chip: styles.successSoftText },
  { name: "Band", token: "--band", chip: styles.band },
  { name: "Band text", token: "--band-text", chip: styles.bandText },
  { name: "Band muted", token: "--band-muted", chip: styles.bandMuted },
];

const TYPE_SAMPLES: readonly { caption: string; sample: string; look: string }[] = [
  { caption: "Display, 44 / 1.05, bold", sample: "Alumni directory", look: styles.typeDisplay },
  { caption: "Heading 1, 32 / 1.15, bold", sample: "Alumni directory", look: styles.typeH1 },
  { caption: "Heading 2, 24 / 1.2, bold", sample: "Recent posts", look: styles.typeH2 },
  { caption: "Heading 3, 18 / 1.3, semibold", sample: "Work and education", look: styles.typeH3 },
  {
    caption: "Body, 16 / 1.5, regular",
    sample: "Backend developer with three years of experience in payment systems.",
    look: styles.typeBody,
  },
  { caption: "Small, 14 / 1.45, regular", sample: "Software Engineer, Nordlys Systems", look: styles.typeSmall },
  { caption: "Caption, 13 / 1.4, regular, muted", sample: "Posted 3 October 2026", look: styles.typeCaption },
];

const SPACE_STEPS: readonly { size: string; box: string }[] = [
  { size: "4", box: styles.space1 },
  { size: "8", box: styles.space2 },
  { size: "12", box: styles.space3 },
  { size: "16", box: styles.space4 },
  { size: "24", box: styles.space5 },
  { size: "32", box: styles.space6 },
  { size: "48", box: styles.space7 },
  { size: "64", box: styles.space8 },
];

type ButtonRow = {
  name: string;
  word: string;
  busyWord: string;
  look: Pick<ButtonProps, "variant" | "tone">;
};

const BUTTON_ROWS: readonly ButtonRow[] = [
  { name: "Primary", word: "Save", busyWord: "Saving", look: { variant: "primary" } },
  { name: "Secondary", word: "Cancel", busyWord: "Closing", look: { variant: "secondary" } },
  { name: "Quiet", word: "Edit", busyWord: "Opening", look: { variant: "quiet" } },
  { name: "Danger", word: "Delete", busyWord: "Deleting", look: { variant: "danger" } },
  { name: "Danger text", word: "Delete", busyWord: "Deleting", look: { variant: "quiet", tone: "danger" } },
];

const ICONS: readonly { name: string; Icon: ComponentType<IconProps> }[] = [
  { name: "Sun", Icon: SunIcon },
  { name: "Moon", Icon: MoonIcon },
  { name: "Monitor", Icon: MonitorIcon },
  { name: "Menu", Icon: MenuIcon },
  { name: "Close", Icon: CloseIcon },
  { name: "Chevron down", Icon: ChevronDownIcon },
  { name: "Check", Icon: CheckIcon },
  { name: "Alert", Icon: AlertIcon },
];

const DEPARTMENTS = [
  { value: "cs", label: "Computer Science" },
  { value: "ee", label: "Electrical Engineering" },
  { value: "ba", label: "Business Administration" },
];

type SampleRole = "student" | "alumni";

const ROLE_OPTIONS: { value: SampleRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "alumni", label: "Alumni" },
];

type SampleUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  joined: string;
};

const SAMPLE_USERS: SampleUser[] = [
  { id: 1, name: "Nadia Rahman", email: "nadia.rahman@example.com", role: "alumni", joined: "12 March 2026" },
  { id: 2, name: "Erik Lindqvist", email: "erik.lindqvist@example.com", role: "student", joined: "2 February 2026" },
  { id: 3, name: "Amira Haddad", email: "amira.haddad@example.com", role: "admin", joined: "20 January 2026" },
];

const SAMPLE_NAME = SAMPLE_USERS[0].name;

// Both photo links point at this dev server, so the page asks no other host
// for anything. The first is a real file in frontend/public; the second is not
// a picture, so the avatar falls back to initials.
const WORKING_PHOTO_PATH = "/favicon.svg";
const BROKEN_PHOTO_PATH = "/dev/no-such-photo.png";

// Sample alumni profiles for the directory and profile sections. Every
// optional column is null unless a sample sets it.
const EMPTY_ALUMNI: Alumni = {
  id: 0,
  user_id: null,
  graduation_year: null,
  department: null,
  current_company: null,
  job_title: null,
  experience: null,
  bio: null,
  linkedin_url: null,
  mentorship_available: false,
  field: null,
  updated_at: null,
  name: null,
  email: null,
  photo_url: null,
};

const FULL_ALUMNI: Alumni = {
  ...EMPTY_ALUMNI,
  id: 1,
  user_id: 1,
  graduation_year: 2019,
  department: "Computer Science",
  current_company: "Nordlys Systems",
  job_title: "Software Engineer",
  field: "Software",
  mentorship_available: true,
  name: SAMPLE_NAME,
  email: SAMPLE_USERS[0].email,
  linkedin_url: "https://www.linkedin.com/in/example",
};

const SOME_ALUMNI: Alumni = {
  ...EMPTY_ALUMNI,
  id: 2,
  user_id: 2,
  job_title: "Data Analyst",
  graduation_year: 2021,
  name: "Erik Lindqvist",
};

const LONG_ALUMNI: Alumni = {
  ...EMPTY_ALUMNI,
  id: 3,
  user_id: 3,
  name: "Amira Haddad-Karlsson Abdel-Rahman Lindqvist-Oyelaran",
  current_company: "Very Long Company Name International Holdings Group",
  department: "Electrical and Electronic Engineering",
  field: "Telecommunications and signal processing",
};

const NO_NAME_ALUMNI: Alumni = { ...EMPTY_ALUMNI, id: 4 };

// Old links can carry a value that is not among the options (ADV-005).
const SAMPLE_FILTERS: AlumniFilters = {
  departments: ["Business Administration", "Computer Science", "Electrical Engineering"],
  graduation_years: [2017, 2018, 2019, 2020, 2021],
  fields: ["Finance", "Software", "Telecommunications"],
};

const QUERY_WITH_OLD_VALUE: DirectoryQuery = {
  ...DEFAULT_DIRECTORY_QUERY,
  q: "nadia",
  department: "Physics",
  mentoring: true,
};

const SAMPLE_DIRECTORY_SEARCH = "?q=nadia";

// ----- Posts, comments and the dashboard blocks (REQ-fs-006) -----

// Shown when a sample form "sends": its onSubmit is a function on this page.
const NOTHING_SENT = "Nothing was sent: this page calls no API";

// How long the "busy" sample forms wait before they answer.
const SLOW_ANSWER_MS = 4000;

const SAMPLE_DATE = "2026-10-03T09:30:00.000Z";
const LATER_DATE = "2026-10-05T14:10:00.000Z";

// Nadia (user 1, alumni) wrote the sample post. Each viewer sees other buttons.
const AUTHOR_SESSION: Session = { userId: 1, role: "alumni", expiresAt: null };
const OTHER_ALUMNI_SESSION: Session = { userId: 7, role: "alumni", expiresAt: null };
const ADMIN_SESSION: Session = { userId: 3, role: "admin", expiresAt: null };
const STUDENT_SESSION: Session = { userId: 2, role: "student", expiresAt: null };

const LONG_TEXT =
  "We are hiring two junior backend engineers in Dhaka. The team builds payment systems for " +
  "small shops across the country, and we mentor every new engineer for their first six " +
  "months. Message me if you graduated in the last two years; I will gladly look at your " +
  "projects and tell you more about the work, the team and the interview.";
const LINE_BREAK_TEXT =
  "Alumni meetup on Friday 17 October.\nCampus library, room 204, at six.\n\nBring a friend.";
const UNBROKEN_TEXT = `https://example.com/careers/${"backend-engineer-dhaka-".repeat(6)}apply`;

const BASE_POST: Post = {
  id: 101,
  user_id: 1,
  caption: "We are hiring two junior backend engineers in Dhaka.\nMessage me if you graduated in the last two years.",
  media_url: null,
  comment_count: 4,
  created_at: SAMPLE_DATE,
  updated_at: null,
  name: SAMPLE_NAME,
  photo_url: null,
};

// A post with no author name, no date and an image link that fails.
const BARE_POST: Post = {
  ...BASE_POST,
  id: 102,
  user_id: null,
  caption: UNBROKEN_TEXT,
  comment_count: 1,
  created_at: null,
  name: null,
};

const SUMMARY_POSTS: Post[] = [
  BASE_POST,
  {
    ...BASE_POST,
    id: 103,
    user_id: 2,
    name: "Erik Lindqvist",
    caption: LONG_TEXT,
    comment_count: 0,
    created_at: LATER_DATE,
  },
  { ...BASE_POST, id: 104, caption: LINE_BREAK_TEXT, comment_count: 1 },
];

function sampleComment(fields: Partial<Comment> & Pick<Comment, "id">): Comment {
  return {
    user_id: null,
    posts_id: BASE_POST.id,
    parent_id: null,
    content: null,
    created_at: SAMPLE_DATE,
    updated_at: null,
    name: null,
    photo_url: null,
    ...fields,
  };
}

// Two threads: the first has a reply and a reply to that reply (drawn at the
// same level, C3); the second comment has no author name.
const SAMPLE_COMMENTS: Comment[] = [
  sampleComment({
    id: 201,
    user_id: 2,
    name: "Erik Lindqvist",
    content: "Is this open to graduates from Electrical Engineering too?",
  }),
  sampleComment({
    id: 202,
    user_id: 1,
    parent_id: 201,
    name: SAMPLE_NAME,
    content: "Yes. Send me your projects and I will pass them on.",
    created_at: LATER_DATE,
  }),
  sampleComment({
    id: 203,
    user_id: 3,
    parent_id: 202,
    name: "Amira Haddad",
    content: UNBROKEN_TEXT,
    created_at: LATER_DATE,
  }),
  sampleComment({ id: 204, content: LINE_BREAK_TEXT }),
];

const NETWORK_FAILURE: ApiFailure = { kind: "network" };
const SERVER_FAILURE: ApiFailure = { kind: "http", status: 500 };

const PEOPLE_LOADING: PeopleBlockState = { status: "loading", items: [], failure: null };
const PEOPLE_EMPTY: PeopleBlockState = { status: "ready", items: [], failure: null };
const PEOPLE_ERROR: PeopleBlockState = { status: "error", items: [], failure: NETWORK_FAILURE };
const PEOPLE_READY: PeopleBlockState = {
  status: "ready",
  items: [FULL_ALUMNI, SOME_ALUMNI, NO_NAME_ALUMNI],
  failure: null,
};

const RECENT_LOADING: RecentPostsBlockState = { status: "loading", items: [], failure: null };
const RECENT_EMPTY: RecentPostsBlockState = { status: "ready", items: [], failure: null };
const RECENT_ERROR: RecentPostsBlockState = { status: "error", items: [], failure: SERVER_FAILURE };
const RECENT_READY: RecentPostsBlockState = { status: "ready", items: SUMMARY_POSTS, failure: null };

const SAMPLE_STATS: Stats = { alumni: 128, students: 40, posts: 56, mentoring: 23 };
const ZERO_STATS: Stats = { alumni: 0, students: 0, posts: 0, mentoring: 0 };

const COUNTS_LOADING: CountsBlockState = { status: "loading", stats: null, failure: null };
const COUNTS_ERROR: CountsBlockState = { status: "error", stats: null, failure: NETWORK_FAILURE };
const COUNTS_READY: CountsBlockState = { status: "ready", stats: SAMPLE_STATS, failure: null };
const COUNTS_ZERO: CountsBlockState = { status: "ready", stats: ZERO_STATS, failure: null };

const MY_ALUMNI_IDLE: MyAlumniState = { status: "idle", alumni: null, failure: null };
const MY_ALUMNI_LOADING: MyAlumniState = { status: "loading", alumni: null, failure: null };
const MY_ALUMNI_READY: MyAlumniState = { status: "ready", alumni: FULL_ALUMNI, failure: null };
const MY_ALUMNI_NONE: MyAlumniState = { status: "none", alumni: null, failure: null };
const MY_ALUMNI_ERROR: MyAlumniState = { status: "error", alumni: null, failure: SERVER_FAILURE };

export default function ComponentsPage() {
  useDocumentTitle(PAGE_TITLE);

  const showToast = useSetAtom(showToastAtom);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shortPage, setShortPage] = useState(2);
  const [longPage, setLongPage] = useState(6);
  const [role, setRole] = useState<SampleRole>("student");

  const origin = window.location.origin;

  const userColumns: TableColumn<SampleUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <span className={styles.nameCell}>
          <Avatar name={user.name} size="sm" />
          {user.name}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <span className={styles.quietText}>{user.email}</span>,
    },
    { key: "role", header: "Role", render: (user) => <RoleTag role={user.role} /> },
    {
      key: "joined",
      header: "Joined",
      render: (user) => <span className={styles.quietText}>{user.joined}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (user) => (
        <Button
          variant="quiet"
          tone="danger"
          size="sm"
          aria-label={`Delete ${user.name}`}
          onClick={() => setDialogOpen(true)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titles}>
          <h1 className={styles.title}>{APP_NAME} components</h1>
          <p className={styles.sub}>
            Development only. Compare each section with system.html and system-dark.html; the
            post, comment and dashboard sections with feed.html, dashboard.html and profile.html.
          </p>
        </div>
        <ThemeSwitch variant="icons" />
      </div>

      <section className={styles.section} aria-labelledby="dev-color">
        <h2 id="dev-color" className={styles.sectionTitle}>
          Color
        </h2>
        <ul className={styles.swatches}>
          {SWATCHES.map((swatch) => (
            <li key={swatch.token} className={styles.swatch}>
              <div className={`${styles.chip} ${swatch.chip}`} />
              <div className={styles.swatchText}>
                <span className={styles.swatchName}>{swatch.name}</span>
                <span className={styles.swatchToken}>{swatch.token}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          The values are in styles/tokens.css and change with the theme. Selected states (a pressed
          toggle, the current page number) use the Selected color, not Accent.
        </p>
      </section>

      <div className={styles.pair}>
        <section className={styles.section} aria-labelledby="dev-type">
          <h2 id="dev-type" className={styles.sectionTitle}>
            Type
          </h2>
          {TYPE_SAMPLES.map((type) => (
            <div key={type.caption} className={styles.block}>
              <p className={styles.caption}>{type.caption}</p>
              <p className={`${styles.typeSample} ${type.look}`}>{type.sample}</p>
            </div>
          ))}
        </section>

        <section className={styles.section} aria-labelledby="dev-space">
          <h2 id="dev-space" className={styles.sectionTitle}>
            Space and shape
          </h2>
          <div className={styles.endRow}>
            {SPACE_STEPS.map((step) => (
              <div key={step.size} className={styles.spaceItem}>
                <div className={`${styles.spaceBox} ${step.box}`} />
                <span className={styles.caption}>{step.size}</span>
              </div>
            ))}
          </div>
          <div className={styles.shapes}>
            <div className={styles.block}>
              <div className={`${styles.shapeBox} ${styles.shapeEdge}`} />
              <p className={styles.caption}>Edge: cards, inputs, buttons, dialogs</p>
            </div>
            <div className={styles.block}>
              <div className={`${styles.shapeBox} ${styles.shapeLine}`} />
              <p className={styles.caption}>Line: dividers, table rows, plain tags</p>
            </div>
            <div className={styles.block}>
              <div className={`${styles.shapeBox} ${styles.shapeFocus}`} />
              <p className={styles.caption}>Focus ring: every control</p>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.pair}>
        <section className={styles.section} aria-labelledby="dev-buttons">
          <h2 id="dev-buttons" className={styles.sectionTitle}>
            Buttons
          </h2>
          <div className={styles.buttonGrid}>
            <span className={styles.gridCorner} />
            <span className={styles.caption}>Default</span>
            <span className={styles.caption}>Disabled</span>
            <span className={styles.caption}>Busy</span>
            {BUTTON_ROWS.map((row) => (
              <ButtonStates key={row.name} row={row} />
            ))}
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Small, 36</p>
            <div className={styles.wrapRow}>
              <Button variant="primary" size="sm">
                Reply
              </Button>
              <Button size="sm">Cancel</Button>
              <Button variant="quiet" size="sm">
                Edit
              </Button>
              <Button variant="danger" size="sm">
                Delete
              </Button>
              <Button variant="quiet" tone="danger" size="sm">
                Delete
              </Button>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Medium, 44</p>
            <div className={styles.wrapRow}>
              <Button variant="primary">Save profile</Button>
              <Button>Cancel</Button>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Large, 48</p>
            <div className={styles.wrapRow}>
              <Button variant="primary" size="lg">
                Log in
              </Button>
              <Button size="lg">Cancel</Button>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Full width</p>
            <Button variant="primary" size="lg" fullWidth>
              Create account
            </Button>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Links</p>
            <div className={styles.wrapRow}>
              <Link to={PATHS.devComponents}>A link inside the app</Link>
              <Link to={PATHS.devComponents} strong>
                Create an account
              </Link>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Icons, in the three sizes</p>
            <ul className={styles.icons}>
              {ICONS.map(({ name, Icon }) => (
                <li key={name} className={styles.iconItem}>
                  <Icon size="sm" />
                  <Icon size="md" />
                  <Icon size="lg" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="dev-forms">
          <h2 id="dev-forms" className={styles.sectionTitle}>
            Form controls
          </h2>
          <form className={styles.formGrid} noValidate onSubmit={(event) => event.preventDefault()}>
            <TextInput label="Full name" defaultValue={SAMPLE_NAME} maxLength={100} />
            <TextInput
              label="Current company"
              optionalNote="(optional)"
              defaultValue="Nordlys Systems"
              help="Where you work now."
            />
            <TextInput
              label="Graduation year"
              inputMode="numeric"
              defaultValue="1900"
              error="Enter a year from 1950 to 2031."
            />
            <TextInput label="Email" type="email" defaultValue={SAMPLE_USERS[0].email} disabled />
            <TextInput label="Email, large" type="email" size="lg" placeholder="you@example.com" />
            <PasswordInput label="Password" defaultValue="oak-and-ink" help="At least 8 characters." />
            <PasswordInput label="Password, with an error" defaultValue="short" error="Use at least 8 characters." />
            <PasswordInput label="Password, disabled" defaultValue="oak-and-ink" disabled />
            <Select label="Department" options={DEPARTMENTS} defaultValue="cs" />
            <Select
              label="Department, nothing chosen"
              options={DEPARTMENTS}
              placeholder="All departments"
              defaultValue=""
              help="A filter: the first option can be chosen again."
            />
            <Select
              label="Department, with an error"
              options={DEPARTMENTS}
              placeholder="Choose a department"
              defaultValue=""
              error="Choose a department."
            />
            <Select label="Department, disabled" options={DEPARTMENTS} defaultValue="cs" disabled />
            <div className={styles.wide}>
              <Textarea
                label="Bio"
                defaultValue="Backend developer with three years of experience in payment systems."
              />
            </div>
            <Textarea label="Bio, with an error" defaultValue="" error="Write a few words about yourself." />
            <Textarea label="Bio, disabled" defaultValue="Not yet written." disabled />
            <div className={styles.block}>
              <p className={styles.caption}>Checkbox</p>
              <Checkbox label="Remember my email" defaultChecked />
              <Checkbox label="Not checked" />
              <Checkbox label="Disabled" disabled />
            </div>
            <div className={styles.block}>
              <p className={styles.caption}>Checkbox, boxed</p>
              <Checkbox label="Open to mentoring students" boxed defaultChecked />
              <Checkbox label="Open to mentoring students" boxed disabled />
            </div>
            <div className={styles.wide}>
              <RadioCards legend="I am a" name="dev-role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
            </div>
            <div className={`${styles.block} ${styles.wide}`}>
              <p className={styles.caption}>Theme, as words (the phone menu)</p>
              <ThemeSwitch variant="text" />
            </div>
          </form>
        </section>
      </div>

      <div className={styles.pair}>
        <section className={styles.section} aria-labelledby="dev-tags">
          <h2 id="dev-tags" className={styles.sectionTitle}>
            Tags and avatars
          </h2>
          <div className={styles.block}>
            <p className={styles.caption}>Plain facts: department, year, field</p>
            <div className={styles.wrapRow}>
              <Tag>Computer Science</Tag>
              <Tag>2019</Tag>
              <Tag>Software</Tag>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Mentoring</p>
            <div className={styles.wrapRow}>
              <Tag variant="mentoring">Open to mentoring</Tag>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Roles, told apart by lightness as well as color</p>
            <div className={styles.wrapRow}>
              <RoleTag role="student" />
              <RoleTag role="alumni" />
              <RoleTag role="admin" />
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Avatars: 32, 44 and 72. Initials when there is no photo.</p>
            <div className={styles.endRow}>
              <Avatar name={SAMPLE_NAME} size="sm" />
              <Avatar name={SAMPLE_NAME} size="md" />
              <Avatar name={SAMPLE_NAME} size="lg" />
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>With a photo link that loads</p>
            <div className={styles.endRow}>
              <Avatar name={SAMPLE_NAME} size="sm" photoUrl={`${origin}${WORKING_PHOTO_PATH}`} />
              <Avatar name={SAMPLE_NAME} size="md" photoUrl={`${origin}${WORKING_PHOTO_PATH}`} />
              <Avatar name={SAMPLE_NAME} size="lg" photoUrl={`${origin}${WORKING_PHOTO_PATH}`} />
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>With a photo link that fails: back to initials</p>
            <div className={styles.endRow}>
              <Avatar name={SAMPLE_NAME} size="sm" photoUrl={`${origin}${BROKEN_PHOTO_PATH}`} />
              <Avatar name={SAMPLE_NAME} size="md" photoUrl={`${origin}${BROKEN_PHOTO_PATH}`} />
              <Avatar name={SAMPLE_NAME} size="lg" photoUrl={`${origin}${BROKEN_PHOTO_PATH}`} />
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="dev-dialog">
          <h2 id="dev-dialog" className={styles.sectionTitle}>
            Dialog and pagination
          </h2>
          <div className={styles.block}>
            <p className={styles.caption}>Opens a confirm dialog. Escape or Cancel closes it.</p>
            <div className={styles.wrapRow}>
              <Button variant="danger" onClick={() => setDialogOpen(true)}>
                Delete post
              </Button>
            </div>
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Page 2 of 3 at the start</p>
            <Pagination page={shortPage} pageCount={3} onChange={setShortPage} />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Page 6 of 25 at the start</p>
            <Pagination page={longPage} pageCount={25} onChange={setLongPage} />
          </div>
        </section>
      </div>

      <section className={styles.section} aria-labelledby="dev-cards">
        <h2 id="dev-cards" className={styles.sectionTitle}>
          Cards
        </h2>
        <div className={styles.cards}>
          <Card as="article" aria-labelledby="dev-card-person">
            <div className={styles.cardBody}>
              <div className={styles.person}>
                <Avatar name={SAMPLE_NAME} />
                <div className={styles.personText}>
                  <h3 id="dev-card-person" className={styles.cardTitle}>
                    {SAMPLE_NAME}
                  </h3>
                  <span className={styles.personSub}>Software Engineer, Nordlys Systems</span>
                </div>
              </div>
              <div className={styles.wrapRow}>
                <Tag>Computer Science</Tag>
                <Tag>2019</Tag>
                <Tag>Software</Tag>
                <Tag variant="mentoring">Open to mentoring</Tag>
              </div>
              <div>
                <Link to={PATHS.devComponents} strong>
                  View profile
                </Link>
              </div>
            </div>
          </Card>
          <div className={styles.cardWide}>
            <Card as="article" aria-labelledby="dev-card-post">
              <div className={styles.cardBody}>
                <div className={styles.person}>
                  <Avatar name={SAMPLE_NAME} />
                  <div className={styles.personText}>
                    <div className={styles.wrapRow}>
                      <h3 id="dev-card-post" className={styles.cardTitle}>
                        {SAMPLE_NAME}
                      </h3>
                      <RoleTag role="alumni" />
                    </div>
                    <span className={styles.caption}>3 October 2026</span>
                  </div>
                </div>
                <p className={styles.cardText}>
                  We are hiring two junior backend engineers in Dhaka. Message me if you graduated in
                  the last two years.
                </p>
                <div className={styles.postImage}>Post image</div>
                <div className={styles.cardFoot}>
                  <Button variant="quiet">4 comments</Button>
                  <div className={styles.wrapRow}>
                    <Button variant="quiet">Edit</Button>
                    <Button variant="quiet" tone="danger" onClick={() => setDialogOpen(true)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <Card padding="lg">
            <div className={styles.cardBody}>
              <span className={styles.personName}>Large padding, 32</span>
              <span className={styles.personSub}>The two cards above use 24.</span>
            </div>
          </Card>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="dev-alumni-cards">
        <h2 id="dev-alumni-cards" className={styles.sectionTitle}>
          Alumni cards
        </h2>
        <div className={styles.cards}>
          <div className={styles.block}>
            <p className={styles.caption}>Every part, open to mentoring</p>
            <AlumniCard alumni={FULL_ALUMNI} directorySearch={SAMPLE_DIRECTORY_SEARCH} />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Some parts: job title only, one tag, no mentoring</p>
            <AlumniCard alumni={SOME_ALUMNI} directorySearch={SAMPLE_DIRECTORY_SEARCH} />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>No optional part and no name</p>
            <AlumniCard alumni={NO_NAME_ALUMNI} directorySearch="" />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Long name, company and tags: they wrap</p>
            <AlumniCard alumni={LONG_ALUMNI} directorySearch="" />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>With a photo link that loads</p>
            <AlumniCard
              alumni={{ ...SOME_ALUMNI, id: 5, photo_url: `${origin}${WORKING_PHOTO_PATH}` }}
              directorySearch=""
            />
          </div>
          <div className={styles.block}>
            <p className={styles.caption}>Loading: the page wraps the cards in one group</p>
            <SkeletonGroup>
              <AlumniCardSkeleton />
            </SkeletonGroup>
          </div>
        </div>
        <p className={styles.note}>
          The links go to the real profile address. The directory keeps its query in the link, so
          "Back to directory" returns to the same search.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="dev-directory-filters">
        <h2 id="dev-directory-filters" className={styles.sectionTitle}>
          Directory search and filters
        </h2>
        <div className={styles.block}>
          <p className={styles.caption}>Options loaded; try the controls</p>
          <FiltersSample />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>
            Criteria set, one value not among the options (an old link): it is still shown
          </p>
          <DirectoryFilters
            query={QUERY_WITH_OLD_VALUE}
            searchText={QUERY_WITH_OLD_VALUE.q}
            onSearchTextChange={() => undefined}
            onSearchNow={() => showToast("Search")}
            onFilterChange={() => showToast("Filter changed")}
            options={SAMPLE_FILTERS}
            optionsStatus="ready"
            onRetryOptions={() => undefined}
            onClear={() => showToast("Cleared")}
          />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>Options on their way: each filter has only its first option</p>
          <DirectoryFilters
            query={DEFAULT_DIRECTORY_QUERY}
            searchText=""
            onSearchTextChange={() => undefined}
            onSearchNow={() => undefined}
            onFilterChange={() => undefined}
            options={null}
            optionsStatus="loading"
            onRetryOptions={() => undefined}
            onClear={() => undefined}
          />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>Options failed to load: a message and Try again</p>
          <DirectoryFilters
            query={DEFAULT_DIRECTORY_QUERY}
            searchText=""
            onSearchTextChange={() => undefined}
            onSearchNow={() => undefined}
            onFilterChange={() => undefined}
            options={null}
            optionsStatus="error"
            onRetryOptions={() => showToast("Trying again")}
            onClear={() => undefined}
          />
        </div>
        <p className={styles.note}>
          Below 768px the filters sit in a panel behind the Filters button, which counts the filters
          that are set. Make the window narrow to see it.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="dev-profile-band">
        <h2 id="dev-profile-band" className={styles.sectionTitle}>
          Profile band
        </h2>
        <p className={styles.note}>
          Each band below has its own heading level 1, as on the real pages, where there is one.
        </p>
        <div className={styles.block}>
          <p className={styles.caption}>An alumni profile with every part</p>
          <ProfileBand
            back={{ to: PATHS.directory, label: PROFILE_BACK_LINK }}
            avatar={{ name: FULL_ALUMNI.name }}
            tag={<Tag variant="mentoring">{OPEN_TO_MENTORING}</Tag>}
            heading={SAMPLE_NAME}
            sub="Software Engineer at Nordlys Systems"
            tags={
              <>
                <Tag>Computer Science</Tag>
                <Tag>Class of 2019</Tag>
                <Tag>Software</Tag>
              </>
            }
            actions={
              <>
                <ProfileBandAction variant="primary" href={`mailto:${SAMPLE_USERS[0].email}`}>
                  {profileEmailLink("Nadia")}
                </ProfileBandAction>
                <ProfileBandAction variant="outline" href={FULL_ALUMNI.linkedin_url ?? ""} newTab>
                  {PROFILE_LINKEDIN_LINK}
                  <span className="visuallyHidden"> {OPENS_IN_NEW_TAB}</span>
                </ProfileBandAction>
              </>
            }
          />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>Loading: the heading stays, the rest is still</p>
          <ProfileBand
            back={{ to: PATHS.directory, label: PROFILE_BACK_LINK }}
            avatar={{ name: null }}
            heading={PROFILE_HEADING}
            loading
          />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>My profile: role tag, name and email, a link to the public profile</p>
          <ProfileBand
            avatar={{ name: SAMPLE_NAME, photoUrl: `${origin}${WORKING_PHOTO_PATH}` }}
            tag={<RoleTag role="alumni" />}
            heading={MY_PROFILE_HEADING}
            sub={myProfileSub(SAMPLE_NAME, SAMPLE_USERS[0].email)}
            actions={
              <ProfileBandAction variant="outline" to={alumniProfilePath(FULL_ALUMNI.id)}>
                {MY_PROFILE_PUBLIC_LINK}
              </ProfileBandAction>
            }
          />
        </div>
        <div className={styles.block}>
          <p className={styles.caption}>No optional part, a long name and a broken photo link</p>
          <ProfileBand
            avatar={{ name: LONG_ALUMNI.name, photoUrl: `${origin}${BROKEN_PHOTO_PATH}` }}
            heading={LONG_ALUMNI.name ?? PROFILE_HEADING}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="dev-table">
        <h2 id="dev-table" className={styles.sectionTitle}>
          Table
        </h2>
        <Table columns={userColumns} rows={SAMPLE_USERS} rowKey={(user) => user.id} caption="Sample users" />
        <p className={styles.note}>
          The row under the pointer takes the Sunken color. On a phone, each row becomes a card.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="dev-states">
        <h2 id="dev-states" className={styles.sectionTitle}>
          Messages and states
        </h2>
        <div className={styles.states}>
          <div className={styles.stateColumn}>
            <p className={styles.caption}>Success and error, shown where the action happened</p>
            <Message tone="success">Profile saved.</Message>
            <Message tone="error">
              This user has posts, comments or an alumni profile and cannot be deleted.
            </Message>
            <p className={styles.caption}>Toast, bottom corner, leaves after a few seconds</p>
            <div className={styles.startOnly}>
              <Button onClick={() => showToast("Post published")}>Show a toast</Button>
            </div>
          </div>
          <div className={styles.stateColumn}>
            <p className={styles.caption}>Empty</p>
            <EmptyState
              headingAs="h3"
              heading="No alumni match this search"
              text="Try a different name, or clear the filters."
              actionLabel="Clear filters"
              onAction={() => showToast("Filters cleared")}
            />
            <p className={styles.caption}>Empty, with no button</p>
            <EmptyState headingAs="h3" heading="No posts yet" text="Be the first to write one." />
          </div>
          <div className={styles.stateColumn}>
            <p className={styles.caption}>Loading: the shape of what is coming</p>
            <div className={styles.loadingBox}>
              <SkeletonGroup layout="row">
                <Skeleton shape="avatar-md" />
                <SkeletonStack>
                  <Skeleton shape="title" />
                  <Skeleton shape="line" />
                </SkeletonStack>
              </SkeletonGroup>
            </div>
            <div className={styles.loadingBox}>
              <SkeletonGroup>
                <Skeleton shape="avatar-sm" />
                <Skeleton shape="line" />
                <Skeleton shape="block" />
              </SkeletonGroup>
            </div>
            <p className={styles.caption}>Failed to load</p>
            <ErrorState
              headingAs="h3"
              heading="Alumni could not be loaded"
              text="Check your connection and try again."
              onRetry={() => showToast("Trying again")}
            />
          </div>
        </div>
      </section>

      <LinkSamples />
      <PostPartSamples />
      <FormSamples />
      <FeedPostSamples />
      <CommentSamples />
      <DashboardBlockSamples />

      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          showToast("Post deleted");
        }}
        title="Delete this post?"
        confirmLabel="Delete post"
        danger
      >
        Its 4 comments will be deleted too. This cannot be undone.
      </ConfirmDialog>
    </main>
  );
}

// DirectoryFilters with its own query in state, so every control works here.
// On the real page the address holds the query (pattern 24).
function FiltersSample() {
  const [query, setQuery] = useState<DirectoryQuery>(DEFAULT_DIRECTORY_QUERY);
  const [searchText, setSearchText] = useState("");

  return (
    <DirectoryFilters
      query={query}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      onSearchNow={() => setQuery((current) => ({ ...current, q: searchText.trim(), page: 1 }))}
      onFilterChange={(patch: DirectoryFilterPatch) =>
        setQuery((current) => ({ ...current, ...patch, page: 1 }))
      }
      options={SAMPLE_FILTERS}
      optionsStatus="ready"
      onRetryOptions={() => undefined}
      onClear={() => {
        setQuery(DEFAULT_DIRECTORY_QUERY);
        setSearchText("");
      }}
    />
  );
}

function ButtonStates({ row }: { row: ButtonRow }) {
  return (
    <>
      <span className={styles.rowName}>{row.name}</span>
      <Button {...row.look}>{row.word}</Button>
      <Button {...row.look} disabled>
        {row.word}
      </Button>
      <Button {...row.look} busy busyLabel={row.busyWord}>
        {row.word}
      </Button>
    </>
  );
}

// ----- Posts, comments and the dashboard blocks (REQ-fs-006) -----

function stopPress(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Stops every press inside before it reaches the component. FeedPost and
 * CommentItem call the store's write actions (a real request), and the links
 * of the blocks open pages that load data; this page calls no API. Tab still
 * reaches every control, so focus rings can be checked. It draws no box.
 */
function NoRequests({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.noRequests}
      onClickCapture={stopPress}
      onAuxClickCapture={stopPress}
      onSubmitCapture={stopPress}
    >
      {children}
    </div>
  );
}

/** A caption over one sample. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className={styles.block}>
      <p className={styles.caption}>{caption}</p>
      {children}
    </div>
  );
}

function LinkSamples() {
  return (
    <section className={styles.section} aria-labelledby="dev-button-links">
      <h2 id="dev-button-links" className={styles.sectionTitle}>
        Button links
      </h2>
      <NoRequests>
        <div className={styles.blocks}>
          <Sample caption="A link that looks like a button: primary and secondary">
            <div className={styles.wrapRow}>
              <ButtonLink to={PATHS.feed} variant="primary">
                {DASHBOARD_WRITE_POST_LINK}
              </ButtonLink>
              <ButtonLink to={PATHS.myProfile}>{DASHBOARD_PROFILE_EDIT_LINK}</ButtonLink>
            </div>
          </Sample>
          <Sample caption="Small">
            <div className={styles.wrapRow}>
              <ButtonLink to={PATHS.feed} variant="primary" size="sm">
                {DASHBOARD_WRITE_POST_LINK}
              </ButtonLink>
              <ButtonLink to={PATHS.myProfile} size="sm">
                {DASHBOARD_PROFILE_EDIT_LINK}
              </ButtonLink>
            </div>
          </Sample>
          <Sample caption="Empty, with a link to another page as the next step">
            <EmptyState
              headingAs="h3"
              heading={DASHBOARD_RECENT_EMPTY_HEADING}
              text={DASHBOARD_RECENT_EMPTY_WRITER_TEXT}
              actionLabel={DASHBOARD_RECENT_EMPTY_LINK}
              actionTo={PATHS.feed}
            />
          </Sample>
        </div>
      </NoRequests>
      <p className={styles.note}>
        Presses on these links are stopped here, since the pages they open load data. Tab still
        reaches them.
      </p>
    </section>
  );
}

function PostPartSamples() {
  const origin = window.location.origin;

  return (
    <section className={styles.section} aria-labelledby="dev-post-parts">
      <h2 id="dev-post-parts" className={styles.sectionTitle}>
        Post byline and text
      </h2>
      <div className={styles.pair}>
        <div className={styles.stack}>
          <Sample caption="Post size: name over the date, with a photo">
            <PostByline
              name={SAMPLE_NAME}
              photoUrl={`${origin}${WORKING_PHOTO_PATH}`}
              createdAt={SAMPLE_DATE}
            />
          </Sample>
          <Sample caption="Post size: no date and no photo">
            <PostByline name="Erik Lindqvist" createdAt={null} />
          </Sample>
          <Sample caption="Comment size: one row, a photo link that fails">
            <PostByline
              name="Amira Haddad"
              photoUrl={`${origin}${BROKEN_PHOTO_PATH}`}
              createdAt={LATER_DATE}
              size="sm"
            />
          </Sample>
          <Sample caption="Comment size: no name, no date">
            <PostByline name={null} createdAt={null} size="sm" />
          </Sample>
        </div>
        <div className={styles.stack}>
          <Sample caption="Long text">
            <PostText text={LONG_TEXT} />
          </Sample>
          <Sample caption="Line breaks are kept">
            <PostText text={LINE_BREAK_TEXT} />
          </Sample>
          <Sample caption="One unbroken string wraps instead of widening the page">
            <PostText text={UNBROKEN_TEXT} />
          </Sample>
          <Sample caption="Cut to three lines (summary card)">
            <PostText text={LONG_TEXT} clamp />
          </Sample>
          <Sample caption="Comment size">
            <PostText text={LINE_BREAK_TEXT} size="sm" />
          </Sample>
        </div>
      </div>
    </section>
  );
}

function FormSamples() {
  const showToast = useSetAtom(showToastAtom);

  // Each answer below comes from this page; nothing is sent.
  async function answerSent(): Promise<FormResult> {
    showToast(NOTHING_SENT);
    return { ok: true, reset: true };
  }

  function answerSlowly(): Promise<FormResult> {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve({ ok: true }), SLOW_ANSWER_MS);
    });
  }

  async function answerPostFailure(): Promise<FormResult> {
    return { ok: false, text: saveFailureText(NETWORK_FAILURE, POST_SAVE_FAILURE_WORDS) };
  }

  async function answerCommentFailure(): Promise<FormResult> {
    return { ok: false, text: saveFailureText(SERVER_FAILURE, COMMENT_SAVE_FAILURE_WORDS) };
  }

  return (
    <section className={styles.section} aria-labelledby="dev-post-forms">
      <h2 id="dev-post-forms" className={styles.sectionTitle}>
        Post and comment forms
      </h2>
      <p className={styles.note}>
        Every answer comes from this page: nothing is sent. Press the button with an empty field
        to see the field error.
      </p>
      <div className={styles.pair}>
        <div className={styles.stack}>
          <Sample caption="Write a post: empty">
            <PostForm
              captionLabel={POST_FORM_HEADING}
              submitLabel={POST_PUBLISH_BUTTON}
              busyLabel={POST_PUBLISH_BUSY}
              onSubmit={answerSent}
            />
          </Sample>
          <Sample caption="With errors: press Publish post (no caption, an image link that is not a link)">
            <PostForm
              initialMediaUrl="photo of the meetup"
              captionLabel={POST_FORM_HEADING}
              submitLabel={POST_PUBLISH_BUTTON}
              busyLabel={POST_PUBLISH_BUSY}
              onSubmit={answerSent}
            />
          </Sample>
          <Sample caption="Failed to send: press Publish post">
            <PostForm
              initialCaption={LINE_BREAK_TEXT}
              captionLabel={POST_FORM_HEADING}
              submitLabel={POST_PUBLISH_BUTTON}
              busyLabel={POST_PUBLISH_BUSY}
              onSubmit={answerPostFailure}
            />
          </Sample>
          <Sample caption="Busy: press Publish post, the answer takes four seconds">
            <PostForm
              initialCaption={LINE_BREAK_TEXT}
              captionLabel={POST_FORM_HEADING}
              submitLabel={POST_PUBLISH_BUTTON}
              busyLabel={POST_PUBLISH_BUSY}
              onSubmit={answerSlowly}
            />
          </Sample>
          <Sample caption="Edit post: secondary Save, and Cancel">
            <PostForm
              initialCaption={BASE_POST.caption ?? ""}
              initialMediaUrl={`${window.location.origin}${WORKING_PHOTO_PATH}`}
              captionLabel={POST_EDIT_LABEL}
              submitLabel={SAVE_LABEL}
              busyLabel={SAVING_LABEL}
              primary={false}
              onSubmit={answerSlowly}
              onCancel={() => showToast(CANCEL_LABEL)}
            />
          </Sample>
        </div>
        <div className={styles.stack}>
          <Sample caption="Add a comment">
            <CommentForm
              label={COMMENT_FIELD_LABEL}
              submitLabel={COMMENT_SUBMIT_BUTTON}
              busyLabel={COMMENT_SUBMIT_BUSY}
              onSubmit={answerSent}
            />
          </Sample>
          <Sample caption="Reply: who is answered, and Cancel">
            <CommentForm
              label={COMMENT_FIELD_LABEL}
              submitLabel={COMMENT_SUBMIT_BUTTON}
              busyLabel={COMMENT_SUBMIT_BUSY}
              replyingTo="Erik Lindqvist"
              onCancel={() => showToast(CANCEL_LABEL)}
              onSubmit={answerSlowly}
            />
          </Sample>
          <Sample caption="Edit a comment">
            <CommentForm
              label={COMMENT_EDIT_LABEL}
              initialValue={SAMPLE_COMMENTS[1].content ?? ""}
              submitLabel={SAVE_LABEL}
              busyLabel={SAVING_LABEL}
              onCancel={() => showToast(CANCEL_LABEL)}
              onSubmit={answerSlowly}
            />
          </Sample>
          <Sample caption="Failed to send: press Comment">
            <CommentForm
              label={COMMENT_FIELD_LABEL}
              initialValue="Count me in."
              submitLabel={COMMENT_SUBMIT_BUTTON}
              busyLabel={COMMENT_SUBMIT_BUSY}
              onSubmit={answerCommentFailure}
            />
          </Sample>
        </div>
      </div>
    </section>
  );
}

function FeedPostSamples() {
  const showToast = useSetAtom(showToastAtom);
  // The delete dialog of a post, drawn here with FeedPost's words: FeedPost's
  // own dialog would send the delete.
  const [deleteDialog, setDeleteDialog] = useState<"closed" | "open" | "failed">("closed");

  const origin = window.location.origin;
  const imagePost: Post = {
    ...BASE_POST,
    id: 105,
    caption: LINE_BREAK_TEXT,
    media_url: `${origin}${WORKING_PHOTO_PATH}`,
    comment_count: 0,
  };
  const brokenImagePost: Post = { ...BARE_POST, media_url: `${origin}${BROKEN_PHOTO_PATH}` };

  const samples: { caption: string; post: Post; session: Session | null }[] = [
    {
      caption: "Plain, seen by another alumnus: no Edit, no Delete",
      post: BASE_POST,
      session: OTHER_ALUMNI_SESSION,
    },
    { caption: "With an image", post: imagePost, session: OTHER_ALUMNI_SESSION },
    { caption: "Seen by its author: Edit and Delete", post: BASE_POST, session: AUTHOR_SESSION },
    { caption: "Seen by an admin: Delete only", post: BASE_POST, session: ADMIN_SESSION },
    { caption: "Seen by a student: read and comment", post: BASE_POST, session: STUDENT_SESSION },
    { caption: "Seen by a visitor with no session", post: BASE_POST, session: null },
    {
      caption: "No name, no date, one unbroken string, an image link that fails (hidden)",
      post: brokenImagePost,
      session: STUDENT_SESSION,
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="dev-feed-posts">
      <h2 id="dev-feed-posts" className={styles.sectionTitle}>
        Feed posts
      </h2>
      <p className={styles.note}>
        Presses on these posts are stopped here: Save and Delete would send a request. The editing
        and delete states below are drawn from the same parts with the same words.
      </p>
      <div className={styles.posts}>
        <NoRequests>
          {samples.map((sample) => (
            <Sample key={sample.caption} caption={sample.caption}>
              <FeedPost
                post={sample.post}
                session={sample.session}
                open={false}
                onToggleComments={() => undefined}
                onDeleted={() => undefined}
                onPostGone={() => undefined}
              />
            </Sample>
          ))}
        </NoRequests>
        <Sample caption="Editing: the post's text becomes the edit form (from the parts)">
          <Card as="article">
            <div className={styles.cardBody}>
              <PostByline name={BASE_POST.name} createdAt={BASE_POST.created_at} />
              <PostForm
                initialCaption={BASE_POST.caption ?? ""}
                captionLabel={POST_EDIT_LABEL}
                submitLabel={SAVE_LABEL}
                busyLabel={SAVING_LABEL}
                primary={false}
                onSubmit={async () => {
                  showToast(NOTHING_SENT);
                  return { ok: true };
                }}
                onCancel={() => showToast(CANCEL_LABEL)}
              />
              <div className={styles.cardFoot}>
                <Button variant="quiet" onClick={() => showToast(NOTHING_SENT)}>
                  {commentCountText(BASE_POST.comment_count)}
                </Button>
              </div>
            </div>
          </Card>
        </Sample>
        <Sample caption="Delete: the confirm dialog, and the dialog with a failure">
          <div className={styles.wrapRow}>
            <Button variant="quiet" tone="danger" onClick={() => setDeleteDialog("open")}>
              Open the delete dialog
            </Button>
            <Button variant="quiet" tone="danger" onClick={() => setDeleteDialog("failed")}>
              Open it with a failure
            </Button>
          </div>
        </Sample>
      </div>

      <ConfirmDialog
        open={deleteDialog !== "closed"}
        onClose={() => setDeleteDialog("closed")}
        onConfirm={() => {
          setDeleteDialog("closed");
          showToast(NOTHING_SENT);
        }}
        title={POST_DELETE_TITLE}
        confirmLabel={POST_DELETE_CONFIRM}
        cancelLabel={CANCEL_LABEL}
        danger
      >
        <div className={styles.dialogBody}>
          <p className={styles.dialogText}>{postDeleteBody(BASE_POST.comment_count)}</p>
          {deleteDialog === "failed" ? (
            <Message tone="error">{POST_CHANGE_FORBIDDEN_TEXT}</Message>
          ) : null}
        </div>
      </ConfirmDialog>
    </section>
  );
}

function CommentSamples() {
  const showToast = useSetAtom(showToastAtom);
  const threads = buildThreads(SAMPLE_COMMENTS);

  // The forms' answer comes from this page; nothing is sent.
  async function answerSent(): Promise<FormResult> {
    showToast(NOTHING_SENT);
    return { ok: true, reset: true };
  }

  function renderItem(comment: Comment, replies?: Comment[], editing = false) {
    return (
      <CommentItem
        comment={comment}
        session={AUTHOR_SESSION}
        replyCount={countReplies(SAMPLE_COMMENTS, comment.id)}
        editing={editing}
        onReply={() => undefined}
        onStartEdit={() => undefined}
        onEndEdit={() => undefined}
        onRemoved={() => undefined}
      >
        {replies !== undefined && replies.length > 0 ? (
          <ul className={styles.replies}>
            {replies.map((reply) => (
              <li key={reply.id} className={styles.reply}>
                {renderItem(reply)}
              </li>
            ))}
          </ul>
        ) : null}
      </CommentItem>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="dev-comments">
      <h2 id="dev-comments" className={styles.sectionTitle}>
        Comments
      </h2>
      <p className={styles.note}>
        The comments panel reads the store, so its states are drawn here from its parts, on a copy
        of its ground. The comments are seen by Nadia: Edit and Delete on her own reply only.
        Presses on the comments are stopped here.
      </p>
      <div className={styles.blocks}>
        <Sample caption="Loading">
          <div className={styles.commentPanel}>
            <SkeletonGroup layout="row">
              <Skeleton shape="avatar-sm" />
              <SkeletonStack>
                <Skeleton />
                <Skeleton />
              </SkeletonStack>
            </SkeletonGroup>
          </div>
        </Sample>
        <Sample caption="Failed to load">
          <div className={styles.commentPanel}>
            <NoRequests>
              <ErrorState
                heading={COMMENTS_ERROR_HEADING}
                headingAs="h3"
                text={loadFailureText(NETWORK_FAILURE)}
                retryVariant="secondary"
                onRetry={() => undefined}
              />
            </NoRequests>
          </div>
        </Sample>
        <Sample caption="No comments yet">
          <div className={styles.commentPanel}>
            <EmptyState
              heading={COMMENTS_EMPTY_HEADING}
              headingAs="h3"
              text={COMMENTS_EMPTY_TEXT}
            />
            <CommentForm
              label={COMMENT_FIELD_LABEL}
              submitLabel={COMMENT_SUBMIT_BUTTON}
              busyLabel={COMMENT_SUBMIT_BUSY}
              onSubmit={answerSent}
            />
          </div>
        </Sample>
      </div>
      <div className={styles.pair}>
        <Sample caption="A thread with replies, then the form replying to Erik">
          <div className={styles.commentPanel}>
            <NoRequests>
              <ul className={styles.threads}>
                {threads.map((thread) => (
                  <li key={thread.comment.id}>{renderItem(thread.comment, thread.replies)}</li>
                ))}
              </ul>
            </NoRequests>
            <CommentForm
              label={COMMENT_FIELD_LABEL}
              submitLabel={COMMENT_SUBMIT_BUTTON}
              busyLabel={COMMENT_SUBMIT_BUSY}
              replyingTo={SAMPLE_COMMENTS[0].name}
              onCancel={() => showToast(CANCEL_LABEL)}
              onSubmit={answerSent}
            />
          </div>
        </Sample>
        <Sample caption="A comment being edited">
          <div className={styles.commentPanel}>
            <NoRequests>{renderItem(SAMPLE_COMMENTS[1], undefined, true)}</NoRequests>
          </div>
        </Sample>
      </div>
    </section>
  );
}

function DashboardBlockSamples() {
  const directoryLink = { label: PEOPLE_DIRECTORY_LINK, to: PATHS.directory };
  const writeLink = (
    <ButtonLink to={PATHS.feed} variant="primary">
      {DASHBOARD_WRITE_POST_LINK}
    </ButtonLink>
  );
  const peopleSamples: { caption: string; state: PeopleBlockState }[] = [
    { caption: "Loading", state: PEOPLE_LOADING },
    { caption: "Empty", state: PEOPLE_EMPTY },
    { caption: "Failed to load", state: PEOPLE_ERROR },
    { caption: "Ready: a person with no name, a person with no job line", state: PEOPLE_READY },
  ];
  const recentSamples: { caption: string; state: RecentPostsBlockState }[] = [
    { caption: "Loading", state: RECENT_LOADING },
    { caption: "Empty, with the next step", state: RECENT_EMPTY },
    { caption: "Failed to load", state: RECENT_ERROR },
  ];
  const countSamples: { caption: string; state: CountsBlockState }[] = [
    { caption: "Ready", state: COUNTS_READY },
    { caption: "Ready, every count 0", state: COUNTS_ZERO },
    { caption: "Loading", state: COUNTS_LOADING },
    { caption: "Failed to load: one error for the three cards", state: COUNTS_ERROR },
  ];
  const profileSamples: { caption: string; role: "student" | "alumni"; state: MyAlumniState }[] = [
    {
      caption: "A student: complete the account (nothing is loaded)",
      role: "student",
      state: MY_ALUMNI_IDLE,
    },
    { caption: "Ready", role: "alumni", state: MY_ALUMNI_READY },
    { caption: "No alumni profile yet", role: "alumni", state: MY_ALUMNI_NONE },
    { caption: "Loading", role: "alumni", state: MY_ALUMNI_LOADING },
    { caption: "Failed to load", role: "alumni", state: MY_ALUMNI_ERROR },
  ];

  return (
    <NoRequests>
      <section className={styles.section} aria-labelledby="dev-people">
        <h2 id="dev-people" className={styles.sectionTitle}>
          People lists
        </h2>
        <p className={styles.note}>
          Every block below takes its state as a prop; nothing is loaded. Presses are stopped here,
          since the links open pages that load data.
        </p>
        <div className={styles.blocks}>
          {peopleSamples.map((sample) => (
            <Sample key={`plain ${sample.caption}`} caption={`Dashboard: ${sample.caption}`}>
              <PeopleBlock
                heading={PEOPLE_NEW_HEADING}
                state={sample.state}
                emptyHeading={PEOPLE_NEW_EMPTY_HEADING}
                emptyText={PEOPLE_NEW_EMPTY_TEXT}
                errorHeading={PEOPLE_ERROR_HEADING}
                onRetry={() => undefined}
                footerLink={directoryLink}
              />
            </Sample>
          ))}
          {peopleSamples.map((sample) => (
            <Sample key={`card ${sample.caption}`} caption={`Feed side, in a card: ${sample.caption}`}>
              <PeopleBlock
                heading={PEOPLE_MENTORING_HEADING}
                state={sample.state}
                emptyHeading={PEOPLE_MENTORING_EMPTY_HEADING}
                emptyText={PEOPLE_MENTORING_EMPTY_TEXT}
                errorHeading={PEOPLE_ERROR_HEADING}
                onRetry={() => undefined}
                footerLink={directoryLink}
                variant="card"
              />
            </Sample>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="dev-recent-posts">
        <h2 id="dev-recent-posts" className={styles.sectionTitle}>
          Recent posts
        </h2>
        <div className={styles.pair}>
          <Sample caption="Dashboard, ready: the author over each post, the text cut to three lines">
            <RecentPostsBlock
              heading={DASHBOARD_RECENT_HEADING}
              state={RECENT_READY}
              showAuthor
              emptyHeading={DASHBOARD_RECENT_EMPTY_HEADING}
              emptyText={DASHBOARD_RECENT_EMPTY_WRITER_TEXT}
              errorHeading={DASHBOARD_RECENT_ERROR_HEADING}
              onRetry={() => undefined}
              action={writeLink}
            />
          </Sample>
          <Sample caption="Alumni profile, ready: no author, the date names each card">
            <RecentPostsBlock
              heading={PROFILE_POSTS_HEADING}
              state={RECENT_READY}
              showAuthor={false}
              emptyHeading={profilePostsEmptyHeading("Nadia")}
              emptyText={PROFILE_POSTS_EMPTY_TEXT}
              errorHeading={PROFILE_POSTS_ERROR_HEADING}
              onRetry={() => undefined}
            />
          </Sample>
        </div>
        <div className={styles.blocks}>
          {recentSamples.map((sample) => (
            <Sample key={sample.caption} caption={sample.caption}>
              <RecentPostsBlock
                heading={DASHBOARD_RECENT_HEADING}
                state={sample.state}
                showAuthor
                emptyHeading={DASHBOARD_RECENT_EMPTY_HEADING}
                emptyText={DASHBOARD_RECENT_EMPTY_WRITER_TEXT}
                emptyAction={{ label: DASHBOARD_RECENT_EMPTY_LINK, to: PATHS.feed }}
                errorHeading={DASHBOARD_RECENT_ERROR_HEADING}
                onRetry={() => undefined}
              />
            </Sample>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="dev-counts">
        <h2 id="dev-counts" className={styles.sectionTitle}>
          Counts
        </h2>
        {countSamples.map((sample) => (
          <Sample key={sample.caption} caption={sample.caption}>
            <CountsBlock state={sample.state} onRetry={() => undefined} />
          </Sample>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="dev-your-profile">
        <h2 id="dev-your-profile" className={styles.sectionTitle}>
          Your profile
        </h2>
        <div className={styles.blocks}>
          {profileSamples.map((sample) => (
            <Sample key={sample.caption} caption={sample.caption}>
              <YourProfileBlock
                role={sample.role}
                state={sample.state}
                userName={SAMPLE_NAME}
                userPhoto={null}
                onRetry={() => undefined}
              />
            </Sample>
          ))}
        </div>
      </section>
    </NoRequests>
  );
}
