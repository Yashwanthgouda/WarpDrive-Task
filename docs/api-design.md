# API Design Documentation

## Overview
The Campus Event Management Platform provides RESTful APIs for managing events, student registrations, attendance tracking, and feedback collection.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not implement authentication. In a production environment, JWT tokens or session-based authentication would be implemented.

## API Endpoints

### 1. Events Management

#### GET /api/events
Get all events with optional filtering
- **Query Parameters**:
  - `college_id` (optional): Filter by college
  - `event_type` (optional): Filter by event type
  - `status` (optional): Filter by status
  - `page` (optional): Page number for pagination
  - `limit` (optional): Items per page

#### GET /api/events/:id
Get specific event details
- **Path Parameters**:
  - `id`: Event ID

#### POST /api/events
Create a new event
- **Request Body**:
```json
{
  "college_id": 1,
  "title": "Tech Hackathon 2024",
  "description": "Annual coding competition",
  "event_type": "hackathon",
  "start_date": "2024-09-15T09:00:00Z",
  "end_date": "2024-09-16T18:00:00Z",
  "location": "Main Auditorium",
  "max_participants": 100,
  "created_by": "admin@college.edu"
}
```

#### PUT /api/events/:id
Update an event
- **Path Parameters**:
  - `id`: Event ID
- **Request Body**: Same as POST /api/events

#### DELETE /api/events/:id
Delete an event
- **Path Parameters**:
  - `id`: Event ID

### 2. Student Management

#### GET /api/students
Get all students with optional filtering
- **Query Parameters**:
  - `college_id` (optional): Filter by college
  - `year` (optional): Filter by academic year
  - `department` (optional): Filter by department

#### GET /api/students/:id
Get specific student details
- **Path Parameters**:
  - `id`: Student ID

#### POST /api/students
Register a new student
- **Request Body**:
```json
{
  "college_id": 1,
  "student_id": "STU001",
  "name": "John Doe",
  "email": "john.doe@college.edu",
  "phone": "+1234567890",
  "year": "2024",
  "department": "Computer Science"
}
```

### 3. Event Registration

#### GET /api/registrations
Get all registrations with optional filtering
- **Query Parameters**:
  - `event_id` (optional): Filter by event
  - `student_id` (optional): Filter by student
  - `status` (optional): Filter by registration status

#### POST /api/registrations
Register a student for an event
- **Request Body**:
```json
{
  "event_id": 1,
  "student_id": 1
}
```

#### DELETE /api/registrations/:id
Cancel a registration
- **Path Parameters**:
  - `id`: Registration ID

### 4. Attendance Management

#### GET /api/attendance
Get attendance records with optional filtering
- **Query Parameters**:
  - `event_id` (optional): Filter by event
  - `student_id` (optional): Filter by student
  - `date` (optional): Filter by date

#### POST /api/attendance
Mark student attendance
- **Request Body**:
```json
{
  "event_id": 1,
  "student_id": 1,
  "status": "present"
}
```

### 5. Feedback Management

#### GET /api/feedback
Get feedback records with optional filtering
- **Query Parameters**:
  - `event_id` (optional): Filter by event
  - `student_id` (optional): Filter by student

#### POST /api/feedback
Submit feedback for an event
- **Request Body**:
```json
{
  "event_id": 1,
  "student_id": 1,
  "rating": 4,
  "comment": "Great event, learned a lot!"
}
```

### 6. Reports

#### GET /api/reports/event-popularity
Get event popularity report
- **Query Parameters**:
  - `college_id` (optional): Filter by college
  - `event_type` (optional): Filter by event type
  - `limit` (optional): Number of top events to return

#### GET /api/reports/student-participation
Get student participation report
- **Query Parameters**:
  - `college_id` (optional): Filter by college
  - `student_id` (optional): Get specific student's participation

#### GET /api/reports/attendance-summary
Get attendance summary for events
- **Query Parameters**:
  - `event_id` (optional): Filter by specific event
  - `college_id` (optional): Filter by college

#### GET /api/reports/feedback-summary
Get feedback summary for events
- **Query Parameters**:
  - `event_id` (optional): Filter by specific event
  - `college_id` (optional): Filter by college

#### GET /api/reports/top-active-students
Get top 3 most active students
- **Query Parameters**:
  - `college_id` (optional): Filter by college
  - `limit` (optional): Number of top students (default: 3)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## HTTP Status Codes

- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., duplicate registration)
- `500 Internal Server Error`: Server error

## Rate Limiting
Currently not implemented. In production, rate limiting should be added to prevent abuse.

## CORS
CORS is enabled for all origins during development. In production, specific origins should be configured.

## Data Validation
- All required fields are validated
- Email format validation
- Date format validation (ISO 8601)
- Rating validation (1-5 range)
- Unique constraint validation

## Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- Database constraint violations are handled gracefully
- Input validation errors are returned with details
