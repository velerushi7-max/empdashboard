const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://emp-dashboard-velerushi7-max.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ4NDczNDUsImlkIjoiMDE5ZDFhNmQtNTcwMS03NTExLWFiZDUtMDE2OGVjOTYxMGM5IiwicmlkIjoiMDllMjYzMWEtMTk0My00MTMzLWEyZjQtMmExMTM2MWUxYjY0In0.7YVr8SH_Xb3U5xCCes2dBL0bqIAoJD4AtKtY7gKIUjckbI9YrrtI_OdfJe_ZoqoN9nTU-LUt3-L6CfqQF1sAAg',
});

async function addAllowances() {
    console.log("--- ADDING ALLOWANCES COLUMN (Hardcoded) ---");
    try {
        await db.execute("ALTER TABLE payroll ADD COLUMN allowances INTEGER DEFAULT 0");
        console.log("Column added successfully");
    } catch (err) {
        if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
            console.log("Column already exists");
        } else {
            console.error("Migration error:", err.message);
        }
    }
}
addAllowances();
