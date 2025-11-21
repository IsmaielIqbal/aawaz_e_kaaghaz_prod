const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Helper function to read database
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If database doesn't exist, create with default structure
        const defaultData = {
            submissions: [],
            published_works: [],
            users: [
                {
                    username: "admin",
                    password: "admin123",
                    role: "admin"
                }
            ]
        };
        await writeDatabase(defaultData);
        return defaultData;
    }
}

// Helper function to write database
async function writeDatabase(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes

// Submit work
app.post('/api/submit-work', async (req, res) => {
    try {
        const db = await readDatabase();
        const submission = {
            ...req.body,
            id: Date.now().toString(),
            status: 'pending',
            submittedAt: new Date().toISOString()
        };
        
        db.submissions.push(submission);
        await writeDatabase(db);
        
        res.json({ success: true, message: 'Work submitted successfully' });
    } catch (error) {
        console.error('Error submitting work:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Admin login
app.post('/api/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await readDatabase();
        
        const user = db.users.find(u => u.username === username && u.password === password);
        if (user) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all submissions
app.get('/api/get-submissions', async (req, res) => {
    try {
        const db = await readDatabase();
        res.json(db);
    } catch (error) {
        console.error('Error getting submissions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single submission
app.get('/api/get-submission/:id', async (req, res) => {
    try {
        const db = await readDatabase();
        const submission = db.submissions.find(s => s.id === req.params.id);
        
        if (submission) {
            res.json(submission);
        } else {
            res.status(404).json({ success: false, message: 'Submission not found' });
        }
    } catch (error) {
        console.error('Error getting submission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Approve submission
app.post('/api/approve-submission', async (req, res) => {
    try {
        const { submissionId } = req.body;
        const db = await readDatabase();
        
        const submissionIndex = db.submissions.findIndex(s => s.id === submissionId);
        if (submissionIndex === -1) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        
        const submission = db.submissions[submissionIndex];
        submission.status = 'approved';
        
        // Add to published works
        const publishedWork = {
            ...submission,
            publishedAt: new Date().toISOString(),
            publishedId: `work_${Date.now()}`
        };
        
        db.published_works.push(publishedWork);
        await writeDatabase(db);
        
        res.json({ success: true, message: 'Work approved and published' });
    } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reject submission
app.post('/api/reject-submission', async (req, res) => {
    try {
        const { submissionId } = req.body;
        const db = await readDatabase();
        
        const submissionIndex = db.submissions.findIndex(s => s.id === submissionId);
        if (submissionIndex === -1) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        
        db.submissions[submissionIndex].status = 'rejected';
        await writeDatabase(db);
        
        res.json({ success: true, message: 'Work rejected' });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Unpublish work
app.post('/api/unpublish-work', async (req, res) => {
    try {
        const { workId } = req.body;
        console.log('=== UNPUBLISH SERVER DEBUG ===');
        console.log('Received workId:', workId);
        console.log('Type of workId:', typeof workId);
        
        const db = await readDatabase();
        
        console.log('Total published works:', db.published_works.length);
        console.log('All published work IDs:', db.published_works.map(w => w.publishedId));
        
        // Find the work in published_works
        const workIndex = db.published_works.findIndex(w => {
            console.log(`Comparing: "${w.publishedId}" (type: ${typeof w.publishedId}) with "${workId}" (type: ${typeof workId})`);
            return w.publishedId === workId;
        });
        
        console.log('Work index found:', workIndex);
        
        if (workIndex === -1) {
            console.log('❌ Work not found in published works');
            return res.status(404).json({ 
                success: false, 
                message: `Work not found. Looking for: "${workId}". Available works: ${db.published_works.map(w => w.publishedId).join(', ')}` 
            });
        }
        
        const work = db.published_works[workIndex];
        console.log('✅ Found work:', work.workTitle);
        
        // Find the original submission and update its status
        const submissionIndex = db.submissions.findIndex(s => s.id === work.id);
        if (submissionIndex !== -1) {
            db.submissions[submissionIndex].status = 'unpublished';
            console.log('✅ Updated submission status to unpublished');
        } else {
            console.log('⚠️ Original submission not found, but continuing with unpublish');
        }
        
        // Remove from published works
        const removedWork = db.published_works.splice(workIndex, 1)[0];
        await writeDatabase(db);
        
        console.log('✅ Work unpublished successfully:', removedWork.workTitle);
        console.log('Remaining published works:', db.published_works.length);
        console.log('=== END UNPUBLISH SERVER DEBUG ===');
        
        res.json({ 
            success: true, 
            message: `"${removedWork.workTitle}" unpublished successfully` 
        });
        
    } catch (error) {
        console.error('❌ Error unpublishing work:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error: ' + error.message 
        });
    }
});

// Get published works for magazine
app.get('/api/published-works', async (req, res) => {
    try {
        const db = await readDatabase();
        res.json(db.published_works);
    } catch (error) {
        console.error('Error getting published works:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single published work for admin
app.get('/api/get-work/:id', async (req, res) => {
    try {
        const db = await readDatabase();
        const work = db.published_works.find(w => w.publishedId === req.params.id);
        
        if (work) {
            res.json(work);
        } else {
            res.status(404).json({ success: false, message: 'Work not found' });
        }
    } catch (error) {
        console.error('Error getting work:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get single published work for public view
app.get('/api/work/:id', async (req, res) => {
    try {
        const db = await readDatabase();
        const work = db.published_works.find(w => w.publishedId === req.params.id);
        
        if (work) {
            res.json(work);
        } else {
            res.status(404).json({ success: false, message: 'Work not found' });
        }
    } catch (error) {
        console.error('Error getting work:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/pages/admin.html`);
    console.log(`Submit work: http://localhost:${PORT}/pages/submit-work.html`);
    console.log(`Magazine: http://localhost:${PORT}/pages/magazine.html`);
});