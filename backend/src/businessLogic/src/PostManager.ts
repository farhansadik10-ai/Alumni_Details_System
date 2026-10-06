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

  public async updatePost(id: number, data: Partial<PostDTO>) {
    const newUpatePost = await this.postQuery.updatePost(id, data);
    return newUpatePost;
  }
  public async findPostById(id: number) {
    const post = await this.postQuery.findPostById(id);
    return post;
  }
  public async deletePost(post:PostDTO){
    const newDeletePOst = await this.postQuery.deletePost(post);
    return newDeletePOst;
  }
  public async getAllPosts(){
    const allPosts = await this.postQuery.getAllPosts();
    return allPosts;

  }
  public async getPostsByUserId(post:PostDTO){
    const  newPostById = await this.postQuery.getPostsByUserId(post);
    return newPostById;

  }
  public async updateCommentCount(post:PostDTO){
    const newCommentCount = await this.postQuery.updateCommentCount(post);
    return newCommentCount;
  }
}