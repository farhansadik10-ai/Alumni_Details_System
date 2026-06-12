"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_dal_1 = require("./user.dal");
async function runTest() {
    console.log("User DAL Test stating...\n");
    console.log("Test 1: Creating User");
    const newUser = await (0, user_dal_1.createUser)({
        name: "Farhan Sadik Chowdhury",
        email: "fsadik906@gamil.com",
        password: "123456",
        role: "Student"
    });
    console.log("Created User:", newUser);
    console.log("Test 2: Finding User by Email");
    const userByEmail = await (0, user_dal_1.findUserByEmail)("fsadik906@gamil.com");
    console.log("Found User by Email:", userByEmail);
    console.log("Test 3: Finding User by ID");
    const userById = await (0, user_dal_1.findUserById)(newUser.id);
    console.log("Found User by ID:", userById);
    console.log("Test 4: Getting All users");
    const allUsers = await (0, user_dal_1.getAllUsers)();
    console.log("ALL Users:", allUsers);
    console.log("Test 5: Deleting User");
    await (0, user_dal_1.deleteUser)(newUser.id);
    console.log("User Deleted");
    console.log("\nUser DAL Test Completed.");
    process.exit(0);
}
runTest().catch(console.error);
