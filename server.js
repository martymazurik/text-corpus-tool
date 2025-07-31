const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large text content
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import services
const MongoService = require('./services/mongoservice');

// Initialize services
const mongoService = new MongoService(process.env.MONGODB_URI);

// ============================================================================
// ROUTES
// ============================================================================

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Insert text document to MongoDB
app.post('/api/insert-document', async (req, res) => {
    try {
        const document = req.body;
        
        // Validation
        if (!document.content_text || !document.attribution) {
            return res.status(400).json({ 
                error: 'Missing required fields: content_text and attribution' 
            });
        }

        if (!document.attribution.title || !document.attribution.author) {
            return res.status(400).json({ 
                error: 'Missing required attribution fields: title and author' 
            });
        }

        // Ensure timestamps are Date objects
        document.created_at = new Date();
        document.updated_at = new Date();
        
        // Ensure version is set
        if (!document.version) {
            document.version = 1;
        }
        
        const result = await mongoService.insertDocument(document);
        
        console.log(`✅ Inserted document: ${document.attribution.title} by ${document.attribution.author}`);
        
        res.json({ 
            success: true, 
            insertedId: result.insertedId,
            message: 'Document successfully added to corpus'
        });
        
    } catch (error) {
        console.error('Error inserting document:', error);
        
        // Handle specific MongoDB errors
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        
        res.status(500).json({ 
            error: 'Failed to insert document: ' + error.message 
        });
    }
});

// Get collection statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await mongoService.getCollectionStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch collection statistics' });
    }
});

// Get recent documents (optional endpoint for admin/debugging)
app.get('/api/documents', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const documents = await mongoService.findDocuments({}, limit);
        
        // Return only metadata, not full content
        const documentSummaries = documents.map(doc => ({
            document_id: doc.document_id,
            title: doc.attribution.title,
            author: doc.attribution.author,
            content_type: doc.attribution.content_type,
            created_at: doc.created_at,
            character_count: doc.training_metadata.character_count,
            weighting: doc.training_metadata.weighting
        }));
        
        res.json(documentSummaries);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Test MongoDB connection
        await mongoService.connect();
        res.json({ 
            status: 'healthy', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down server...');
    try {
        await mongoService.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Text Content Corpus Tool running on http://localhost:${PORT}`);
    console.log(`📚 Ready to process books, articles, and text content`);
    console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/corpora'}`);
});