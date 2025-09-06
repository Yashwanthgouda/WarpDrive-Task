// Global variables
let currentStudent = null;
let colleges = [];
let students = [];
let events = [];
let myRegistrations = [];
let myAttendance = [];
let myFeedback = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadColleges();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // College selection change
    document.getElementById('college-select').addEventListener('change', function() {
        const collegeId = this.value;
        if (collegeId) {
            loadStudentsByCollege(collegeId);
            document.getElementById('student-select').disabled = false;
        } else {
            document.getElementById('student-select').disabled = true;
            document.getElementById('student-select').innerHTML = '<option value="">Select Student</option>';
            document.getElementById('load-profile-btn').disabled = true;
        }
    });

    // Student selection change
    document.getElementById('student-select').addEventListener('change', function() {
        const studentId = this.value;
        document.getElementById('load-profile-btn').disabled = !studentId;
    });

    // Event filter change
    document.querySelectorAll('input[name="event-filter"]').forEach(radio => {
        radio.addEventListener('change', function() {
            filterEvents();
        });
    });
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
            { id: 3, name: 'Business School', code: 'BS' },
            { id: 4, name: 'Medical College', code: 'MC' },
            { id: 5, name: 'Arts University', code: 'AU' }
        ];
        
        // Populate both college selects
        const collegeSelects = document.querySelectorAll('#college-select, #register-college');
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

// Register new student
async function registerNewStudent() {
    const studentData = {
        college_id: parseInt(document.getElementById('register-college').value),
        student_id: document.getElementById('register-student-id').value,
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        phone: document.getElementById('register-phone').value,
        year: document.getElementById('register-year').value,
        department: document.getElementById('register-department').value
    };
    
    // Validation
    if (!studentData.college_id || !studentData.student_id || !studentData.name || !studentData.email) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/students', 'POST', studentData);
        showMessage('Student registered successfully! You can now login.', 'success');
        
        // Reset form
        document.getElementById('student-register-form').reset();
        
        // Switch to login tab
        document.getElementById('login-tab').click();
        
        // Refresh students list for the selected college
        if (studentData.college_id) {
            await loadStudentsByCollege(studentData.college_id);
        }
        
    } catch (error) {
        console.error('Error registering student:', error);
    }
}

// Load Students by College
async function loadStudentsByCollege(collegeId) {
    try {
        const response = await apiCall(`/students?college_id=${collegeId}`);
        students = response.data;
        
        const studentSelect = document.getElementById('student-select');
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.student_id})`;
            studentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Load Student Profile
async function loadStudentProfile() {
    const studentId = document.getElementById('student-select').value;
    if (!studentId) return;
    
    try {
        const response = await apiCall(`/students/${studentId}`);
        currentStudent = response.data;
        
        // Update UI
        document.getElementById('student-name').textContent = `Welcome, ${currentStudent.name}!`;
        document.getElementById('student-info').textContent = `${currentStudent.student_id} • ${currentStudent.department || 'Student'}`;
        
        // Hide selection and show dashboard
        document.getElementById('student-selection').style.display = 'none';
        document.getElementById('student-dashboard').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        
        // Load student data
        await loadStudentData();
    } catch (error) {
        console.error('Error loading student profile:', error);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Reset all data
        currentStudent = null;
        events = [];
        myRegistrations = [];
        myAttendance = [];
        myFeedback = [];
        
        // Reset UI
        document.getElementById('student-name').textContent = 'Welcome, Student!';
        document.getElementById('student-info').textContent = 'Select your profile to get started';
        document.getElementById('student-selection').style.display = 'block';
        document.getElementById('student-dashboard').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        
        // Reset form
        document.getElementById('college-select').value = '';
        document.getElementById('student-select').innerHTML = '<option value="">Select Student</option>';
        document.getElementById('student-select').disabled = true;
        document.getElementById('load-profile-btn').disabled = true;
        
        showMessage('Logged out successfully!', 'success');
    }
}

// Load all student-related data
async function loadStudentData() {
    if (!currentStudent) return;
    
    try {
        await Promise.all([
            loadEvents(),
            loadMyRegistrations(),
            loadMyAttendance(),
            loadMyFeedback()
        ]);
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Load Events
async function loadEvents() {
    try {
        const response = await apiCall(`/events?college_id=${currentStudent.college_id}&status=active`);
        events = response.data;
        displayEvents(events);
    } catch (error) {
        document.getElementById('events-container').innerHTML = '<div class="alert alert-danger">Error loading events</div>';
    }
}

function displayEvents(eventsList) {
    const container = document.getElementById('events-container');
    
    if (eventsList.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No events available</div>';
        return;
    }
    
    container.innerHTML = eventsList.map(event => `
        <div class="col-md-6 col-lg-4">
            <div class="card event-card h-100">
                <div class="card-body position-relative">
                    <span class="badge bg-info event-type-badge">${event.event_type}</span>
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text text-muted">${event.description || 'No description available'}</p>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date(event.start_date).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(event.start_date).toLocaleTimeString()} - ${new Date(event.end_date).toLocaleTimeString()}
                        </small>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${event.location || 'TBD'}
                        </small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewEventDetails(${event.id})">
                            <i class="fas fa-eye me-1"></i>View Details
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="registerForEvent(${event.id})" id="register-btn-${event.id}">
                            <i class="fas fa-user-plus me-1"></i>Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update registration buttons based on current registrations
    updateRegistrationButtons();
}

function updateRegistrationButtons() {
    events.forEach(event => {
        const btn = document.getElementById(`register-btn-${event.id}`);
        if (btn) {
            const isRegistered = myRegistrations.some(reg => reg.event_id === event.id && reg.status === 'registered');
            const hasAttended = myAttendance.some(att => att.event_id === event.id && att.status === 'present');
            const hasFeedback = myFeedback.some(feedback => feedback.event_id === event.id);
            
            if (hasAttended && !hasFeedback) {
                // Show feedback button for attended events without feedback
                btn.innerHTML = '<i class="fas fa-comment me-1"></i>Give Feedback';
                btn.className = 'btn btn-warning btn-sm';
                btn.disabled = false;
                btn.onclick = () => showFeedbackModal(event.id, event.title);
            } else if (isRegistered) {
                btn.innerHTML = '<i class="fas fa-check me-1"></i>Registered';
                btn.className = 'btn btn-success btn-sm';
                btn.disabled = true;
            } else {
                btn.innerHTML = '<i class="fas fa-user-plus me-1"></i>Register';
                btn.className = 'btn btn-primary btn-sm';
                btn.disabled = false;
                btn.onclick = () => registerForEvent(event.id);
            }
        }
    });
}

// Filter Events
function filterEvents() {
    const selectedFilter = document.querySelector('input[name="event-filter"]:checked').id;
    let filteredEvents = events;
    
    if (selectedFilter !== 'all-events') {
        const eventType = selectedFilter.replace('-events', '').replace('-', '_');
        filteredEvents = events.filter(event => event.event_type === eventType);
    }
    
    displayEvents(filteredEvents);
}

// View Event Details
async function viewEventDetails(eventId) {
    try {
        const response = await apiCall(`/events/${eventId}`);
        const event = response.data;
        
        document.getElementById('eventModalTitle').textContent = event.title;
        document.getElementById('eventModalBody').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Event Details</h6>
                    <p><strong>Type:</strong> <span class="badge bg-info">${event.event_type}</span></p>
                    <p><strong>Start Date:</strong> ${new Date(event.start_date).toLocaleString()}</p>
                    <p><strong>End Date:</strong> ${new Date(event.end_date).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
                    ${event.max_participants ? `<p><strong>Max Participants:</strong> ${event.max_participants}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6>Description</h6>
                    <p>${event.description || 'No description available'}</p>
                </div>
            </div>
        `;
        
        // Update register button
        const registerBtn = document.getElementById('registerBtn');
        const isRegistered = myRegistrations.some(reg => reg.event_id === eventId && reg.status === 'registered');
        
        if (isRegistered) {
            registerBtn.innerHTML = '<i class="fas fa-check me-1"></i>Already Registered';
            registerBtn.className = 'btn btn-success';
            registerBtn.disabled = true;
        } else {
            registerBtn.innerHTML = '<i class="fas fa-user-plus me-1"></i>Register';
            registerBtn.className = 'btn btn-primary';
            registerBtn.disabled = false;
            registerBtn.onclick = () => registerForEvent(eventId);
        }
        
        new bootstrap.Modal(document.getElementById('eventModal')).show();
    } catch (error) {
        console.error('Error loading event details:', error);
    }
}

// Register for Event
async function registerForEvent(eventId) {
    if (!currentStudent) return;
    
    try {
        await apiCall('/registrations', 'POST', {
            event_id: eventId,
            student_id: currentStudent.id
        });
        
        showMessage('Successfully registered for the event!', 'success');
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
        if (modal) modal.hide();
        
        // Reload data
        await loadStudentData();
    } catch (error) {
        console.error('Error registering for event:', error);
    }
}

// Load My Registrations
async function loadMyRegistrations() {
    try {
        const response = await apiCall(`/registrations?student_id=${currentStudent.id}`);
        myRegistrations = response.data;
        displayMyRegistrations();
    } catch (error) {
        document.getElementById('my-registrations-container').innerHTML = '<div class="alert alert-danger">Error loading registrations</div>';
    }
}

function displayMyRegistrations() {
    const container = document.getElementById('my-registrations-container');
    
    if (myRegistrations.length === 0) {
        container.innerHTML = '<div class="alert alert-info">You have not registered for any events yet.</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${myRegistrations.map(registration => `
                        <tr>
                            <td>${registration.event_title}</td>
                            <td><span class="badge bg-info">${registration.event_type}</span></td>
                            <td>${new Date(registration.event_start_date).toLocaleDateString()}</td>
                            <td><span class="badge bg-${registration.status === 'registered' ? 'success' : 'secondary'}">${registration.status}</span></td>
                            <td>
                                ${registration.status === 'registered' ? 
                                    `<button class="btn btn-sm btn-outline-danger" onclick="cancelRegistration(${registration.id})">Cancel</button>` : 
                                    '<span class="text-muted">No actions available</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Cancel Registration
async function cancelRegistration(registrationId) {
    if (confirm('Are you sure you want to cancel this registration?')) {
        try {
            await apiCall(`/registrations/${registrationId}`, 'DELETE');
            showMessage('Registration cancelled successfully!', 'success');
            await loadStudentData();
        } catch (error) {
            console.error('Error cancelling registration:', error);
        }
    }
}

// Load My Attendance
async function loadMyAttendance() {
    try {
        const response = await apiCall(`/attendance?student_id=${currentStudent.id}`);
        myAttendance = response.data;
        displayMyAttendance();
    } catch (error) {
        document.getElementById('attendance-container').innerHTML = '<div class="alert alert-danger">Error loading attendance</div>';
    }
}

function displayMyAttendance() {
    const container = document.getElementById('attendance-container');
    
    if (myAttendance.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No attendance records found.</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Checked In</th>
                        <th>Status</th>
                        <th>Feedback</th>
                    </tr>
                </thead>
                <tbody>
                    ${myAttendance.map(record => {
                        const hasFeedback = myFeedback.some(feedback => feedback.event_id === record.event_id);
                        return `
                            <tr>
                                <td>${record.event_title}</td>
                                <td><span class="badge bg-info">${record.event_type}</span></td>
                                <td>${new Date(record.event_start_date).toLocaleDateString()}</td>
                                <td>${new Date(record.checked_in_at).toLocaleString()}</td>
                                <td><span class="badge bg-${record.status === 'present' ? 'success' : 'danger'}">${record.status}</span></td>
                                <td>
                                    ${hasFeedback ? 
                                        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Submitted</span>' :
                                        `<button class="btn btn-sm btn-outline-primary" onclick="showFeedbackModal(${record.event_id}, '${record.event_title}')">
                                            <i class="fas fa-comment me-1"></i>Give Feedback
                                        </button>`
                                    }
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load My Feedback
async function loadMyFeedback() {
    try {
        const response = await apiCall(`/feedback?student_id=${currentStudent.id}`);
        myFeedback = response.data;
        displayMyFeedback();
    } catch (error) {
        document.getElementById('feedback-container').innerHTML = '<div class="alert alert-danger">Error loading feedback</div>';
    }
}

function displayMyFeedback() {
    const container = document.getElementById('feedback-container');
    
    if (myFeedback.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No feedback submitted yet.</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Submitted</th>
                    </tr>
                </thead>
                <tbody>
                    ${myFeedback.map(feedback => `
                        <tr>
                            <td>${feedback.event_title}</td>
                            <td><span class="badge bg-info">${feedback.event_type}</span></td>
                            <td>
                                <div class="rating-stars">
                                    ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                                    <span class="ms-2">(${feedback.rating}/5)</span>
                                </div>
                            </td>
                            <td>${feedback.comment || 'No comment'}</td>
                            <td>${new Date(feedback.submitted_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Show Feedback Modal
function showFeedbackModal(eventId, eventTitle) {
    document.getElementById('feedbackEventId').value = eventId;
    document.getElementById('feedbackEventName').value = eventTitle;
    document.getElementById('feedbackForm').reset();
    new bootstrap.Modal(document.getElementById('feedbackModal')).show();
}

// Submit Feedback
async function submitFeedback() {
    const eventId = document.getElementById('feedbackEventId').value;
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('feedbackComment').value;
    
    if (!rating) {
        showMessage('Please select a rating', 'error');
        return;
    }
    
    try {
        await apiCall('/feedback', 'POST', {
            event_id: eventId,
            student_id: currentStudent.id,
            rating: parseInt(rating),
            comment: comment || null
        });
        
        showMessage('Feedback submitted successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('feedbackModal')).hide();
        await loadStudentData();
    } catch (error) {
        console.error('Error submitting feedback:', error);
    }
}

