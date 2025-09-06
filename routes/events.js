const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/events - Get all events with optional filtering
router.get('/', (req, res) => {
  const db = getDatabase();
  const { college_id, event_type, status, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT e.*, c.name as college_name, c.code as college_code
    FROM events e
    JOIN colleges c ON e.college_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (college_id) {
    query += ' AND e.college_id = ?';
    params.push(college_id);
  }
  
  if (event_type) {
    query += ' AND e.event_type = ?';
    params.push(event_type);
  }
  
  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY e.created_at DESC';
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch events',
        code: 'FETCH_EVENTS_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM events e WHERE 1=1';
    const countParams = [];
    
    if (college_id) {
      countQuery += ' AND e.college_id = ?';
      countParams.push(college_id);
    }
    
    if (event_type) {
      countQuery += ' AND e.event_type = ?';
      countParams.push(event_type);
    }
    
    if (status) {
      countQuery += ' AND e.status = ?';
      countParams.push(status);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get event count',
          code: 'COUNT_EVENTS_ERROR'
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

// GET /api/events/:id - Get specific event
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = `
    SELECT e.*, c.name as college_name, c.code as college_code
    FROM events e
    JOIN colleges c ON e.college_id = c.id
    WHERE e.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch event',
        code: 'FETCH_EVENT_ERROR'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: row
    });
  });
});

// POST /api/events - Create new event
router.post('/', (req, res) => {
  const db = getDatabase();
  const {
    college_id,
    title,
    description,
    event_type,
    start_date,
    end_date,
    location,
    max_participants,
    created_by
  } = req.body;
  
  // Validation
  if (!college_id || !title || !event_type || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: college_id, title, event_type, start_date, end_date',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Validate event type
  const validEventTypes = ['hackathon', 'workshop', 'tech_talk', 'fest', 'seminar'];
  if (!validEventTypes.includes(event_type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid event type. Must be one of: ' + validEventTypes.join(', '),
      code: 'INVALID_EVENT_TYPE'
    });
  }
  
  // Validate dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Use ISO 8601 format',
      code: 'INVALID_DATE_FORMAT'
    });
  }
  
  if (startDate >= endDate) {
    return res.status(400).json({
      success: false,
      error: 'End date must be after start date',
      code: 'INVALID_DATE_RANGE'
    });
  }
  
  const query = `
    INSERT INTO events (college_id, title, description, event_type, start_date, end_date, location, max_participants, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    college_id,
    title,
    description || null,
    event_type,
    start_date,
    end_date,
    location || null,
    max_participants || null,
    created_by || null
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({
          success: false,
          error: 'Invalid college_id or constraint violation',
          code: 'CONSTRAINT_VIOLATION'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to create event',
        code: 'CREATE_EVENT_ERROR'
      });
    }
    
    res.status(201).json({
      success: true,
      data: { id: this.lastID },
      message: 'Event created successfully'
    });
  });
});

// PUT /api/events/:id - Update event
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const {
    title,
    description,
    event_type,
    start_date,
    end_date,
    location,
    max_participants,
    status
  } = req.body;
  
  // Build dynamic update query
  const updates = [];
  const params = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  
  if (event_type !== undefined) {
    const validEventTypes = ['hackathon', 'workshop', 'tech_talk', 'fest', 'seminar'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type. Must be one of: ' + validEventTypes.join(', '),
        code: 'INVALID_EVENT_TYPE'
      });
    }
    updates.push('event_type = ?');
    params.push(event_type);
  }
  
  if (start_date !== undefined) {
    updates.push('start_date = ?');
    params.push(start_date);
  }
  
  if (end_date !== undefined) {
    updates.push('end_date = ?');
    params.push(end_date);
  }
  
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
  }
  
  if (max_participants !== undefined) {
    updates.push('max_participants = ?');
    params.push(max_participants);
  }
  
  if (status !== undefined) {
    const validStatuses = ['active', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
        code: 'INVALID_STATUS'
      });
    }
    updates.push('status = ?');
    params.push(status);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
      code: 'NO_FIELDS_TO_UPDATE'
    });
  }
  
  params.push(id);
  
  const query = `UPDATE events SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update event',
        code: 'UPDATE_EVENT_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully'
    });
  });
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = 'DELETE FROM events WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete event',
        code: 'DELETE_EVENT_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  });
});

module.exports = router;
