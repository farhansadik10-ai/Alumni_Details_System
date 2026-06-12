"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlumni = createAlumni;
exports.findAlumniByUserId = findAlumniByUserId;
exports.findAlumniById = findAlumniById;
exports.getAllAlumni = getAllAlumni;
exports.updateAlumni = updateAlumni;
exports.deleteAlumni = deleteAlumni;
const db_1 = __importDefault(require("../config/db"));
async function createAlumni(data) {
    const result = await db_1.default.query(`INSERT INTO alumni (user_id, graduation_year, department, current_company, job_title, experience, bio, linkedin_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [data.user_id, data.graduation_year, data.department, data.current_company, data.job_title, data.experience, data.bio, data.linkedin_url]);
    return result.rows[0];
}
async function findAlumniByUserId(user_id) {
    const result = await db_1.default.query(`SELECT * FROM alumni WHERE user_id = $1`, [user_id]);
    return result.rows[0] || null;
}
async function findAlumniById(id) {
    const result = await db_1.default.query(`SELECT * FROM alumni WHERE id = $1`, [id]);
    return result.rows[0] || null;
}
async function getAllAlumni() {
    const result = await db_1.default.query(`SELECT * FROM alumni`);
    return result.rows;
}
async function updateAlumni(id, data) {
    const result = await db_1.default.query(`UPDATE alumni SET graduation_year=$1, department=$2, current_company=$3, 
     job_title=$4, experience=$5, bio=$6, linkedin_url=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`, [data.graduation_year, data.department, data.current_company, data.job_title, data.experience, data.bio, data.linkedin_url, id]);
    return result.rows[0];
}
async function deleteAlumni(id) {
    await db_1.default.query(`DELETE FROM alumni WHERE id = $1`, [id]);
}
