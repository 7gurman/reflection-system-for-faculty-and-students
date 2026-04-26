const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Reflection = require('../models/Reflection');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/reflections
 * @desc    Submit a new reflection (student only)
 * @access  Private - Student
 */
router.post(
  '/',
  protect,
  authorize('student'),
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('studiedTopics').trim().notEmpty().withMessage('Studied topics is required'),
    body('conceptsUnderstood').trim().notEmpty().withMessage('Concepts understood is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const reflection = await Reflection.create({
        ...req.body,
        student: req.user._id,
      });

      await reflection.populate('student', 'name email registrationNumber');

      res.status(201).json({ success: true, data: reflection });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/reflections
 * @desc    Get all reflections (faculty: all; student: own)
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { subject, status, from, to, studentId } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (studentId) {
      filter.student = studentId;
    }

    if (subject) filter.subject = new RegExp(subject, 'i');
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const reflections = await Reflection.find(filter)
      .populate('student', 'name email registrationNumber courseCode teamName')
      .populate('feedback.faculty', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: reflections.length, data: reflections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/reflections/:id
 * @desc    Get single reflection
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id)
      .populate('student', 'name email registrationNumber courseCode teamName')
      .populate('feedback.faculty', 'name email');

    if (!reflection) {
      return res.status(404).json({ success: false, message: 'Reflection not found' });
    }

    // Students can only view their own
    if (
      req.user.role === 'student' &&
      reflection.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/reflections/:id
 * @desc    Update reflection (student - own only, before reviewed)
 * @access  Private - Student
 */
router.put('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ success: false, message: 'Reflection not found' });
    }

    if (reflection.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (reflection.status === 'reviewed') {
      return res.status(400).json({ success: false, message: 'Cannot edit a reviewed reflection' });
    }

    const allowed = ['subject', 'studiedTopics', 'conceptsUnderstood', 'challengesFaced', 'nextSteps', 'mood', 'tags', 'periodType', 'weekNumber', 'date'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) reflection[field] = req.body[field];
    });

    await reflection.save();
    res.status(200).json({ success: true, data: reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/reflections/:id
 * @desc    Delete reflection (student - own only)
 * @access  Private - Student
 */
router.delete('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ success: false, message: 'Reflection not found' });
    }

    if (reflection.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await reflection.deleteOne();
    res.status(200).json({ success: true, message: 'Reflection deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/reflections/:id/feedback
 * @desc    Add faculty feedback to a reflection
 * @access  Private - Faculty
 */
router.post(
  '/:id/feedback',
  protect,
  authorize('faculty'),
  [
    body('text').trim().notEmpty().withMessage('Feedback text is required'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const reflection = await Reflection.findById(req.params.id);

      if (!reflection) {
        return res.status(404).json({ success: false, message: 'Reflection not found' });
      }

      reflection.feedback.push({
        faculty: req.user._id,
        text: req.body.text,
        rating: req.body.rating,
      });
      reflection.status = 'reviewed';

      await reflection.save();
      await reflection.populate('feedback.faculty', 'name email');

      res.status(201).json({ success: true, data: reflection });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/reflections/stats/summary
 * @desc    Get stats for dashboard
 * @access  Private
 */
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const matchStage =
      req.user.role === 'student'
        ? { $match: { student: req.user._id } }
        : { $match: {} };

    const stats = await Reflection.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          reviewed: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          subjects: { $addToSet: '$subject' },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          reviewed: 1,
          pending: 1,
          subjectCount: { $size: '$subjects' },
        },
      },
    ]);

    const subjectBreakdown = await Reflection.aggregate([
      matchStage,
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, reviewed: 0, pending: 0, subjectCount: 0 },
        bySubject: subjectBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
