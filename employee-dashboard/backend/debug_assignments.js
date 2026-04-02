const { db } = require('./db');

async function check() {
    try {
        const users = await db.execute("SELECT id, name, role FROM users");
        console.log("USERS:", users.rows);

        const projects = await db.execute("SELECT * FROM projects");
        console.log("PROJECTS:", projects.rows);

        const projectAssignments = await db.execute("SELECT * FROM project_assignments");
        console.log("PROJECT ASSIGNMENTS:", projectAssignments.rows);

        const tasks = await db.execute("SELECT * FROM tasks");
        console.log("TASKS:", tasks.rows);

        const taskAssignments = await db.execute("SELECT * FROM task_assignments");
        console.log("TASK ASSIGNMENTS:", taskAssignments.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
