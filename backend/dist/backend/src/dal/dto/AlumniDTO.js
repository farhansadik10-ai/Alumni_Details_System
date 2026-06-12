"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlumniDTO = void 0;
class AlumniDTO {
    constructor(id, user_id, department, current_company, job_title, experience, bio, linkedin_url) {
        this.id = id;
        this.user_id = user_id;
        this.department = department;
        this.current_company = current_company;
        this.job_title = job_title;
        this.experience = experience;
        this.bio = bio;
        this.linkedin_url = linkedin_url;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;
    }
}
exports.AlumniDTO = AlumniDTO;
