import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";
import type { To } from "react-router-dom";
import styles from "./Link.module.css";

type CommonProps = {
  children: ReactNode;
  // Weight 700, as on "Create an account".
  strong?: boolean;
};

// An address inside the app. The router changes the page without a reload.
type InAppLinkProps = CommonProps & {
  to: To;
  // Handed to the next page through the router (for example the directory
  // address a profile should return to). Router state is untrusted on read.
  state?: unknown;
  href?: never;
};

// Any other address, for example "mailto:". A plain <a>.
type PlainLinkProps = CommonProps & {
  href: string;
  to?: never;
};

export type LinkProps = InAppLinkProps | PlainLinkProps;

export function Link(props: LinkProps) {
  const className = props.strong ? `${styles.link} ${styles.strong}` : styles.link;

  if (props.to !== undefined) {
    return (
      <RouterLink className={className} to={props.to} state={props.state}>
        {props.children}
      </RouterLink>
    );
  }

  return (
    <a className={className} href={props.href}>
      {props.children}
    </a>
  );
}
