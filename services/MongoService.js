const { MongoClient } = require('mongodb');

class MongoService {
    constructor(connectionString) {
        this.connectionString = connectionString;
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (!this.client) {
            this.client = new MongoClient(this.connectionString);
            await this.client.connect();
            this.db = this.client.db('corpora');
            console.log('✅ Connected to MongoDB');
        }
        return this.db;
    }

    async insertDocument(document) {
        const db = await this.connect();
        // Changed collection name from 'yt_transcripts' to 'text-corpus'
        const collection = db.collection('text-corpus');
        
        // Check for duplicates based on document_id instead of video_id
        const existing = await collection.findOne({ 
            "document_id": document.document_id 
        });
        
        if (existing) {
            throw new Error('Document with this ID already exists in corpus');
        }

        // Optional: Check for content duplicates (based on title + author + first 100 chars)
        const contentSignature = {
            "attribution.title": document.attribution.title,
            "attribution.author": document.attribution.author,
            "content_text": { $regex: `^${document.content_text.substring(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` }
        };
        
        const duplicateContent = await collection.findOne(contentSignature);
        if (duplicateContent) {
            throw new Error('Similar content already exists in corpus');
        }

        return await collection.insertOne(document);
    }

    async findDocuments(query = {}, limit = 10) {
        const db = await this.connect();
        const collection = db.collection('text-corpus');
        return await collection.find(query).limit(limit).toArray();
    }

    async getDocumentById(documentId) {
        const db = await this.connect();
        const collection = db.collection('text-corpus');
        return await collection.findOne({ document_id: documentId });
    }

    async updateDocument(documentId, updateData) {
        const db = await this.connect();
        const collection = db.collection('text-corpus');
        updateData.updated_at = new Date().toISOString();
        updateData.version = { $inc: { version: 1 } };
        
        return await collection.updateOne(
            { document_id: documentId },
            { $set: updateData, $inc: { version: 1 } }
        );
    }

    async deleteDocument(documentId) {
        const db = await this.connect();
        const collection = db.collection('text-corpus');
        return await collection.deleteOne({ document_id: documentId });
    }

    async getCollectionStats() {
        const db = await this.connect();
        const collection = db.collection('text-corpus');
        
        const stats = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalDocuments: { $sum: 1 },
                    totalCharacters: { $sum: "$training_metadata.character_count" },
                    totalTokens: { $sum: "$training_metadata.token_count" },
                    averageWeight: { $avg: "$training_metadata.weighting" },
                    contentTypes: { $addToSet: "$attribution.content_type" }
                }
            }
        ]).toArray();
        
        return stats[0] || {
            totalDocuments: 0,
            totalCharacters: 0,
            totalTokens: 0,
            averageWeight: 0,
            contentTypes: []
        };
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
}

module.exports = MongoService;