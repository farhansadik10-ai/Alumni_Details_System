import pool from '../config/db';
import { Alumni, CreateAlumniDTO, UpdateAlumniDTO } from '../../../shared/types/alumni.types';
export async function CreateAlumni(data: CreateAlumniDTO): Promise<Alumni> {

    const result = await pool.query (
        'INSERT INTO "Alumni" (user_id, graduation_year, department, current_company, job_title, exparience, bio, linkedin_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [data.user_id, data.graduation_year, data.department, data.current_company, data.job_title, data.experience, data.bio, data.linkedin_url]
     );
    return result.rows[0];

    
}
export async function findAlumniByUserId(user_id: number): Promise<Alumni | null> {
    const result = await pool. query(
        'SELECT * FROM "ALUMNI" WHERE USER_ID = $1',
        [user_id]
    );
    return result.rows[0] || null;
}
export async function findAlumniById(id: number): Promise<Alumni | null> {
    const result =await pool.query(
        'SELECT * FROM alumni WHERE ID = $1',
        [id]
    );
    return result.rows[0] || null;
}

    
export async function getAllAlumni() : Promise <Alumni[]> {
    const result = await pool. query(
        'SELECT * FROM alumni'
    );
    return result . rows;

    
}
export async function updateAlumni(id: number, data: UpdateAlumniDTO): Promise<Alumni> {
    const result = await pool.query(
        'UPDATE alumni SET graduation_year=$1, department=$2, current_company=$3, job_title=$4, experience=$5, bio=$6, linkedin_url=$7 WHERE id=$8 RETURNING *',
        [data.graduation_year, data.department, data.current_company, data.job_title, data.experience, data.bio, data.linkedin_url, id]
    );
    return result.rows[0];

}
export async function deleteAlumni(id: number): Promise<void> {
    await pool.query(
        'DELETE FROM alumni WHERE id = $1',
        [id]
    );
}

