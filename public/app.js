// Global variables
let colleges = [];
let events = [];
let students = [];
let registrations = [];
let attendance = [];
let feedback = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadColleges();
    loadDashboard();
    loadEvents();
    loadStudents();
    loadRegistrations();
    loadAttendance();
    loadFeedback();
});

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api${endpoint}`, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showMessage('Error: ' + error.message, 'error');
        throw error;
    }
}

// Message display function
function showMessage(message, type = 'info') {
    // Create a simple alert for now
    alert(message);
}

// Load Colleges
async function loadColleges() {
    try {
        // For demo purposes, we'll create some sample colleges
        colleges = [
            { id: 1, name: 'Tech University', code: 'TU' },
            { id: 2, name: 'Engineering College', code: 'EC' },
            { id: 3, name: 'Business School', code: 'BS' }
        ];
        
        // Populate college dropdowns
        const collegeSelects = document.querySelectorAll('#eventCollege, #studentCollege');
        collegeSelects.forEach(select => {
            select.innerHTML = '<option value="">Select College</option>';
            colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.id;
                option.textContent = college.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        // Load statistics
        const [eventsRes, studentsRes, registrationsRes, attendanceRes] = await Promise.all([
            apiCall('/events'),
            apiCall('/students'),
            apiCall('/registrations'),
            apiCall('/attendance')
        ]);
        
        document.getElementById('total-events').textContent = eventsRes.data.length;
        document.getElementById('total-students').textContent = studentsRes.data.length;
        document.getElementById('total-registrations').textContent = registrationsRes.data.length;
        document.getElementById('total-attendance').textContent = attendanceRes.data.length;
        
        // Load recent events
        loadRecentEvents();
        
        // Load top students
        loadTopStudents();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadRecentEvents() {
    try {
        const response = await apiCall('/events?limit=5');
        const events = response.data;
        
        const container = document.getElementById('recent-events');
        if (events.length === 0) {
            container.innerHTML = '<p class="text-muted">No events found</p>';
            return;
        }
        
        container.innerHTML = events.map(event => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h6 class="mb-0">${event.title}</h6>
                    <small class="text-muted">${event.event_type} • ${new Date(event.start_date).toLocaleDateString()}</small>
                </div>
                <span class="badge bg-${event.status === 'active' ? 'success' : 'secondary'}">${event.status}</span>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('recent-events').innerHTML = '<p class="text-danger">Error loading events</p>';
    }
}

async function loadTopStudents() {
    try {
        const response = await apiCall('/reports/top-active-students?limit=3');
        const students = response.data;
        
        const container = document.getElementById('top-students');
        if (students.length === 0) {
            container.innerHTML = '<p class="text-muted">No students found</p>';
            return;
        }
        
        container.innerHTML = students.map((student, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h6 class="mb-0">${index + 1}. ${student.name}</h6>
                    <small class="text-muted">${student.total_registrations} registrations • ${student.total_attendance} attended</small>
                </div>
                <span class="badge bg-primary">${student.activity_score} pts</span>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('top-students').innerHTML = '<p class="text-danger">Error loading students</p>';
    }
}

// Events Functions
async function loadEvents() {
    try {
        const response = await apiCall('/events');
        events = response.data;
        displayEvents(events);
    } catch (error) {
        document.getElementById('events-table').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading events</td></tr>';
    }
}

function displayEvents(eventsList) {
    const tbody = document.getElementById('events-table');
    if (eventsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No events found</td></tr>';
        return;
    }
    
    tbody.innerHTML = eventsList.map(event => `
        <tr>
            <td>${event.title}</td>
            <td><span class="badge bg-info">${event.event_type}</span></td>
            <td>${new Date(event.start_date).toLocaleDateString()}</td>
            <td>${event.location || 'TBD'}</td>
            <td><span class="badge bg-${event.status === 'active' ? 'success' : 'secondary'}">${event.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${event.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${event.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showEventForm() {
    document.getElementById('eventForm').reset();
    new bootstrap.Modal(document.getElementById('eventModal')).show();
}

async function saveEvent() {
    try {
        const eventData = {
            college_id: parseInt(document.getElementById('eventCollege').value),
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            event_type: document.getElementById('eventType').value,
            start_date: document.getElementById('eventStartDate').value,
            end_date: document.getElementById('eventEndDate').value,
            location: document.getElementById('eventLocation').value,
            max_participants: parseInt(document.getElementById('eventMaxParticipants').value) || null,
            created_by: 'admin@college.edu'
        };
        
        await apiCall('/events', 'POST', eventData);
        showMessage('Event created successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        loadEvents();
        loadDashboard();
    } catch (error) {
        console.error('Error creating event:', error);
    }
}

async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await apiCall(`/events/${eventId}`, 'DELETE');
            showMessage('Event deleted successfully!', 'success');
            loadEvents();
            loadDashboard();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    }
}

// Students Functions
async function loadStudents() {
    try {
        const response = await apiCall('/students');
        students = response.data;
        displayStudents(students);
    } catch (error) {
        document.getElementById('students-table').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading students</td></tr>';
    }
}

function displayStudents(studentsList) {
    const tbody = document.getElementById('students-table');
    if (studentsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = studentsList.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.student_id}</td>
            <td>${student.email}</td>
            <td>${student.year || 'N/A'}</td>
            <td>${student.department || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editStudent(${student.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showStudentForm() {
    document.getElementById('studentForm').reset();
    new bootstrap.Modal(document.getElementById('studentModal')).show();
}

async function saveStudent() {
    try {
        const studentData = {
            college_id: parseInt(document.getElementById('studentCollege').value),
            student_id: document.getElementById('studentId').value,
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            year: document.getElementById('studentYear').value,
            department: document.getElementById('studentDepartment').value
        };
        
        await apiCall('/students', 'POST', studentData);
        showMessage('Student added successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
        loadStudents();
        loadDashboard();
    } catch (error) {
        console.error('Error creating student:', error);
    }
}

async function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await apiCall(`/students/${studentId}`, 'DELETE');
            showMessage('Student deleted successfully!', 'success');
            loadStudents();
            loadDashboard();
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    }
}

// Registrations Functions
async function loadRegistrations() {
    try {
        const response = await apiCall('/registrations');
        registrations = response.data;
        displayRegistrations(registrations);
    } catch (error) {
        document.getElementById('registrations-table').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading registrations</td></tr>';
    }
}

function displayRegistrations(registrationsList) {
    const tbody = document.getElementById('registrations-table');
    if (registrationsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No registrations found</td></tr>';
        return;
    }
    
    tbody.innerHTML = registrationsList.map(registration => `
        <tr>
            <td>${registration.student_name} (${registration.student_number})</td>
            <td>${registration.event_title}</td>
            <td>${new Date(registration.registered_at).toLocaleDateString()}</td>
            <td><span class="badge bg-${registration.status === 'registered' ? 'success' : 'secondary'}">${registration.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelRegistration(${registration.id})">Cancel</button>
            </td>
        </tr>
    `).join('');
}

async function cancelRegistration(registrationId) {
    if (confirm('Are you sure you want to cancel this registration?')) {
        try {
            await apiCall(`/registrations/${registrationId}`, 'DELETE');
            showMessage('Registration cancelled successfully!', 'success');
            loadRegistrations();
            loadDashboard();
        } catch (error) {
            console.error('Error cancelling registration:', error);
        }
    }
}

// Attendance Functions
async function loadAttendance() {
    try {
        const response = await apiCall('/attendance');
        attendance = response.data;
        displayAttendance(attendance);
        loadAttendanceEvents();
    } catch (error) {
        document.getElementById('attendance-table').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading attendance</td></tr>';
    }
}

// Load events for attendance marking
async function loadAttendanceEvents() {
    try {
        const response = await apiCall('/events');
        const eventsList = response.data;
        
        const eventSelect = document.getElementById('attendance-event-select');
        const markEventSelect = document.getElementById('mark-attendance-event-select');
        
        // Clear and populate both selects
        eventSelect.innerHTML = '<option value="">Select Event to View Registered Students</option>';
        markEventSelect.innerHTML = '<option value="">Select Event</option>';
        
        eventsList.forEach(event => {
            const optionText = `${event.title} (${event.event_type}) - ${new Date(event.start_date).toLocaleDateString()}`;
            
            // For viewing registered students
            const option1 = document.createElement('option');
            option1.value = event.id;
            option1.textContent = optionText;
            eventSelect.appendChild(option1);
            
            // For marking attendance
            const option2 = document.createElement('option');
            option2.value = event.id;
            option2.textContent = optionText;
            markEventSelect.appendChild(option2);
        });
        
        // Add event listener for mark attendance event selection
        markEventSelect.addEventListener('change', function() {
            const eventId = this.value;
            if (eventId) {
                loadRegisteredStudentsForEvent(eventId);
            } else {
                document.getElementById('attendance-student-select').innerHTML = '<option value="">Select Student</option>';
                document.getElementById('attendance-student-select').disabled = true;
            }
        });
    } catch (error) {
        console.error('Error loading events for attendance:', error);
    }
}

// Load registered students for selected event
async function loadRegisteredStudentsForEvent(eventId) {
    try {
        const response = await apiCall(`/registrations?event_id=${eventId}&status=registered`);
        const registrations = response.data;
        
        const studentSelect = document.getElementById('attendance-student-select');
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        
        if (registrations.length === 0) {
            studentSelect.innerHTML = '<option value="">No registered students</option>';
            studentSelect.disabled = true;
            return;
        }
        
        registrations.forEach(registration => {
            const option = document.createElement('option');
            option.value = registration.student_id;
            option.textContent = `${registration.student_name} (${registration.student_number})`;
            studentSelect.appendChild(option);
        });
        
        studentSelect.disabled = false;
    } catch (error) {
        console.error('Error loading registered students:', error);
    }
}

// Load registered students for attendance viewing
async function loadRegisteredStudentsForAttendance() {
    const eventId = document.getElementById('attendance-event-select').value;
    
    if (!eventId) {
        document.getElementById('registered-students-card').style.display = 'none';
        return;
    }
    
    try {
        // Get registered students
        const registrationsResponse = await apiCall(`/registrations?event_id=${eventId}&status=registered`);
        const registrations = registrationsResponse.data;
        
        // Get attendance records for this event
        const attendanceResponse = await apiCall(`/attendance?event_id=${eventId}`);
        const attendanceRecords = attendanceResponse.data;
        
        // Create a map of student attendance status
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.student_id] = record.status;
        });
        
        const tbody = document.getElementById('registered-students-table');
        
        if (registrations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No registered students for this event</td></tr>';
        } else {
            tbody.innerHTML = registrations.map(registration => {
                const attendanceStatus = attendanceMap[registration.student_id] || 'Not Marked';
                const statusBadge = attendanceStatus === 'present' ? 
                    '<span class="badge bg-success">Present</span>' : 
                    attendanceStatus === 'absent' ? 
                    '<span class="badge bg-danger">Absent</span>' : 
                    '<span class="badge bg-warning">Not Marked</span>';
                
                return `
                    <tr>
                        <td>${registration.student_name}</td>
                        <td>${registration.student_number}</td>
                        <td>${registration.college_name}</td>
                        <td>${new Date(registration.registered_at).toLocaleDateString()}</td>
                        <td>${statusBadge}</td>
                        <td>
                            ${attendanceStatus === 'Not Marked' ? 
                                `<button class="btn btn-sm btn-primary" onclick="quickMarkAttendance(${registration.student_id}, '${registration.student_name}', 'present')">
                                    <i class="fas fa-check me-1"></i>Present
                                </button>
                                <button class="btn btn-sm btn-danger ms-1" onclick="quickMarkAttendance(${registration.student_id}, '${registration.student_name}', 'absent')">
                                    <i class="fas fa-times me-1"></i>Absent
                                </button>` :
                                `<button class="btn btn-sm btn-outline-secondary" onclick="updateAttendance(${registration.student_id}, '${registration.student_name}', '${attendanceStatus}')">
                                    <i class="fas fa-edit me-1"></i>Update
                                </button>`
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        document.getElementById('registered-students-card').style.display = 'block';
    } catch (error) {
        console.error('Error loading registered students for attendance:', error);
        document.getElementById('registered-students-table').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading data</td></tr>';
    }
}

// Show mark attendance form
function showMarkAttendanceForm() {
    document.getElementById('mark-attendance-form').style.display = 'block';
    loadAttendanceEvents();
}

// Hide mark attendance form
function hideMarkAttendanceForm() {
    document.getElementById('mark-attendance-form').style.display = 'none';
    document.getElementById('attendance-event-select').value = '';
    document.getElementById('attendance-student-select').innerHTML = '<option value="">Select Student</option>';
    document.getElementById('attendance-student-select').disabled = true;
    document.getElementById('attendance-status').value = 'present';
}

// Mark attendance
async function markAttendance() {
    const eventId = document.getElementById('mark-attendance-event-select').value;
    const studentId = document.getElementById('attendance-student-select').value;
    const status = document.getElementById('attendance-status').value;
    
    if (!eventId || !studentId) {
        showMessage('Please select both event and student', 'error');
        return;
    }
    
    try {
        await apiCall('/attendance', 'POST', {
            event_id: eventId,
            student_id: studentId,
            status: status
        });
        
        showMessage('Attendance marked successfully!', 'success');
        hideMarkAttendanceForm();
        loadAttendance();
        loadDashboard();
        
        // Refresh the registered students list if viewing an event
        const currentEventId = document.getElementById('attendance-event-select').value;
        if (currentEventId) {
            loadRegisteredStudentsForAttendance();
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
    }
}

// Quick mark attendance from the registered students table
async function quickMarkAttendance(studentId, studentName, status) {
    const eventId = document.getElementById('attendance-event-select').value;
    
    if (!eventId) {
        showMessage('Please select an event first', 'error');
        return;
    }
    
    try {
        await apiCall('/attendance', 'POST', {
            event_id: eventId,
            student_id: studentId,
            status: status
        });
        
        showMessage(`Attendance marked as ${status} for ${studentName}!`, 'success');
        loadAttendance();
        loadDashboard();
        loadRegisteredStudentsForAttendance(); // Refresh the list
    } catch (error) {
        console.error('Error marking attendance:', error);
    }
}

// Update attendance status
async function updateAttendance(studentId, studentName, currentStatus) {
    const eventId = document.getElementById('attendance-event-select').value;
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    
    if (!eventId) {
        showMessage('Please select an event first', 'error');
        return;
    }
    
    try {
        await apiCall('/attendance', 'POST', {
            event_id: eventId,
            student_id: studentId,
            status: newStatus
        });
        
        showMessage(`Attendance updated to ${newStatus} for ${studentName}!`, 'success');
        loadAttendance();
        loadDashboard();
        loadRegisteredStudentsForAttendance(); // Refresh the list
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
}

function displayAttendance(attendanceList) {
    const tbody = document.getElementById('attendance-table');
    if (attendanceList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No attendance records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = attendanceList.map(record => `
        <tr>
            <td>${record.student_name} (${record.student_number})</td>
            <td>${record.event_title}</td>
            <td>${new Date(record.checked_in_at).toLocaleDateString()}</td>
            <td><span class="badge bg-${record.status === 'present' ? 'success' : 'danger'}">${record.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="updateAttendance(${record.id}, '${record.status === 'present' ? 'absent' : 'present'}')">
                    Mark ${record.status === 'present' ? 'Absent' : 'Present'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateAttendance(attendanceId, newStatus) {
    try {
        await apiCall(`/attendance/${attendanceId}`, 'PUT', { status: newStatus });
        showMessage('Attendance updated successfully!', 'success');
        loadAttendance();
        loadDashboard();
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
}

// Feedback Functions
async function loadFeedback() {
    try {
        const response = await apiCall('/feedback');
        feedback = response.data;
        displayFeedback(feedback);
    } catch (error) {
        document.getElementById('feedback-table').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading feedback</td></tr>';
    }
}

function displayFeedback(feedbackList) {
    const tbody = document.getElementById('feedback-table');
    if (feedbackList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No feedback found</td></tr>';
        return;
    }
    
    tbody.innerHTML = feedbackList.map(feedback => `
        <tr>
            <td>${feedback.student_name} (${feedback.student_number})</td>
            <td>${feedback.event_title}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                    <span class="ms-2">(${feedback.rating}/5)</span>
                </div>
            </td>
            <td>${feedback.comment || 'No comment'}</td>
            <td>${new Date(feedback.submitted_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Reports Functions
async function generateEventPopularityReport() {
    try {
        const response = await apiCall('/reports/event-popularity');
        const report = response.data;
        
        const container = document.getElementById('event-popularity-report');
        if (report.length === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Type</th>
                            <th>Registrations</th>
                            <th>Attendance</th>
                            <th>Attendance %</th>
                            <th>Avg Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.map(event => `
                            <tr>
                                <td>${event.title}</td>
                                <td><span class="badge bg-info">${event.event_type}</span></td>
                                <td>${event.total_registrations}</td>
                                <td>${event.total_attendance}</td>
                                <td>${event.attendance_percentage || 0}%</td>
                                <td>${event.average_rating || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('event-popularity-report').innerHTML = '<p class="text-danger">Error generating report</p>';
    }
}

async function generateStudentParticipationReport() {
    try {
        const response = await apiCall('/reports/student-participation');
        const report = response.data;
        
        const container = document.getElementById('student-participation-report');
        if (report.length === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Registrations</th>
                            <th>Attendance</th>
                            <th>Attendance %</th>
                            <th>Feedback Given</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.map(student => `
                            <tr>
                                <td>${student.name} (${student.student_number})</td>
                                <td>${student.total_registrations}</td>
                                <td>${student.total_attendance}</td>
                                <td>${student.attendance_percentage || 0}%</td>
                                <td>${student.total_feedback}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('student-participation-report').innerHTML = '<p class="text-danger">Error generating report</p>';
    }
}

async function generateTopActiveStudentsReport() {
    try {
        const response = await apiCall('/reports/top-active-students?limit=5');
        const report = response.data;
        
        const container = document.getElementById('top-active-students-report');
        if (report.length === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Student</th>
                            <th>Activity Score</th>
                            <th>Registrations</th>
                            <th>Attendance</th>
                            <th>Feedback</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.map((student, index) => `
                            <tr>
                                <td><span class="badge bg-primary">${index + 1}</span></td>
                                <td>${student.name} (${student.student_number})</td>
                                <td><strong>${student.activity_score}</strong></td>
                                <td>${student.total_registrations}</td>
                                <td>${student.total_attendance}</td>
                                <td>${student.total_feedback}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('top-active-students-report').innerHTML = '<p class="text-danger">Error generating report</p>';
    }
}

async function generateEventTypeAnalysisReport() {
    try {
        const response = await apiCall('/reports/event-type-analysis');
        const report = response.data;
        
        const container = document.getElementById('event-type-analysis-report');
        if (report.length === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Event Type</th>
                            <th>Total Events</th>
                            <th>Participants</th>
                            <th>Attendees</th>
                            <th>Attendance %</th>
                            <th>Avg Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.map(type => `
                            <tr>
                                <td><span class="badge bg-info">${type.event_type}</span></td>
                                <td>${type.total_events}</td>
                                <td>${type.total_participants}</td>
                                <td>${type.total_attendees}</td>
                                <td>${type.attendance_percentage || 0}%</td>
                                <td>${type.average_rating || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('event-type-analysis-report').innerHTML = '<p class="text-danger">Error generating report</p>';
    }
}
