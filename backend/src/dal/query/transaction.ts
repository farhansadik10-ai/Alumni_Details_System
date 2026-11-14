import type { PoolClient } from "pg";
import pool from "../config/db.js";

/**
 * Runs `work` inside one database transaction, on one connection.
 *
 * `work` must send every statement through the `client` it is given. A
 * statement sent through the shared pool runs on another connection, outside
 * the transaction, and is not rolled back.
 *
 * When `work` resolves, the transaction is committed and its value returned.
 * When anything throws, the transaction is rolled back and the same error is
 * thrown again. The connection goes back to the pool either way.
 */
export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  // Set when ROLLBACK itself fails: the connection is in an unknown state, so
  // the pool is told to close it instead of handing it to the next caller.
  let discardClient = false;

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discardClient = true;
    }
    // The first error is the one the caller needs, also when ROLLBACK failed.
    throw err;
  } finally {
    client.release(discardClient);
  }
}
