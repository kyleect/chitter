-- Add up migration script here
CREATE TABLE Achievements (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL,
    is_earned BOOLEAN DEFAULT FALSE,
    earned_at TIMESTAMP NULL
);
