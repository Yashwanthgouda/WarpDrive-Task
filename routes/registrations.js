const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/registrations - Get all registrations with optional filtering
router.get('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id, status, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT r.*, 
           e.title as event_title, 
           e.event_type,
           e.start_date,
           e.location,
           s.name as student_name, 
           s.student_id as student_number,
           s.email as student_email,
           c.name as college_name
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN students s ON r.student_id = s.id
    JOIN colleges c ON s.college_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (event_id) {
    query += ' AND r.event_id = ?';
    params.push(event_id);
  }
  
  if (student_id) {
    query += ' AND r.student_id = ?';
    params.push(student_id);
  }
  
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY r.registered_at DESC';
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch registrations',
        code: 'FETCH_REGISTRATIONS_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM registrations r
      WHERE 1=1
    `;
    const countParams = [];
    
    if (event_id) {
      countQuery += ' AND r.event_id = ?';
      countParams.push(event_id);
    }
    
    if (student_id) {
      countQuery += ' AND r.student_id = ?';
      countParams.push(student_id);
    }
    
    if (status) {
      countQuery += ' AND r.status = ?';
      countParams.push(status);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get registration count',
          code: 'COUNT_REGISTRATIONS_ERROR'
        });
      }
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countRow.total,
          pages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// POST /api/registrations - Register a student for an event
router.post('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id } = req.body;
  
  // Validation
  if (!event_id || !student_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: event_id, student_id',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Check if event exists and is active
  const checkEventQuery = `
    SELECT id, title, max_participants, status, start_date
    FROM events 
    WHERE id = ?
  `;
  
  db.get(checkEventQuery, [event_id], (err, event) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check event',
        code: 'CHECK_EVENT_ERROR'
      });
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    if (event.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Event is not active for registration',
        code: 'EVENT_NOT_ACTIVE'
      });
    }
    
    // Check if event has already started
    const eventStartDate = new Date(event.start_date);
    const now = new Date();
    
    if (eventStartDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Registration closed - event has already started',
        code: 'REGISTRATION_CLOSED'
      });
    }
    
    // Check if student exists
    const checkStudentQuery = 'SELECT id, name FROM students WHERE id = ?';
    
    db.get(checkStudentQuery, [student_id], (err, student) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to check student',
          code: 'CHECK_STUDENT_ERROR'
        });
      }
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }
      
      // Check if student is already registered
      const checkRegistrationQuery = `
        SELECT id FROM registrations 
        WHERE event_id = ? AND student_id = ?
      `;
      
      db.get(checkRegistrationQuery, [event_id, student_id], (err, existingRegistration) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Failed to check existing registration',
            code: 'CHECK_REGISTRATION_ERROR'
          });
        }
        
        if (existingRegistration) {
          return res.status(409).json({
            success: false,
            error: 'Student is already registered for this event',
            code: 'ALREADY_REGISTERED'
          });
        }
        
        // Check capacity if max_participants is set
        if (event.max_participants) {
          const countRegistrationsQuery = `
            SELECT COUNT(*) as count 
            FROM registrations 
            WHERE event_id = ? AND status = 'registered'
          `;
          
          db.get(countRegistrationsQuery, [event_id], (err, countRow) => {
            if (err) {
              return res.status(500).json({
                success: false,
                error: 'Failed to check event capacity',
                code: 'CHECK_CAPACITY_ERROR'
              });
            }
            
            if (countRow.count >= event.max_participants) {
              return res.status(400).json({
                success: false,
                error: 'Event is at full capacity',
                code: 'EVENT_FULL'
              });
            }
            
            // Register student
            registerStudent();
          });
        } else {
          // No capacity limit, register student
          registerStudent();
        }
      });
    });
    
    function registerStudent() {
      const insertQuery = `
        INSERT INTO registrations (event_id, student_id, status)
        VALUES (?, ?, 'registered')
      `;
      
      db.run(insertQuery, [event_id, student_id], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Failed to register student',
            code: 'REGISTER_STUDENT_ERROR'
          });
        }
        
        res.status(201).json({
          success: true,
          data: { id: this.lastID },
          message: 'Student registered successfully'
        });
      });
    }
  });
});

// PUT /api/registrations/:id - Update registration status
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: status',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Validate status
  const validStatuses = ['registered', 'cancelled', 'attended'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      code: 'INVALID_STATUS'
    });
  }
  
  const query = 'UPDATE registrations SET status = ? WHERE id = ?';
  
  db.run(query, [status, id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update registration',
        code: 'UPDATE_REGISTRATION_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
        code: 'REGISTRATION_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Registration updated successfully'
    });
  });
});

// DELETE /api/registrations/:id - Cancel registration
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = 'DELETE FROM registrations WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel registration',
        code: 'CANCEL_REGISTRATION_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
        code: 'REGISTRATION_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  });
});

module.exports = router;
