const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/students - Get all students with optional filtering
router.get('/', (req, res) => {
  const db = getDatabase();
  const { college_id, year, department, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT s.*, c.name as college_name, c.code as college_code
    FROM students s
    JOIN colleges c ON s.college_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (college_id) {
    query += ' AND s.college_id = ?';
    params.push(college_id);
  }
  
  if (year) {
    query += ' AND s.year = ?';
    params.push(year);
  }
  
  if (department) {
    query += ' AND s.department = ?';
    params.push(department);
  }
  
  query += ' ORDER BY s.created_at DESC';
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch students',
        code: 'FETCH_STUDENTS_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM students s WHERE 1=1';
    const countParams = [];
    
    if (college_id) {
      countQuery += ' AND s.college_id = ?';
      countParams.push(college_id);
    }
    
    if (year) {
      countQuery += ' AND s.year = ?';
      countParams.push(year);
    }
    
    if (department) {
      countQuery += ' AND s.department = ?';
      countParams.push(department);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get student count',
          code: 'COUNT_STUDENTS_ERROR'
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

// GET /api/students/:id - Get specific student
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = `
    SELECT s.*, c.name as college_name, c.code as college_code
    FROM students s
    JOIN colleges c ON s.college_id = c.id
    WHERE s.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch student',
        code: 'FETCH_STUDENT_ERROR'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: row
    });
  });
});

// POST /api/students - Register new student
router.post('/', (req, res) => {
  const db = getDatabase();
  const {
    college_id,
    student_id,
    name,
    email,
    phone,
    year,
    department
  } = req.body;
  
  // Validation
  if (!college_id || !student_id || !name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: college_id, student_id, name, email',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format',
      code: 'INVALID_EMAIL_FORMAT'
    });
  }
  
  const query = `
    INSERT INTO students (college_id, student_id, name, email, phone, year, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    college_id,
    student_id,
    name,
    email,
    phone || null,
    year || null,
    department || null
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({
            success: false,
            error: 'Student with this ID already exists in this college',
            code: 'DUPLICATE_STUDENT_ID'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Invalid college_id or constraint violation',
          code: 'CONSTRAINT_VIOLATION'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to create student',
        code: 'CREATE_STUDENT_ERROR'
      });
    }
    
    res.status(201).json({
      success: true,
      data: { id: this.lastID },
      message: 'Student registered successfully'
    });
  });
});

// PUT /api/students/:id - Update student
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    year,
    department
  } = req.body;
  
  // Build dynamic update query
  const updates = [];
  const params = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  
  if (email !== undefined) {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    updates.push('email = ?');
    params.push(email);
  }
  
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  
  if (year !== undefined) {
    updates.push('year = ?');
    params.push(year);
  }
  
  if (department !== undefined) {
    updates.push('department = ?');
    params.push(department);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
      code: 'NO_FIELDS_TO_UPDATE'
    });
  }
  
  params.push(id);
  
  const query = `UPDATE students SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update student',
        code: 'UPDATE_STUDENT_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  });
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  const query = 'DELETE FROM students WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete student',
        code: 'DELETE_STUDENT_ERROR'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  });
});

module.exports = router;
