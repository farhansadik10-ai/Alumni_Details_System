import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";
import type { To } from "react-router-dom";
import { ChevronDownIcon } from "../../../icons/ChevronDownIcon";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Skeleton } from "../../ui/Skeleton/Skeleton";
import styles from "./ProfileBand.module.css";

export type ProfileBandProps = {
  /** The link above the avatar, for example "Back to directory". */
  back?: { to: To; label: string };
  /** The person the band is about. The avatar is decorative (see Avatar). */
  avatar: { name: string | null; photoUrl?: string | null };
  /** One tag above the heading: "Open to mentoring" or the role tag. */
  tag?: ReactNode;
  /** The page's one <h1>. Also pass it to PageLayout, for the tab title. */
  heading: string;
  /** One line under the heading: the job line, or the name and email. */
  sub?: string;
  /** A row of plain tags under the sub line (department, class, field). */
  tags?: ReactNode;
  /** The links on the right: ProfileBandAction elements. */
  actions?: ReactNode;
  /**
   * The data is on its way: the avatar and the sub line are still blocks, and
   * the tag, tags and actions are left out. The page's content says "Loading".
   */
  loading?: boolean;
};

/**
 * The band of the alumni profile and of My profile (profile.html,
 * my-profile.html). It takes the band look and its paddings from Band, so the
 * two bands cannot drift, and it leaves out Band's accent bar, as drawn.
 *
 * Render it in every page status at the same place: every part sits in a
 * fixed slot, so the <h1> stays the same element when the data arrives and
 * keyboard focus on it is not lost.
 */
export function ProfileBand({
  back,
  avatar,
  tag,
  heading,
  sub,
  tags,
  actions,
  loading = false,
}: ProfileBandProps) {
  return (
    <div className={styles.band} aria-busy={loading ? true : undefined}>
      <div className={styles.inner}>
        {back ? (
          <RouterLink className={styles.back} to={back.to}>
            <span className={styles.backIcon}>
              <ChevronDownIcon size="sm" />
            </span>
            {back.label}
          </RouterLink>
        ) : null}
        <div className={styles.row}>
          <div className={styles.person}>
            {loading ? (
              <span className={styles.avatarLoading} aria-hidden="true" />
            ) : (
              <Avatar name={avatar.name} photoUrl={avatar.photoUrl} size="xl" />
            )}
            <div className={styles.text}>
              {tag && !loading ? <div className={styles.tag}>{tag}</div> : null}
              <h1 className={styles.heading} tabIndex={-1}>
                {heading}
              </h1>
              {loading ? (
                <span className={styles.subLoading}>
                  <Skeleton shape="line" />
                </span>
              ) : sub ? (
                <p className={styles.sub}>{sub}</p>
              ) : null}
              {tags && !loading ? <div className={styles.tags}>{tags}</div> : null}
            </div>
          </div>
          {actions && !loading ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

type ActionCommonProps = {
  /** "primary": the accent button ("Email Nadia"). "outline": a light border. */
  variant?: "primary" | "outline";
  children: ReactNode;
};

type InAppActionProps = ActionCommonProps & {
  to: To;
  href?: never;
  newTab?: never;
};

type PlainActionProps = ActionCommonProps & {
  href: string;
  to?: never;
  /**
   * Opens in a new tab, without telling the other site where it came from.
   * Put the hidden "(opens in a new tab)" words in the children.
   */
  newTab?: boolean;
};

export type ProfileBandActionProps = InAppActionProps | PlainActionProps;

/** A link drawn as a button, in the band's colors: one item of `actions`. */
export function ProfileBandAction(props: ProfileBandActionProps) {
  const className = `${styles.action} ${
    props.variant === "primary" ? styles.actionPrimary : styles.actionOutline
  }`;

  if (props.to !== undefined) {
    return (
      <RouterLink className={className} to={props.to}>
        {props.children}
      </RouterLink>
    );
  }

  return (
    <a
      className={className}
      href={props.href}
      target={props.newTab ? "_blank" : undefined}
      rel={props.newTab ? "noopener noreferrer" : undefined}
    >
      {props.children}
    </a>
  );
}
