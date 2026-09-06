import bcrypt from "bcrypt";
import pool from "./backend/src/dal/config/db.js";

const users = [
  { id: 3, password: "123456" },
  { id: 10, password: "pass123" },
  { id: 12, password: "pass123" },
  { id: 13, password: "pass123" },
  { id: 14, password: "pass123" },
];

async function hashPasswords() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.query(
        `UPDATE "User"
         SET password = $1
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      console.log(`Password updated for user ID: ${user.id}`);
    }

    console.log("All passwords hashed successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

hashPasswords();