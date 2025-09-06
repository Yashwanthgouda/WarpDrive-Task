const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// GET /api/reports/event-popularity - Get event popularity report
router.get('/event-popularity', (req, res) => {
  const db = getDatabase();
  const { college_id, event_type, limit = 10 } = req.query;
  
  let query = `
    SELECT 
      e.id,
      e.title,
      e.event_type,
      e.start_date,
      e.location,
      c.name as college_name,
      COUNT(r.id) as total_registrations,
      COUNT(a.id) as total_attendance,
      ROUND(COUNT(a.id) * 100.0 / COUNT(r.id), 2) as attendance_percentage,
      ROUND(AVG(f.rating), 2) as average_rating,
      COUNT(f.id) as feedback_count
    FROM events e
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    LEFT JOIN attendance a ON e.id = a.event_id AND a.status = 'present'
    LEFT JOIN feedback f ON e.id = f.event_id
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
  
  query += `
    GROUP BY e.id
    ORDER BY total_registrations DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate event popularity report',
        code: 'EVENT_POPULARITY_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: rows,
      message: 'Event popularity report generated successfully'
    });
  });
});

// GET /api/reports/student-participation - Get student participation report
router.get('/student-participation', (req, res) => {
  const db = getDatabase();
  const { college_id, student_id, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT 
      s.id,
      s.name,
      s.student_id as student_number,
      s.email,
      s.year,
      s.department,
      c.name as college_name,
      COUNT(DISTINCT r.event_id) as total_registrations,
      COUNT(DISTINCT a.event_id) as total_attendance,
      COUNT(DISTINCT f.event_id) as total_feedback,
      ROUND(COUNT(DISTINCT a.event_id) * 100.0 / COUNT(DISTINCT r.event_id), 2) as attendance_percentage,
      ROUND(AVG(f.rating), 2) as average_rating_given
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    LEFT JOIN registrations r ON s.id = r.student_id AND r.status = 'registered'
    LEFT JOIN attendance a ON s.id = a.student_id AND a.status = 'present'
    LEFT JOIN feedback f ON s.id = f.student_id
    WHERE 1=1
  `;
  const params = [];
  
  if (college_id) {
    query += ' AND s.college_id = ?';
    params.push(college_id);
  }
  
  if (student_id) {
    query += ' AND s.id = ?';
    params.push(student_id);
  }
  
  query += `
    GROUP BY s.id
    ORDER BY total_registrations DESC, total_attendance DESC
  `;
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate student participation report',
        code: 'STUDENT_PARTICIPATION_ERROR'
      });
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM students s
      WHERE 1=1
    `;
    const countParams = [];
    
    if (college_id) {
      countQuery += ' AND s.college_id = ?';
      countParams.push(college_id);
    }
    
    if (student_id) {
      countQuery += ' AND s.id = ?';
      countParams.push(student_id);
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
        },
        message: 'Student participation report generated successfully'
      });
    });
  });
});

// GET /api/reports/attendance-summary - Get attendance summary for events
router.get('/attendance-summary', (req, res) => {
  const db = getDatabase();
  const { event_id, college_id } = req.query;
  
  let query = `
    SELECT 
      e.id,
      e.title,
      e.event_type,
      e.start_date,
      e.location,
      c.name as college_name,
      COUNT(DISTINCT r.id) as total_registrations,
      COUNT(DISTINCT a.id) as total_attendance,
      ROUND(COUNT(DISTINCT a.id) * 100.0 / COUNT(DISTINCT r.id), 2) as attendance_percentage,
      COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as present_count,
      COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.id END) as absent_count
    FROM events e
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    LEFT JOIN attendance a ON e.id = a.event_id
    WHERE 1=1
  `;
  const params = [];
  
  if (event_id) {
    query += ' AND e.id = ?';
    params.push(event_id);
  }
  
  if (college_id) {
    query += ' AND e.college_id = ?';
    params.push(college_id);
  }
  
  query += `
    GROUP BY e.id
    ORDER BY e.start_date DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate attendance summary',
        code: 'ATTENDANCE_SUMMARY_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: rows,
      message: 'Attendance summary generated successfully'
    });
  });
});

// GET /api/reports/feedback-summary - Get feedback summary for events
router.get('/feedback-summary', (req, res) => {
  const db = getDatabase();
  const { event_id, college_id } = req.query;
  
  let query = `
    SELECT 
      e.id,
      e.title,
      e.event_type,
      e.start_date,
      c.name as college_name,
      COUNT(f.id) as total_feedback,
      ROUND(AVG(f.rating), 2) as average_rating,
      MIN(f.rating) as min_rating,
      MAX(f.rating) as max_rating,
      COUNT(CASE WHEN f.rating = 5 THEN 1 END) as five_star_count,
      COUNT(CASE WHEN f.rating = 4 THEN 1 END) as four_star_count,
      COUNT(CASE WHEN f.rating = 3 THEN 1 END) as three_star_count,
      COUNT(CASE WHEN f.rating = 2 THEN 1 END) as two_star_count,
      COUNT(CASE WHEN f.rating = 1 THEN 1 END) as one_star_count
    FROM events e
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN feedback f ON e.id = f.event_id
    WHERE 1=1
  `;
  const params = [];
  
  if (event_id) {
    query += ' AND e.id = ?';
    params.push(event_id);
  }
  
  if (college_id) {
    query += ' AND e.college_id = ?';
    params.push(college_id);
  }
  
  query += `
    GROUP BY e.id
    ORDER BY average_rating DESC, total_feedback DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate feedback summary',
        code: 'FEEDBACK_SUMMARY_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: rows,
      message: 'Feedback summary generated successfully'
    });
  });
});

// GET /api/reports/top-active-students - Get top most active students
router.get('/top-active-students', (req, res) => {
  const db = getDatabase();
  const { college_id, limit = 3 } = req.query;
  
  let query = `
    SELECT 
      s.id,
      s.name,
      s.student_id as student_number,
      s.email,
      s.year,
      s.department,
      c.name as college_name,
      COUNT(DISTINCT r.event_id) as total_registrations,
      COUNT(DISTINCT a.event_id) as total_attendance,
      COUNT(DISTINCT f.event_id) as total_feedback,
      ROUND(COUNT(DISTINCT a.event_id) * 100.0 / COUNT(DISTINCT r.event_id), 2) as attendance_percentage,
      ROUND(AVG(f.rating), 2) as average_rating_given,
      (COUNT(DISTINCT r.event_id) + COUNT(DISTINCT a.event_id) + COUNT(DISTINCT f.event_id)) as activity_score
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    LEFT JOIN registrations r ON s.id = r.student_id AND r.status = 'registered'
    LEFT JOIN attendance a ON s.id = a.student_id AND a.status = 'present'
    LEFT JOIN feedback f ON s.id = f.student_id
    WHERE 1=1
  `;
  const params = [];
  
  if (college_id) {
    query += ' AND s.college_id = ?';
    params.push(college_id);
  }
  
  query += `
    GROUP BY s.id
    HAVING total_registrations > 0
    ORDER BY activity_score DESC, total_attendance DESC, total_registrations DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate top active students report',
        code: 'TOP_ACTIVE_STUDENTS_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: rows,
      message: `Top ${limit} most active students report generated successfully`
    });
  });
});

// GET /api/reports/event-type-analysis - Get analysis by event type
router.get('/event-type-analysis', (req, res) => {
  const db = getDatabase();
  const { college_id } = req.query;
  
  let query = `
    SELECT 
      e.event_type,
      COUNT(DISTINCT e.id) as total_events,
      COUNT(DISTINCT r.student_id) as total_participants,
      COUNT(DISTINCT a.student_id) as total_attendees,
      ROUND(COUNT(DISTINCT a.student_id) * 100.0 / COUNT(DISTINCT r.student_id), 2) as attendance_percentage,
      ROUND(AVG(f.rating), 2) as average_rating,
      COUNT(f.id) as total_feedback
    FROM events e
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    LEFT JOIN attendance a ON e.id = a.event_id AND a.status = 'present'
    LEFT JOIN feedback f ON e.id = f.event_id
    WHERE 1=1
  `;
  const params = [];
  
  if (college_id) {
    query += ' AND e.college_id = ?';
    params.push(college_id);
  }
  
  query += `
    GROUP BY e.event_type
    ORDER BY total_events DESC, total_participants DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate event type analysis',
        code: 'EVENT_TYPE_ANALYSIS_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: rows,
      message: 'Event type analysis generated successfully'
    });
  });
});

module.exports = router;
