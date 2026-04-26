const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Reflection = require('../models/Reflection');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/faculty/students
 * @desc    Get all students with their reflection counts
 * @access  Private - Faculty
 */
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-__v');

    // Attach reflection stats per student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const total = await Reflection.countDocuments({ student: student._id });
        const reviewed = await Reflection.countDocuments({ student: student._id, status: 'reviewed' });
        const latest = await Reflection.findOne({ student: student._id }).sort({ date: -1 }).select('date subject');
        return {
          ...student.toObject(),
          stats: { total, reviewed, pending: total - reviewed, latestReflection: latest },
        };
      })
    );

    res.status(200).json({ success: true, count: students.length, data: studentsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/faculty/queue
 * @desc    Get all pending (unreviewed) reflections
 * @access  Private - Faculty
 */
router.get('/queue', protect, authorize('faculty'), async (req, res) => {
  try {
    const pending = await Reflection.find({ status: 'submitted' })
      .populate('student', 'name email registrationNumber courseCode teamName')
      .sort({ createdAt: 1 }); // oldest first

    res.status(200).json({ success: true, count: pending.length, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/faculty/overview
 * @desc    Faculty dashboard overview stats
 * @access  Private - Faculty
 */
router.get('/overview', protect, authorize('faculty'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalReflections = await Reflection.countDocuments();
    const pendingReview = await Reflection.countDocuments({ status: 'submitted' });
    const reviewedCount = await Reflection.countDocuments({ status: 'reviewed' });

    // Reflections by subject
    const bySubject = await Reflection.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Reflection.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalReflections,
        pendingReview,
        reviewedCount,
        bySubject,
        recentActivity: recentCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
