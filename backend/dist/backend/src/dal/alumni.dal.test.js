"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alumni_dal_1 = require("./alumni.dal");
async function runTest() {
    console.log("Alumni DAL Test Starting...\n");
    console.log("Test 1: Creating Alumni...");
    const newAlumni = await (0, alumni_dal_1.createAlumni)({
        user_id: 1,
        graduation_year: 2020,
        department: "CSE",
        current_company: "CraftsMen",
        job_title: "Software Engineer",
        experience: "3 years",
        bio: "I am a software engineer",
        linkedin_url: "https://linkedin.com/in/farhan"
    });
    console.log(" Alumni Created:", newAlumni);
    console.log("\nTest 2: Finding Alumni by ID...");
    const foundById = await (0, alumni_dal_1.findAlumniById)(newAlumni.id);
    console.log("Alumni Found by ID:", foundById);
    console.log("\nTest 3: Finding Alumni by User ID...");
    const foundByUserId = await (0, alumni_dal_1.findAlumniByUserId)(1);
    console.log(" Alumni Found by User ID:", foundByUserId);
    console.log("\nTest 4: Getting All Alumni...");
    const allAlumni = await (0, alumni_dal_1.getAllAlumni)();
    console.log("All Alumni:", allAlumni);
    console.log("\nTest 5: Updating Alumni...");
    const updatedAlumni = await (0, alumni_dal_1.updateAlumni)(newAlumni.id, {
        job_title: "Senior Software Engineer",
        current_company: "Microsoft"
    });
    console.log(" Alumni Updated:", updatedAlumni);
    console.log("\nTest 6: Deleting Alumni...");
    await (0, alumni_dal_1.deleteAlumni)(newAlumni.id);
    console.log(" Alumni Deleted!");
    console.log("\nAlumni DAL Test Completed.");
    process.exit(0);
}
runTest().catch(console.error);
