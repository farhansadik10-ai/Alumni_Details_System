import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../../.env");

dotenv.config({ path: envPath });

const dbPassword = process.env.DB_PASSWORD;

console.log("ENV FILE:", envPath);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD LOADED:", !!dbPassword);
console.log("DB_PASSWORD TYPE:", typeof dbPassword);

if (typeof dbPassword !== "string" || dbPassword.length === 0) {
  throw new Error("DB_PASSWORD is missing. Check your .env file.");
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: dbPassword,
  database: process.env.DB_NAME,
});

pool.connect()
  .then((client) => {
    console.log("PostgreSQL Connected!");
    client.release();
  })
  .catch((error) => {
    console.error("PostgreSQL Connection Error:", error);
  });

export default pool;