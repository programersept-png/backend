const express = require('express');
const router = express.Router();
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const Student = require('../models/Student');
const { getNextSequence } = require('../models/Counter');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Borrow a book - Generate ID manually with validation
router.post('/borrow', async (req, res) => {
    try {
        const { student_id, book_id, borrow_date } = req.body;
        
        console.log('Borrow request received:', { student_id, book_id });
        
        // Validate inputs
        if (!student_id || !book_id) {
            return res.status(400).json({ error: 'Student ID and Book ID are required' });
        }
        
        // Convert IDs to integers
        const studentIdNum = parseInt(student_id);
        const bookIdNum = parseInt(book_id);
        
        // Validate IDs are numbers
        if (isNaN(studentIdNum) || isNaN(bookIdNum)) {
            return res.status(400).json({ error: 'Invalid Student ID or Book ID format' });
        }
        
        // Check if student exists
        const student = await Student.findOne({ student_id: studentIdNum });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Check if book exists and has available copies
        const book = await Book.findOne({ book_id: bookIdNum });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.available_quantity <= 0) {
            return res.status(400).json({ error: 'No available copies' });
        }
        
        // Check if student already has this book borrowed
        const existingBorrow = await Borrow.findOne({
            student_id: studentIdNum,
            book_id: bookIdNum,
            status: 'borrowed'
        });
        
        if (existingBorrow) {
            return res.status(400).json({ error: 'Student already has this book' });
        }
        
        // Generate unique borrow_id
        let borrow_id;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!isUnique && attempts < maxAttempts) {
            borrow_id = await getNextSequence('borrow_id');
            
            // Check if this ID already exists
            const existing = await Borrow.findOne({ borrow_id: borrow_id });
            if (!existing) {
                isUnique = true;
            } else {
                console.log(`Duplicate borrow_id ${borrow_id} found, retrying...`);
            }
            attempts++;
        }
        
        if (!isUnique) {
            return res.status(500).json({ error: 'Failed to generate unique borrow ID. Please try again.' });
        }
        
        // Create borrow record
        const borrow = new Borrow({
            borrow_id: borrow_id,
            student_id: studentIdNum,
            book_id: bookIdNum,
            borrow_date: borrow_date || new Date()
        });
        
        await borrow.save();
        
        // Update book available quantity
        book.available_quantity--;
        await book.save();
        
        console.log(`✅ Borrow record created with ID: ${borrow_id}`);
        res.status(201).json({ 
            success: true, 
            message: 'Book borrowed successfully',
            borrow: borrow 
        });
        
    } catch (error) {
        console.error('Error borrowing book:', error);
        
        // Handle duplicate key error specifically
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Duplicate borrow record. Please try again.' });
        }
        
        res.status(400).json({ error: error.message });
    }
});

// Return a book
router.put('/return/:borrow_id', async (req, res) => {
    try {
        const borrowIdNum = parseInt(req.params.borrow_id);
        const { return_date } = req.body;
        
        const borrow = await Borrow.findOne({ borrow_id: borrowIdNum });
        if (!borrow) {
            return res.status(404).json({ error: 'Borrow record not found' });
        }
        
        if (borrow.status === 'returned') {
            return res.status(400).json({ error: 'Book already returned' });
        }
        
        borrow.return_date = return_date || new Date();
        borrow.status = 'returned';
        await borrow.save();
        
        // Update book available quantity
        const book = await Book.findOne({ book_id: borrow.book_id });
        book.available_quantity++;
        await book.save();
        
        res.json({ success: true, message: 'Book returned successfully', borrow });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all borrow records
router.get('/borrow', async (req, res) => {
    try {
        const borrows = await Borrow.find().sort({ borrow_date: -1 });
        
        // Populate with student and book details
        const borrowsWithDetails = await Promise.all(borrows.map(async (borrow) => {
            const student = await Student.findOne({ student_id: borrow.student_id });
            const book = await Book.findOne({ book_id: borrow.book_id });
            return {
                ...borrow.toObject(),
                student_name: student ? student.name : 'Unknown',
                student_class: student ? student.class : 'Unknown',
                book_title: book ? book.title : 'Unknown',
                book_author: book ? book.author : 'Unknown'
            };
        }));
        
        res.json(borrowsWithDetails);
    } catch (error) {
        console.error('Error fetching borrow records:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get borrowing report
router.get('/reports/borrowing', async (req, res) => {
    try {
        const { start_date, end_date, status } = req.query;
        
        let query = {};
        
        if (start_date && end_date) {
            query.borrow_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }
        
        if (status) {
            query.status = status;
        }
        
        const borrows = await Borrow.find(query).sort({ borrow_date: -1 });
        
        // Populate with details
        const reportData = await Promise.all(borrows.map(async (borrow) => {
            const student = await Student.findOne({ student_id: borrow.student_id });
            const book = await Book.findOne({ book_id: borrow.book_id });
            return {
                borrow_id: borrow.borrow_id,
                student_name: student ? student.name : 'Unknown',
                student_class: student ? student.class : 'Unknown',
                book_title: book ? book.title : 'Unknown',
                book_author: book ? book.author : 'Unknown',
                borrow_date: borrow.borrow_date,
                return_date: borrow.return_date,
                status: borrow.status,
                days_borrowed: borrow.return_date ? 
                    Math.ceil((borrow.return_date - borrow.borrow_date) / (1000 * 60 * 60 * 24)) : 
                    Math.ceil((new Date() - borrow.borrow_date) / (1000 * 60 * 60 * 24))
            };
        }));
        
        res.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get currently borrowed books
router.get('/borrow/current', async (req, res) => {
    try {
        const borrowed = await Borrow.find({ status: 'borrowed' });
        
        const borrowedDetails = await Promise.all(borrowed.map(async (borrow) => {
            const student = await Student.findOne({ student_id: borrow.student_id });
            const book = await Book.findOne({ book_id: borrow.book_id });
            return {
                borrow_id: borrow.borrow_id,
                student_name: student ? student.name : 'Unknown',
                student_id: borrow.student_id,
                book_title: book ? book.title : 'Unknown',
                book_id: borrow.book_id,
                borrow_date: borrow.borrow_date,
                days_borrowed: Math.ceil((new Date() - borrow.borrow_date) / (1000 * 60 * 60 * 24))
            };
        }));
        
        res.json(borrowedDetails);
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;