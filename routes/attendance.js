const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/attendance - Get attendance records with optional filtering
router.get('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id, date, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT a.*, 
           e.title as event_title, 
           e.event_type,
           s.name as student_name, 
           s.student_id as student_number,
           c.name as college_name
    FROM attendance a
    JOIN events e ON a.event_id = e.id
    JOIN students s ON a.student_id = s.id
    JOIN colleges c ON s.college_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (event_id) {
    query += ' AND a.event_id = ?';
    params.push(event_id);
  }
  
  if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }
  
  if (date) {
    query += ' AND DATE(a.checked_in_at) = ?';
    params.push(date);
  }
  
  query += ' ORDER BY a.checked_in_at DESC';
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance records',
        code: 'FETCH_ATTENDANCE_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM attendance a
      WHERE 1=1
    `;
    const countParams = [];
    
    if (event_id) {
      countQuery += ' AND a.event_id = ?';
      countParams.push(event_id);
    }
    
    if (student_id) {
      countQuery += ' AND a.student_id = ?';
      countParams.push(student_id);
    }
    
    if (date) {
      countQuery += ' AND DATE(a.checked_in_at) = ?';
      countParams.push(date);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get attendance count',
          code: 'COUNT_ATTENDANCE_ERROR'
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

// POST /api/attendance - Mark student attendance
router.post('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id, status = 'present' } = req.body;
  
  // Validation
  if (!event_id || !student_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: event_id, student_id',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Validate status
  const validStatuses = ['present', 'absent'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      code: 'INVALID_STATUS'
    });
  }
  
  // Check if student is registered for the event
  const checkRegistrationQuery = `
    SELECT r.id 
    FROM registrations r 
    WHERE r.event_id = ? AND r.student_id = ? AND r.status = 'registered'
  `;
  
  db.get(checkRegistrationQuery, [event_id, student_id], (err, registration) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check registration',
        code: 'CHECK_REGISTRATION_ERROR'
      });
    }
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        error: 'Student is not registered for this event',
        code: 'STUDENT_NOT_REGISTERED'
      });
    }
    
    // Check if attendance is already marked
    const checkAttendanceQuery = `
      SELECT id FROM attendance 
      WHERE event_id = ? AND student_id = ?
    `;
    
    db.get(checkAttendanceQuery, [event_id, student_id], (err, existingAttendance) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to check existing attendance',
          code: 'CHECK_ATTENDANCE_ERROR'
        });
      }
      
      if (existingAttendance) {
        return res.status(409).json({
          success: false,
          error: 'Attendance already marked for this student and event',
          code: 'ATTENDANCE_ALREADY_MARKED'
        });
      }
      
      // Mark attendance
      const insertQuery = `
        INSERT INTO attendance (event_id, student_id, status)
        VALUES (?, ?, ?)
      `;
      
      db.run(insertQuery, [event_id, student_id, status], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Failed to mark attendance',
            code: 'MARK_ATTENDANCE_ERROR'
          });
        }
        
        res.status(201).json({
          success: true,
          data: { id: this.lastID },
          message: 'Attendance marked successfully'
        });
      });
    });
  });
});

// PUT /api/attendance/:id - Update attendance status
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
  const validStatuses = ['present', 'absent'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      code: 'INVALID_STATUS'
    });
  }
  
  const query = 'UPDATE attendance SET status = ? WHERE id = ?';
  
  db.run(query, [status, id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update attendance',
        code: 'UPDATE_ATTENDANCE_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Attendance updated successfully'
    });
  });
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = 'DELETE FROM attendance WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete attendance record',
        code: 'DELETE_ATTENDANCE_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  });
});

module.exports = router;
