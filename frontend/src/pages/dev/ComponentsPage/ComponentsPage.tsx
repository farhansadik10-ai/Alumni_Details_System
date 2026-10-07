import { useSetAtom } from "jotai";
import { useState } from "react";
import type { ComponentType } from "react";
import { ThemeSwitch } from "../../../components/shell/ThemeSwitch/ThemeSwitch";
import { Avatar } from "../../../components/ui/Avatar/Avatar";
import { Button } from "../../../components/ui/Button/Button";
import type { ButtonProps } from "../../../components/ui/Button/Button";
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
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { AlertIcon } from "../../../icons/AlertIcon";
import { CheckIcon } from "../../../icons/CheckIcon";
import { ChevronDownIcon } from "../../../icons/ChevronDownIcon";
import { CloseIcon } from "../../../icons/CloseIcon";
import type { IconProps } from "../../../icons/IconBase";
import { MenuIcon } from "../../../icons/MenuIcon";
import { MonitorIcon } from "../../../icons/MonitorIcon";
import { MoonIcon } from "../../../icons/MoonIcon";
import { SunIcon } from "../../../icons/SunIcon";
import { PATHS } from "../../../routes/paths";
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
            Development only. Compare each section with system.html and system-dark.html.
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
