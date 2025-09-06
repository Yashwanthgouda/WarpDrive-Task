const { initDatabase, getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
    // Initialize database first
    await initDatabase();
    const db = getDatabase();
    
    console.log('🌱 Starting to seed database...');
    
    try {
        // Insert colleges
        console.log('📚 Inserting colleges...');
        const colleges = [
            { name: 'Tech University', code: 'TU' },
            { name: 'Engineering College', code: 'EC' },
            { name: 'Business School', code: 'BS' },
            { name: 'Medical College', code: 'MC' },
            { name: 'Arts University', code: 'AU' }
        ];
        
        for (const college of colleges) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR IGNORE INTO colleges (name, code) VALUES (?, ?)',
                    [college.name, college.code],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // Insert students
        console.log('👥 Inserting students...');
        const students = [
            // Tech University students
            { college_id: 1, student_id: 'TU001', name: 'Alice Johnson', email: 'alice.johnson@tu.edu', phone: '+1234567890', year: '2024', department: 'Computer Science' },
            { college_id: 1, student_id: 'TU002', name: 'Bob Smith', email: 'bob.smith@tu.edu', phone: '+1234567891', year: '2023', department: 'Computer Science' },
            { college_id: 1, student_id: 'TU003', name: 'Carol Davis', email: 'carol.davis@tu.edu', phone: '+1234567892', year: '2024', department: 'Information Technology' },
            { college_id: 1, student_id: 'TU004', name: 'David Wilson', email: 'david.wilson@tu.edu', phone: '+1234567893', year: '2022', department: 'Computer Science' },
            { college_id: 1, student_id: 'TU005', name: 'Eva Brown', email: 'eva.brown@tu.edu', phone: '+1234567894', year: '2024', department: 'Data Science' },
            
            // Engineering College students
            { college_id: 2, student_id: 'EC001', name: 'Frank Miller', email: 'frank.miller@ec.edu', phone: '+1234567895', year: '2024', department: 'Mechanical Engineering' },
            { college_id: 2, student_id: 'EC002', name: 'Grace Lee', email: 'grace.lee@ec.edu', phone: '+1234567896', year: '2023', department: 'Electrical Engineering' },
            { college_id: 2, student_id: 'EC003', name: 'Henry Taylor', email: 'henry.taylor@ec.edu', phone: '+1234567897', year: '2024', department: 'Civil Engineering' },
            { college_id: 2, student_id: 'EC004', name: 'Ivy Chen', email: 'ivy.chen@ec.edu', phone: '+1234567898', year: '2022', department: 'Computer Engineering' },
            { college_id: 2, student_id: 'EC005', name: 'Jack Anderson', email: 'jack.anderson@ec.edu', phone: '+1234567899', year: '2024', department: 'Aerospace Engineering' },
            
            // Business School students
            { college_id: 3, student_id: 'BS001', name: 'Kate Martinez', email: 'kate.martinez@bs.edu', phone: '+1234567800', year: '2024', department: 'Business Administration' },
            { college_id: 3, student_id: 'BS002', name: 'Liam Thompson', email: 'liam.thompson@bs.edu', phone: '+1234567801', year: '2023', department: 'Marketing' },
            { college_id: 3, student_id: 'BS003', name: 'Maya Rodriguez', email: 'maya.rodriguez@bs.edu', phone: '+1234567802', year: '2024', department: 'Finance' },
            { college_id: 3, student_id: 'BS004', name: 'Noah Garcia', email: 'noah.garcia@bs.edu', phone: '+1234567803', year: '2022', department: 'Management' },
            { college_id: 3, student_id: 'BS005', name: 'Olivia White', email: 'olivia.white@bs.edu', phone: '+1234567804', year: '2024', department: 'Entrepreneurship' }
        ];
        
        for (const student of students) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR IGNORE INTO students (college_id, student_id, name, email, phone, year, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [student.college_id, student.student_id, student.name, student.email, student.phone, student.year, student.department],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // Insert events
        console.log('📅 Inserting events...');
        const events = [
            // Tech University events
            { college_id: 1, title: 'AI & Machine Learning Workshop', description: 'Hands-on workshop covering the fundamentals of AI and ML', event_type: 'workshop', start_date: '2024-09-15 09:00:00', end_date: '2024-09-15 17:00:00', location: 'Tech Lab 101', max_participants: 30, created_by: 'admin@tu.edu' },
            { college_id: 1, title: 'Hackathon 2024', description: '48-hour coding competition with exciting prizes', event_type: 'hackathon', start_date: '2024-09-20 18:00:00', end_date: '2024-09-22 18:00:00', location: 'Main Auditorium', max_participants: 100, created_by: 'admin@tu.edu' },
            { college_id: 1, title: 'Tech Talk: Future of Web Development', description: 'Industry expert discussing modern web technologies', event_type: 'tech_talk', start_date: '2024-09-25 14:00:00', end_date: '2024-09-25 16:00:00', location: 'Conference Room A', max_participants: 50, created_by: 'admin@tu.edu' },
            { college_id: 1, title: 'TechFest 2024', description: 'Annual technology festival with exhibitions and competitions', event_type: 'fest', start_date: '2024-10-05 09:00:00', end_date: '2024-10-07 18:00:00', location: 'Campus Grounds', max_participants: 500, created_by: 'admin@tu.edu' },
            { college_id: 1, title: 'Data Science Seminar', description: 'Advanced topics in data science and analytics', event_type: 'seminar', start_date: '2024-10-10 10:00:00', end_date: '2024-10-10 12:00:00', location: 'Lecture Hall 1', max_participants: 80, created_by: 'admin@tu.edu' },
            
            // Engineering College events
            { college_id: 2, title: 'Robotics Workshop', description: 'Build and program your own robot', event_type: 'workshop', start_date: '2024-09-18 09:00:00', end_date: '2024-09-18 17:00:00', location: 'Engineering Lab', max_participants: 25, created_by: 'admin@ec.edu' },
            { college_id: 2, title: 'Engineering Design Competition', description: 'Design innovative solutions for real-world problems', event_type: 'hackathon', start_date: '2024-09-28 08:00:00', end_date: '2024-09-29 20:00:00', location: 'Design Studio', max_participants: 60, created_by: 'admin@ec.edu' },
            { college_id: 2, title: 'Tech Talk: Sustainable Engineering', description: 'Green technologies and sustainable engineering practices', event_type: 'tech_talk', start_date: '2024-10-02 15:00:00', end_date: '2024-10-02 17:00:00', location: 'Auditorium B', max_participants: 100, created_by: 'admin@ec.edu' },
            { college_id: 2, title: 'Engineering Expo', description: 'Showcase of student projects and innovations', event_type: 'fest', start_date: '2024-10-12 09:00:00', end_date: '2024-10-12 18:00:00', location: 'Exhibition Hall', max_participants: 200, created_by: 'admin@ec.edu' },
            { college_id: 2, title: 'Advanced Materials Seminar', description: 'Latest developments in materials science', event_type: 'seminar', start_date: '2024-10-15 11:00:00', end_date: '2024-10-15 13:00:00', location: 'Materials Lab', max_participants: 40, created_by: 'admin@ec.edu' },
            
            // Business School events
            { college_id: 3, title: 'Startup Pitch Workshop', description: 'Learn how to pitch your business ideas effectively', event_type: 'workshop', start_date: '2024-09-22 10:00:00', end_date: '2024-09-22 16:00:00', location: 'Business Center', max_participants: 35, created_by: 'admin@bs.edu' },
            { college_id: 3, title: 'Business Case Competition', description: 'Solve real business challenges in a competitive environment', event_type: 'hackathon', start_date: '2024-10-01 09:00:00', end_date: '2024-10-02 18:00:00', location: 'Case Study Room', max_participants: 40, created_by: 'admin@bs.edu' },
            { college_id: 3, title: 'Tech Talk: Digital Marketing Trends', description: 'Latest trends in digital marketing and social media', event_type: 'tech_talk', start_date: '2024-10-08 14:00:00', end_date: '2024-10-08 16:00:00', location: 'Marketing Lab', max_participants: 60, created_by: 'admin@bs.edu' },
            { college_id: 3, title: 'Business Fest 2024', description: 'Networking event with industry professionals', event_type: 'fest', start_date: '2024-10-18 09:00:00', end_date: '2024-10-18 20:00:00', location: 'Convention Center', max_participants: 300, created_by: 'admin@bs.edu' },
            { college_id: 3, title: 'Financial Markets Seminar', description: 'Understanding global financial markets', event_type: 'seminar', start_date: '2024-10-22 10:00:00', end_date: '2024-10-22 12:00:00', location: 'Finance Lab', max_participants: 50, created_by: 'admin@bs.edu' }
        ];
        
        for (const event of events) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR IGNORE INTO events (college_id, title, description, event_type, start_date, end_date, location, max_participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [event.college_id, event.title, event.description, event.event_type, event.start_date, event.end_date, event.location, event.max_participants, event.created_by],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // Get student and event IDs for registrations
        console.log('📝 Inserting registrations...');
        const studentIds = await new Promise((resolve, reject) => {
            db.all('SELECT id, college_id FROM students', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const eventIds = await new Promise((resolve, reject) => {
            db.all('SELECT id, college_id FROM events', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Create registrations (students register for events in their college)
        const registrations = [];
        for (const student of studentIds) {
            const collegeEvents = eventIds.filter(event => event.college_id === student.college_id);
            // Each student registers for 2-4 random events from their college
            const numRegistrations = Math.floor(Math.random() * 3) + 2;
            const selectedEvents = collegeEvents.sort(() => 0.5 - Math.random()).slice(0, numRegistrations);
            
            for (const event of selectedEvents) {
                registrations.push({
                    event_id: event.id,
                    student_id: student.id,
                    registered_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
                });
            }
        }
        
        for (const registration of registrations) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT OR IGNORE INTO registrations (event_id, student_id, registered_at) VALUES (?, ?, ?)',
                    [registration.event_id, registration.student_id, registration.registered_at],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // Insert attendance (some students attend events they registered for)
        console.log('✅ Inserting attendance...');
        const registrationIds = await new Promise((resolve, reject) => {
            db.all('SELECT id, event_id, student_id FROM registrations', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        for (const registration of registrationIds) {
            // 70% chance of attending
            if (Math.random() < 0.7) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR IGNORE INTO attendance (event_id, student_id, checked_in_at) VALUES (?, ?, ?)',
                        [registration.event_id, registration.student_id, new Date().toISOString()],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }
        
        // Insert feedback (students who attended provide feedback)
        console.log('💬 Inserting feedback...');
        const attendanceIds = await new Promise((resolve, reject) => {
            db.all('SELECT event_id, student_id FROM attendance', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const feedbackComments = [
            'Great event! Learned a lot.',
            'Very informative and well-organized.',
            'Excellent speakers and content.',
            'Could be better organized.',
            'Amazing experience!',
            'Good event, but too long.',
            'Perfect timing and location.',
            'Needs more interactive sessions.',
            'Outstanding presentation!',
            'Good content, but room was too small.'
        ];
        
        for (const attendance of attendanceIds) {
            // 60% chance of providing feedback
            if (Math.random() < 0.6) {
                const rating = Math.floor(Math.random() * 5) + 1;
                const comment = feedbackComments[Math.floor(Math.random() * feedbackComments.length)];
                
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT OR IGNORE INTO feedback (event_id, student_id, rating, comment) VALUES (?, ?, ?, ?)',
                        [attendance.event_id, attendance.student_id, rating, comment],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }
        
        console.log('✅ Database seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Colleges: ${colleges.length}`);
        console.log(`   - Students: ${students.length}`);
        console.log(`   - Events: ${events.length}`);
        console.log(`   - Registrations: ${registrations.length}`);
        console.log(`   - Attendance records: ${attendanceIds.length}`);
        console.log(`   - Feedback records: ${Math.floor(attendanceIds.length * 0.6)}`);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
    seedData()
        .then(() => {
            console.log('🎉 Seeding process completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedData };
