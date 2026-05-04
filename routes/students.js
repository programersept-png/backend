const express = require('express');
const Student = require('../models/Student');
const { getNextSequence } = require('../models/Counter');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Create student - Generate ID manually
router.post('/students', async (req, res) => {
    try {
        const { name, class: className } = req.body;
        
        if (!name || !className) {
            return res.status(400).json({ error: 'Name and class are required' });
        }
        
        // Generate the next student_id
        const student_id = await getNextSequence('student_id');
        
        const student = new Student({
            student_id: student_id,
            name,
            class: className
        });
        
        await student.save();
        console.log(`Student created with ID: ${student_id}`);
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ student_id: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single student
router.get('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const student = await Student.findOne({ student_id: id });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student
router.put('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, class: className } = req.body;
        
        const student = await Student.findOneAndUpdate(
            { student_id: id },
            { name, class: className },
            { new: true, runValidators: true }
        );
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const student = await Student.findOneAndDelete({ student_id: id });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;