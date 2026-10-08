import { useId } from "react";
import type { Post } from "@alumni/shared";
import { commentCountText, dateText } from "../../../lib/postDisplay";
import { PATHS } from "../../../routes/paths";
import { Card } from "../../ui/Card/Card";
import { Link } from "../../ui/Link/Link";
import { PostByline } from "../PostByline/PostByline";
import { PostText } from "../PostText/PostText";
import styles from "./PostSummaryCard.module.css";

export type PostSummaryCardProps = {
  post: Post;
  // The author's avatar and name over the text (the Dashboard). Without it only
  // the date is shown (a profile's own posts: the author is the page).
  showAuthor: boolean;
};

/**
 * One post in short (dashboard.html "Recent posts"): who and when, the text cut
 * to three lines, and a link to the feed with the comment count. The article is
 * named by its byline, so a screen reader can tell the cards apart.
 */
export function PostSummaryCard({ post, showAuthor }: PostSummaryCardProps) {
  const labelId = useId();
  const date = dateText(post.created_at);
  const showDate = !showAuthor && date !== null && post.created_at !== null;
  // No byline and no readable date: nothing to name the article by.
  const labelledBy = showAuthor || showDate ? labelId : undefined;

  return (
    <Card as="article" aria-labelledby={labelledBy}>
      <div className={styles.body}>
        {showAuthor ? (
          <div id={labelId}>
            <PostByline
              name={post.name}
              photoUrl={post.photo_url}
              createdAt={post.created_at}
              size="sm"
            />
          </div>
        ) : showDate && post.created_at !== null ? (
          <time id={labelId} className={styles.date} dateTime={post.created_at}>
            {date}
          </time>
        ) : null}
        <PostText text={post.caption} clamp />
        <p className={styles.footer}>
          <Link strong to={PATHS.feed}>
            {commentCountText(post.comment_count)}
          </Link>
        </p>
      </div>
    </Card>
  );
}
