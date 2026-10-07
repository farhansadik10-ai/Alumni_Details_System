// The one door into @alumni/shared: every type the API accepts or answers.
// Types only, no runtime code.
export type {
  Alumni,
  CreateAlumniDTO,
  UpdateAlumniDTO,
} from "./types/alumni.types";
export type {
  Post,
  CreatePostDTO,
  UpdatePostDTO,
} from "./types/posts.types";
export type {
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
} from "./types/comment.types";
export type { Paged, AlumniFilters, Stats } from "./types/list.types";
// `User` and `CreateUserDTO` are left out on purpose: both carry `password`.
// New code uses `PublicUser`, `SignUpUserDTO` and `UpdateUserDTO`.
export type {
  SignUpUserDTO,
  UpdateUserDTO,
  LoginUserDTO,
  PublicUser,
  LoginResponse,
  ApiError,
} from "./types/user.types";
