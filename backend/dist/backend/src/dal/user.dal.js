"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.getAllUsers = getAllUsers;
exports.updateUser = updateUser;
exports.updateLoginTime = updateLoginTime;
exports.updateLogoutTime = updateLogoutTime;
exports.deleteUser = deleteUser;
const db_1 = __importDefault(require("../config/db"));
async function createUser(data) {
    const { name, email, password, role = 'Student', photo_url } = data;
    const result = await db_1.default.query(`INSERT INTO "User" (name, email, password, role, photo_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`, [name, email, password, role, photo_url]);
    return result.rows[0];
}
async function findUserByEmail(email) {
    const result = await db_1.default.query(`SELECT * FROM "User" WHERE email = $1`, [email]);
    return result.rows[0] || null;
}
async function findUserById(id) {
    const result = await db_1.default.query(`SELECT * FROM "User" WHERE id = $1`, [id]);
    return result.rows[0] || null;
}
async function getAllUsers() {
    const result = await db_1.default.query(`SELECT * FROM "User"`);
    return result.rows;
}
async function updateUser(id, data) {
    const { name, photo_url } = data;
    const result = await db_1.default.query(`UPDATE "User" SET name=$1, photo_url=$2, updated_at=NOW()
     WHERE id=$3 RETURNING *`, [name, photo_url, id]);
    return result.rows[0];
}
async function updateLoginTime(id) {
    await db_1.default.query(`UPDATE "User" SET login_at=NOW() WHERE id=$1`, [id]);
}
async function updateLogoutTime(id) {
    await db_1.default.query(`UPDATE "User" SET logout_at=NOW() WHERE id=$1`, [id]);
}
async function deleteUser(id) {
    await db_1.default.query(`DELETE FROM "User" WHERE id = $1`, [id]);
}
// Test call
async function runTest() {
    const user = await createUser({
        name: "Farhan Sadik Chowdhury",
        email: "fsadik906@gmail.com",
        password: "123456",
        role: "Student"
    });
    console.log("✅ User Created:", user);
}
runTest().catch(console.error);
