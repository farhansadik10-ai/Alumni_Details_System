import { Card } from "../../ui/Card/Card";
import { Skeleton } from "../../ui/Skeleton/Skeleton";
import styles from "./AlumniCard.module.css";

/**
 * The loading shape of one AlumniCard. It says nothing itself: the page wraps
 * all the skeleton cards in one SkeletonGroup, so "Loading" is read out once (AC9).
 */
export function AlumniCardSkeleton() {
  return (
    <Card>
      <div className={styles.body} aria-hidden="true">
        <div className={styles.top}>
          <Skeleton shape="avatar-md" />
        </div>
        <div className={styles.who}>
          <Skeleton shape="title" />
          <Skeleton shape="line" />
        </div>
        <Skeleton shape="line" />
        <div className={styles.footer}>
          <Skeleton shape="line" />
        </div>
      </div>
    </Card>
  );
}
