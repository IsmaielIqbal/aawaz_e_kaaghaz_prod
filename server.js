const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Get port from environment variable (important for Render)
const PORT = process.env.PORT || 3000;

// Enhanced CORS for production
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins in production for now (you can restrict later)
        return callback(null, true);
    },
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static('uploads'));

// Storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Sample data
let users = [
    {
        id: 1,
        username: "zainabkhan",
        displayName: "Zainab Khan",
        bio: "Poet and writer from Kashmir",
        avatar: "https://randomuser.me/api/portraits/women/32.jpg",
        worksCount: 1,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        username: "sameerahmed",
        displayName: "Sameer Ahmed", 
        bio: "Photographer capturing Kashmir's beauty",
        avatar: "https://randomuser.me/api/portraits/men/45.jpg",
        worksCount: 1,
        createdAt: new Date().toISOString()
    }
];

let works = [
    {
        id: 1,
        title: "Whispers of the Chinar",
        author: "Zainab Khan",
        authorUsername: "zainabkhan",
        authorImage: "https://randomuser.me/api/portraits/women/32.jpg",
        category: "poetry",
        description: "A collection of verses inspired by the beauty and resilience of Kashmir, weaving together nature, love, and longing.",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
        tags: ["Kashmir", "Nature", "Love", "Resilience"],
        likes: 24,
        date: "3 days ago",
        liked: false,
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
    },
    {
        id: 2,
        title: "Through the Lens of Paradise", 
        author: "Sameer Ahmed",
        authorUsername: "sameerahmed",
        authorImage: "https://randomuser.me/api/portraits/men/45.jpg",
        category: "photography",
        description: "A visual journey through the valleys and mountains of Kashmir, capturing moments of everyday life and breathtaking landscapes.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
        tags: ["Kashmir", "Landscape", "Travel", "Nature"],
        likes: 42,
        date: "1 week ago", 
        liked: false,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
    }
];

// API Routes

// Get all works
app.get('/api/works', (req, res) => {
    res.json(works);
});

// Get all users
app.get('/api/users', (req, res) => {
    res.json(users);
});

// Add new user
app.post('/api/users', upload.single('avatar'), (req, res) => {
    try {
        const { username, displayName, bio } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = {
            id: Date.now(),
            username,
            displayName: displayName || username,
            bio: bio || '',
            avatar: req.file ? `/uploads/${req.file.filename}` : `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`,
            worksCount: 0,
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload new work
app.post('/api/works', upload.single('media'), (req, res) => {
    try {
        const { title, authorUsername, category, description, tags } = req.body;
        
        if (!title || !authorUsername || !category || !description) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const author = users.find(u => u.username === authorUsername);
        if (!author) {
            return res.status(400).json({ error: 'Author not found' });
        }
        
        const work = {
            id: Date.now(),
            title,
            author: author.displayName,
            authorUsername: author.username,
            authorImage: author.avatar,
            category,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            mediaUrl: req.file ? `/uploads/${req.file.filename}` : '',
            mediaType: req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'video') : 'image',
            likes: 0,
            date: 'Just now',
            timestamp: Date.now()
        };

        // If no file uploaded, use a default image
        if (!req.file) {
            const defaultImages = {
                poetry: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                photography: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                stories: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
                filmmaking: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
            };
            work.image = defaultImages[category] || defaultImages.poetry;
        }
        
        author.worksCount = (author.worksCount || 0) + 1;
        works.unshift(work);
        res.json({ success: true, work });
    } catch (error) {
        console.error('Error uploading work:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like a work
app.post('/api/works/:id/like', (req, res) => {
    try {
        const workId = parseInt(req.params.id);
        const work = works.find(w => w.id === workId);
        
        if (work) {
            work.likes = (work.likes || 0) + 1;
            res.json({ success: true, likes: work.likes });
        } else {
            res.status(404).json({ error: 'Work not found' });
        }
    } catch (error) {
        console.error('Error liking work:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        users: users.length,
        works: works.length,
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Aawaz e Kaaghaz server running on port ${PORT}`);
    console.log(`📝 API available at: http://localhost:${PORT}/api`);
    console.log(`🌐 Website available at: http://localhost:${PORT}`);
    console.log(`✅ Sample data loaded: ${users.length} users, ${works.length} works`);
});