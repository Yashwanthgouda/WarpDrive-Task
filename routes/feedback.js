const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/feedback - Get feedback records with optional filtering
router.get('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT f.*, 
           e.title as event_title, 
           e.event_type,
           s.name as student_name, 
           s.student_id as student_number,
           c.name as college_name
    FROM feedback f
    JOIN events e ON f.event_id = e.id
    JOIN students s ON f.student_id = s.id
    JOIN colleges c ON s.college_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (event_id) {
    query += ' AND f.event_id = ?';
    params.push(event_id);
  }
  
  if (student_id) {
    query += ' AND f.student_id = ?';
    params.push(student_id);
  }
  
  query += ' ORDER BY f.submitted_at DESC';
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch feedback records',
        code: 'FETCH_FEEDBACK_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM feedback f
      WHERE 1=1
    `;
    const countParams = [];
    
    if (event_id) {
      countQuery += ' AND f.event_id = ?';
      countParams.push(event_id);
    }
    
    if (student_id) {
      countQuery += ' AND f.student_id = ?';
      countParams.push(student_id);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get feedback count',
          code: 'COUNT_FEEDBACK_ERROR'
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

// POST /api/feedback - Submit feedback for an event
router.post('/', (req, res) => {
  const db = getDatabase();
  const { event_id, student_id, rating, comment } = req.body;
  
  // Validation
  if (!event_id || !student_id || !rating) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: event_id, student_id, rating',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Validate rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Rating must be an integer between 1 and 5',
      code: 'INVALID_RATING'
    });
  }
  
  // Check if student attended the event
  const checkAttendanceQuery = `
    SELECT a.id 
    FROM attendance a 
    WHERE a.event_id = ? AND a.student_id = ? AND a.status = 'present'
  `;
  
  db.get(checkAttendanceQuery, [event_id, student_id], (err, attendance) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check attendance',
        code: 'CHECK_ATTENDANCE_ERROR'
      });
    }
    
    if (!attendance) {
      return res.status(400).json({
        success: false,
        error: 'Student must attend the event to provide feedback',
        code: 'STUDENT_NOT_ATTENDED'
      });
    }
    
    // Check if feedback already exists
    const checkFeedbackQuery = `
      SELECT id FROM feedback 
      WHERE event_id = ? AND student_id = ?
    `;
    
    db.get(checkFeedbackQuery, [event_id, student_id], (err, existingFeedback) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to check existing feedback',
          code: 'CHECK_FEEDBACK_ERROR'
        });
      }
      
      if (existingFeedback) {
        return res.status(409).json({
          success: false,
          error: 'Feedback already submitted for this event',
          code: 'FEEDBACK_ALREADY_SUBMITTED'
        });
      }
      
      // Submit feedback
      const insertQuery = `
        INSERT INTO feedback (event_id, student_id, rating, comment)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(insertQuery, [event_id, student_id, rating, comment || null], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Failed to submit feedback',
            code: 'SUBMIT_FEEDBACK_ERROR'
          });
        }
        
        res.status(201).json({
          success: true,
          data: { id: this.lastID },
          message: 'Feedback submitted successfully'
        });
      });
    });
  });
});

// PUT /api/feedback/:id - Update feedback
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  // Build dynamic update query
  const updates = [];
  const params = [];
  
  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5',
        code: 'INVALID_RATING'
      });
    }
    updates.push('rating = ?');
    params.push(rating);
  }
  
  if (comment !== undefined) {
    updates.push('comment = ?');
    params.push(comment);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
      code: 'NO_FIELDS_TO_UPDATE'
    });
  }
  
  params.push(id);
  
  const query = `UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update feedback',
        code: 'UPDATE_FEEDBACK_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback record not found',
        code: 'FEEDBACK_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback updated successfully'
    });
  });
});

// DELETE /api/feedback/:id - Delete feedback record
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = 'DELETE FROM feedback WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete feedback record',
        code: 'DELETE_FEEDBACK_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback record not found',
        code: 'FEEDBACK_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback record deleted successfully'
    });
  });
});

module.exports = router;
