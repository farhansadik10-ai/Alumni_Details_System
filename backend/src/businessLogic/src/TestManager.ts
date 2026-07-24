import { PostDTO, CommentDTO, AlumniDTO, UserDTO } from "@alumni/dal";
import { PostManager } from "./PostManager";
import { CommentManager } from "./CommentManager";
import { AlumniManager } from "./AlumniManager";
import { UserManager } from "./UserManager";

// /* ---------------- POST TEST ---------------- */

//const postManager = new PostManager();
//postManager.getAllPosts();
// // Create Post
// const post = new PostDTO(
//   1,
//   "Hello World",
//   "https://image.com/post.jpg"
// );
// postManager.createNewPost(post);

// // Get Posts By User ID
// const postByUser = new PostDTO(1);
// postManager.getPostsByUserId(postByUser);

// // Update Post
// const updatePost = new PostDTO(
//   1,
//   "Updated Caption",
//   "https://image.com/new.jpg"
// );
// updatePost.id = 1;
// postManager.updatePost(updatePost);

// // Update Comment Count
// const commentPost = new PostDTO(1);
// commentPost.id = 1;
// commentPost.comment_count = 5;
// postManager.updateCommentCount(commentPost);

// // Delete Post
// const deletePost = new PostDTO(1);
// deletePost.id = 1;
// postManager.deletePost(deletePost);

// /* ---------------- COMMENT TEST ---------------- */

//const commentManager = new CommentManager();

// // Create Comment
// const comment = new CommentDTO(
//   1,              // user_id
//   1,              // post_id
//   "Nice post!"    // content
// );
// commentManager.createComment(comment);

// // Get All Comments
//commentManager.getAllComments();

// // Update Comment
// const updateComment = new CommentDTO(
//   1,
//   1,
//   "Updated comment!"
// );
// updateComment.id = 1;
// commentManager.updateComment(updateComment);

// // Delete Comment
// const deleteComment = new CommentDTO(
//   1,
//   1,
//   ""
// );
// deleteComment.id = 1;
// commentManager.deleteComment(deleteComment);

// /* ---------------- ALUMNI TEST ---------------- */

 //const alumniManager = new AlumniManager();

// // Create Alumni
// const alumni = new AlumniDTO(
//   1, // user_id
//   "CSE",
//   "Google",
//   "Software Engineer",
//   "5 Years",
//   "I am an alumni",
//   "https://linkedin.com/in/alumni"
// );

// alumniManager.createAlumni(alumni);

// // Get All Alumni
//alumniManager.getAllAlumni();

// // Find Alumni By ID
// alumniManager.findAlumniById(1);

// // Update Alumni
// alumniManager.updateAlumni(1, {
//   department: "Software Engineering",
// });

// /* ---------------- USER TEST ---------------- */

//  const userManager = new UserManager();

// Create User
// const user = new UserDTO(
//   "MD Rahim",
//   "test001@email.com",
//   "password123",
//   "alumni",
//   "https://image.com/photo.jpg"
// );

// userManager.createUser(user);

// // Get All Users
//  userManager.getAllUsers();

// // Find User By ID
// userManager.findUserById(1);

// // Find User By Email
// userManager.findUserByEmail("test001@email.com");

// // Update User
// userManager.updateUser(1, {
//   name: "Updated Rahim",
// });

// // Update Login Time
// userManager.updateLoginTime(1);

// // Update Logout Time
// userManager.updateLogoutTime(1);

// // Delete User
// userManager.deleteUser(1);