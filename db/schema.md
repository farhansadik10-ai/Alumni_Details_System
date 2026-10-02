# Database schema

Output of the `psql` commands from bolt B8 (`\dt`, `\d "User"`, `\d users`, `\d alumni`, `\d posts`, `\d comment`, `\d comments`), run by the owner on 2026-10-02 against the database in the root `.env`. Saved unchanged.

```text
           List of tables
 Schema |  Name   | Type  |  Owner   
--------+---------+-------+----------
 public | User    | table | postgres
 public | alumni  | table | postgres
 public | comment | table | postgres
 public | posts   | table | postgres
(4 rows)

                                         Table "public.User"
   Column   |            Type             | Collation | Nullable |              Default               
------------+-----------------------------+-----------+----------+------------------------------------
 id         | integer                     |           | not null | nextval('"User_id_seq"'::regclass)
 name       | character varying(100)      |           |          | 
 email      | character varying(100)      |           | not null | 
 password   | character varying(255)      |           | not null | 
 role       | character varying(50)       |           |          | 
 photo_url  | text                        |           |          | 
 login_at   | timestamp without time zone |           |          | 
 logout_at  | timestamp without time zone |           |          | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "User_pkey" PRIMARY KEY, btree (id)
    "User_email_key" UNIQUE CONSTRAINT, btree (email)
Referenced by:
    TABLE "alumni" CONSTRAINT "alumni_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)
    TABLE "comment" CONSTRAINT "comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)
    TABLE "posts" CONSTRAINT "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)

Did not find any relation named "users".
                                           Table "public.alumni"
     Column      |            Type             | Collation | Nullable |              Default               
-----------------+-----------------------------+-----------+----------+------------------------------------
 id              | integer                     |           | not null | nextval('alumni_id_seq'::regclass)
 user_id         | integer                     |           |          | 
 graduation_year | integer                     |           |          | 
 department      | character varying(100)      |           |          | 
 current_company | character varying(100)      |           |          | 
 job_title       | character varying(100)      |           |          | 
 experience      | character varying(100)      |           |          | 
 bio             | text                        |           |          | 
 linkedin_url    | text                        |           |          | 
 updated_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "alumni_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "alumni_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)

                                          Table "public.posts"
    Column     |            Type             | Collation | Nullable |              Default              
---------------+-----------------------------+-----------+----------+-----------------------------------
 id            | integer                     |           | not null | nextval('posts_id_seq'::regclass)
 user_id       | integer                     |           |          | 
 caption       | text                        |           |          | 
 media_url     | text                        |           |          | 
 comment_count | integer                     |           |          | 0
 created_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at    | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "posts_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)
Referenced by:
    TABLE "comment" CONSTRAINT "comment_posts_id_fkey" FOREIGN KEY (posts_id) REFERENCES posts(id)

                                        Table "public.comment"
   Column   |            Type             | Collation | Nullable |               Default               
------------+-----------------------------+-----------+----------+-------------------------------------
 id         | integer                     |           | not null | nextval('comment_id_seq'::regclass)
 user_id    | integer                     |           |          | 
 posts_id   | integer                     |           |          | 
 parent_id  | integer                     |           |          | 
 content    | text                        |           |          | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "comment_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "comment_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES comment(id)
    "comment_posts_id_fkey" FOREIGN KEY (posts_id) REFERENCES posts(id)
    "comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"(id)
Referenced by:
    TABLE "comment" CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES comment(id)

Did not find any relation named "comments".
```
