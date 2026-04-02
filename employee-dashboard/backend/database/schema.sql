-- SQLite schema for Employee Dashboard

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin', -- Admin, Manager, Employee
    manager_id INTEGER,
    FOREIGN KEY (manager_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    joining_date TEXT NOT NULL -- SQLite stores dates as text
);

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    work_hours REAL,
    date TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    break_start TEXT NOT NULL,
    break_end TEXT,
    break_duration REAL,
    date TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER DEFAULT 0, -- in seconds
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Ongoing', -- Ongoing, Paused, Completed
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS break_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER DEFAULT 0, -- in seconds
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheduled_by INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (scheduled_by) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS meeting_assignments (
    meeting_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Upcoming', -- Upcoming, Ongoing, Completed
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    manager_id INTEGER,
    leave_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'In Progress', -- In Progress, Completed, Delayed
    progress INTEGER DEFAULT 0,
    manager_id INTEGER NOT NULL,
    FOREIGN KEY (manager_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);


