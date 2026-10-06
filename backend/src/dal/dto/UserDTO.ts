import type { BaseDTO } from "./BaseDTO";

export class UserDTO implements BaseDTO{
    id!:number;
    name:string;
    email:string;
    password:string;
    role: string;
    photo_url:string;
    login_at:Date;
    logout_at:Date;
    created_at:Date;
    updated_at:Date;
    constructor(name:string,email:string,password:string,role:string,photo_url:string){
        this.name=name;
        this.email=email;
        this.password=password;
        this.role=role;
        this.photo_url=photo_url;
        const now = new Date();
        this.login_at=now;
        this.logout_at=now;
        this.created_at=now;
        this.updated_at=now;



    }

}

/** A user as the API may show it: every column except the password hash. */
export type PublicUserDTO = Omit<UserDTO, "password">;