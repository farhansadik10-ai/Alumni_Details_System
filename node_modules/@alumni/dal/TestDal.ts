import { CommentDTO } from "./dto/CommentDTO";
import { PostDTO } from "./dto/PostDTO";
import { CommentQuery } from "./query/CommentQuery";
import { PostQuery } from "./query/PostQuery";

const postQuery = new PostQuery ();
const post = new PostDTO (3,"my caption 1","uplode/image1.jpg");
const newPost = postQuery.createPost(post);
console.log(newPost);

const commentQuery = new CommentQuery();
const comment = new CommentDTO(1,2,"My first comment",null);
const newComment = commentQuery.createComment(comment);
console.log(newComment);