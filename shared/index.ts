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
// The legacy `User` (it has `password`) and `CreateUserDTO` are left out on
// purpose: the legacy frontend reaches them by file path.
export type {
  SignUpUserDTO,
  UpdateUserDTO,
  LoginUserDTO,
  PublicUser,
  LoginResponse,
  ApiError,
} from "./types/user.types";
