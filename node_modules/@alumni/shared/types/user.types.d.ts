export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    photo_url?: string;
    login_at?: Date;
    logout_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role?: string;
    photo_url?: string;
}
export interface LoginUserDTO {
    email: string;
    password: string;
}
//# sourceMappingURL=user.types.d.ts.map