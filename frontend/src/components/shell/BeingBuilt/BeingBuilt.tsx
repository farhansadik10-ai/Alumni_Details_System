import type { ReactNode } from "react";
import { PageLayout, PageNote } from "../PageLayout/PageLayout";

export type BeingBuiltProps = {
  heading: string;
  sub: string;
  /** Shown in the card, under the words. My profile puts Log out here. */
  children?: ReactNode;
};

const TITLE = "This page is being built";
const TEXT = "It arrives in a later update.";

/**
 * What a page shows until its own part of the redesign builds it (AC40).
 * Each such page has its own thin file that renders this with its words.
 */
export function BeingBuilt({ heading, sub, children }: BeingBuiltProps) {
  return (
    <PageLayout heading={heading} sub={sub}>
      <PageNote title={TITLE} text={TEXT}>
        {children}
      </PageNote>
    </PageLayout>
  );
}
