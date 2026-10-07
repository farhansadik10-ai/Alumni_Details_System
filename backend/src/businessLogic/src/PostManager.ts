import { PostDTO, PostQuery } from "@alumni/dal";

export class PostManager {
  postQuery: PostQuery;

  constructor() {
    this.postQuery = new PostQuery();
  }
  public async createNewPost(post: PostDTO) {
    const newPost = await this.postQuery.createPost(post);
    return newPost;
  }

  public async updatePost(
    id: number,
    data: Parameters<PostQuery["updatePost"]>[1],
  ) {
    const newUpatePost = await this.postQuery.updatePost(id, data);
    return newUpatePost;
  }
  public async findPostById(id: number) {
    const post = await this.postQuery.findPostById(id);
    return post;
  }
  /** Deletes the post with its comments and their replies. `false` when no post has this id. */
  public async deletePost(id: number) {
    const deleted = await this.postQuery.deletePost(id);
    return deleted;
  }
  public async listPosts(page: Parameters<PostQuery["listPosts"]>[0]) {
    const posts = await this.postQuery.listPosts(page);
    return posts;
  }
}
