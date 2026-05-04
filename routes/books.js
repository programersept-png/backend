const express = require('express');
const Book = require('../models/Book');
const { getNextSequence } = require('../models/Counter');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Create book - Generate ID manually
router.post('/books', async (req, res) => {
    try {
        const { title, author, quantity } = req.body;
        
        if (!title || !author || !quantity) {
            return res.status(400).json({ error: 'Title, author, and quantity are required' });
        }
        
        // Generate the next book_id
        const book_id = await getNextSequence('book_id');
        
        const book = new Book({
            book_id: book_id,
            title,
            author,
            quantity: parseInt(quantity),
            available_quantity: parseInt(quantity)
        });
        
        await book.save();
        console.log(`Book created with ID: ${book_id}`);
        res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all books
router.get('/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ book_id: 1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single book
router.get('/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const book = await Book.findOne({ book_id: id });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update book
router.put('/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, author, quantity } = req.body;
        
        const book = await Book.findOne({ book_id: id });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (quantity) {
            const quantityDiff = parseInt(quantity) - book.quantity;
            book.quantity = parseInt(quantity);
            book.available_quantity = book.available_quantity + quantityDiff;
        }
        
        if (title) book.title = title;
        if (author) book.author = author;
        
        await book.save();
        res.json(book);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete book
router.delete('/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const book = await Book.findOneAndDelete({ book_id: id });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;