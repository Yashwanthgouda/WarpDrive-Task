# Database Schema Design

## Overview
The Campus Event Management Platform uses a relational database design with SQLite to store data for multiple colleges, students, events, and related information.

## Entity Relationship Diagram

```
┌─────────────┐
│   Colleges  │
├─────────────┤
│ id (PK)     │
│ name        │
│ code        │
│ created_at  │
└─────────────┘
       │
       │ 1:N
       │
┌─────────────┐
│   Students  │
├─────────────┤
│ id (PK)     │
│ college_id  │ (FK)
│ student_id  │
│ name        │
│ email       │
│ phone       │
│ year        │
│ department  │
│ created_at  │
└─────────────┘
       │
       │ 1:N
       │
┌─────────────┐
│    Events   │
├─────────────┤
│ id (PK)     │
│ college_id  │ (FK)
│ title       │
│ description │
│ event_type  │
│ start_date  │
│ end_date    │
│ location    │
│ max_participants│
│ status      │
│ created_by  │
│ created_at  │
└─────────────┘
       │
       │ 1:N
       │
┌─────────────┐
│Registrations│
├─────────────┤
│ id (PK)     │
│ event_id    │ (FK)
│ student_id  │ (FK)
│ registered_at│
│ status      │
└─────────────┘
       │
       │ 1:1
       │
┌─────────────┐
│ Attendance  │
├─────────────┤
│ id (PK)     │
│ event_id    │ (FK)
│ student_id  │ (FK)
│ checked_in_at│
│ status      │
└─────────────┘
       │
       │ 1:1
       │
┌─────────────┐
│  Feedback   │
├─────────────┤
│ id (PK)     │
│ event_id    │ (FK)
│ student_id  │ (FK)
│ rating      │
│ comment     │
│ submitted_at│
└─────────────┘
```

## Table Descriptions

### 1. Colleges
- **Purpose**: Store information about different colleges
- **Key Fields**: 
  - `id`: Primary key
  - `name`: College name
  - `code`: Unique college code
- **Relationships**: One-to-many with Students and Events

### 2. Students
- **Purpose**: Store student information for each college
- **Key Fields**:
  - `id`: Primary key
  - `college_id`: Foreign key to Colleges
  - `student_id`: Unique student ID within college
  - `name`, `email`, `phone`: Contact information
  - `year`, `department`: Academic information
- **Relationships**: Many-to-many with Events through Registrations

### 3. Events
- **Purpose**: Store event information created by college staff
- **Key Fields**:
  - `id`: Primary key
  - `college_id`: Foreign key to Colleges
  - `title`, `description`: Event details
  - `event_type`: Type of event (hackathon, workshop, etc.)
  - `start_date`, `end_date`: Event timing
  - `location`: Event venue
  - `max_participants`: Capacity limit
  - `status`: Event status (active, cancelled, completed)
- **Relationships**: Many-to-many with Students through Registrations

### 4. Registrations
- **Purpose**: Track student registrations for events
- **Key Fields**:
  - `id`: Primary key
  - `event_id`: Foreign key to Events
  - `student_id`: Foreign key to Students
  - `registered_at`: Registration timestamp
  - `status`: Registration status
- **Constraints**: Unique constraint on (event_id, student_id)

### 5. Attendance
- **Purpose**: Track student attendance at events
- **Key Fields**:
  - `id`: Primary key
  - `event_id`: Foreign key to Events
  - `student_id`: Foreign key to Students
  - `checked_in_at`: Check-in timestamp
  - `status`: Attendance status (present, absent)
- **Constraints**: Unique constraint on (event_id, student_id)

### 6. Feedback
- **Purpose**: Store student feedback for events
- **Key Fields**:
  - `id`: Primary key
  - `event_id`: Foreign key to Events
  - `student_id`: Foreign key to Students
  - `rating`: Rating from 1-5
  - `comment`: Optional text feedback
  - `submitted_at`: Feedback submission timestamp
- **Constraints**: Unique constraint on (event_id, student_id), rating between 1-5

## Design Decisions

### 1. Multi-College Support
- Each college has its own students and events
- College-specific student IDs (student_id is unique within college)
- Events are scoped to colleges

### 2. Event Management
- Events have types (hackathon, workshop, tech talk, fest, seminar)
- Events can have capacity limits
- Events have status tracking (active, cancelled, completed)

### 3. Registration & Attendance
- Students must register before attending
- Attendance is tracked separately from registration
- One registration and one attendance record per student per event

### 4. Feedback System
- Optional feedback with 1-5 rating scale
- Text comments are optional
- One feedback per student per event

### 5. Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate registrations/attendance/feedback
- Check constraints validate rating values

## Scalability Considerations

For the given scale (50 colleges × 500 students × 20 events per semester):
- Total students: ~25,000
- Total events: ~1,000 per semester
- Total registrations: ~50,000 per semester
- Database size: Estimated < 100MB per semester

The design supports this scale efficiently with proper indexing on foreign keys and frequently queried fields.
