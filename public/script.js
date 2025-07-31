
let currentDocumentData = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showStatus(message, type = 'loading') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function hideStatus() {
    document.getElementById('status-message').style.display = 'none';
}

function updateContentStats() {
    const contentTextarea = document.getElementById('content-text');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const tokenEstimate = document.getElementById('token-estimate');
    
    if (!contentTextarea) return;
    
    const text = contentTextarea.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const tokens = Math.ceil(chars / 4);
    
    if (charCount) charCount.textContent = `${chars.toLocaleString()} characters`;
    if (wordCount) wordCount.textContent = `${words.toLocaleString()} words`;
    if (tokenEstimate) tokenEstimate.textContent = `~${tokens.toLocaleString()} tokens`;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

function validateForm() {
    const title = document.getElementById('content-title').value.trim();
    const author = document.getElementById('content-author').value.trim();
    const contentType = document.getElementById('content-type').value;
    const contentText = document.getElementById('content-text').value.trim();
    
    if (!title) {
        showStatus('Please enter a title', 'error');
        return false;
    }
    
    if (!author) {
        showStatus('Please enter an author', 'error');
        return false;
    }
    
    if (!contentType) {
        showStatus('Please select a content type', 'error');
        return false;
    }
    
    if (!contentText) {
        showStatus('Please enter the content text', 'error');
        return false;
    }
    
    return true;
}

// ============================================================================
// DOCUMENT CREATION
// ============================================================================

function createDocumentStructure() {
    const title = document.getElementById('content-title').value.trim();
    const author = document.getElementById('content-author').value.trim();
    const contentType = document.getElementById('content-type').value;
    const language = document.getElementById('content-language').value;
    const publisher = document.getElementById('content-publisher').value.trim();
    const isbn = document.getElementById('content-isbn').value.trim();
    const genre = document.getElementById('content-genre').value.trim();
    const chapter = document.getElementById('content-chapter').value.trim();
    const sourceUrl = document.getElementById('content-url').value.trim();
    const weight = parseInt(document.getElementById('training-weight').value);
    const contentText = document.getElementById('content-text').value.trim();
    
    const documentId = `text_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentDate = new Date().toISOString();
    
    return {
        document_id: documentId,
        content_text: contentText,
        attribution: {
            author: author,
            title: title,
            publisher: publisher || null,
            isbn: isbn || null,
            publication_date: null,
            source_url: sourceUrl || null,
            content_type: contentType
        },
        content_metadata: {
            language: language,
            topic_category: ["other"], // Could be enhanced with topic detection
            genre: genre || null,
            chapter_section: chapter || null,
            page_numbers: null
        },
        copyright_compliance: {
            license_status: "user_provided",
            fair_use_assessment: "not_assessed",
            opt_out_status: {
                has_opted_out: false,
                opt_out_mechanism: "not_applicable",
                last_checked: currentDate
            },
            compliance_date: currentDate
        },
        provenance: {
            acquisition_date: currentDate,
            acquisition_method: "manual_input",
            original_publication_date: currentDate,
            data_lineage: [
                {
                    step: "Manual text input via corpus tool",
                    timestamp: currentDate,
                    tool_used: "text-corpus-tool v1.0"
                }
            ]
        },
        training_metadata: {
            token_count: Math.ceil(contentText.length / 4),
            character_count: contentText.length,
            processing_status: "ready_for_training",
            weighting: weight
        },
        ai_act_compliance: {
            summary_included: true,
            transparency_level: "full_disclosure",
            documented_for_authorities: true
        },
        created_at: currentDate,
        updated_at: currentDate,
        version: 1
    };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

function generatePreview() {
    if (!validateForm()) {
        return;
    }
    
    try {
        currentDocumentData = createDocumentStructure();
        showPreview(currentDocumentData);
        showStatus('Preview generated successfully!', 'success');
        
    } catch (error) {
        showStatus('Error generating preview: ' + error.message, 'error');
    }
}

function showPreview(data) {
    const previewSection = document.getElementById('preview-section');
    const contentInfoDiv = document.getElementById('content-info-display');
    const schemaContentDiv = document.getElementById('schema-content');
    
    contentInfoDiv.innerHTML = `
        <p><strong>Title:</strong> ${data.attribution.title}</p>
        <p><strong>Author:</strong> ${data.attribution.author}</p>
        <p><strong>Content Type:</strong> ${data.attribution.content_type}</p>
        <p><strong>Language:</strong> ${data.content_metadata.language}</p>
        <p><strong>Publisher:</strong> ${data.attribution.publisher || 'Not specified'}</p>
        <p><strong>ISBN:</strong> ${data.attribution.isbn || 'Not specified'}</p>
        <p><strong>Genre:</strong> ${data.content_metadata.genre || 'Not specified'}</p>
        <p><strong>Chapter/Section:</strong> ${data.content_metadata.chapter_section || 'Not specified'}</p>
        <p><strong>Source URL:</strong> ${data.attribution.source_url || 'Not specified'}</p>
        <p><strong>Content Length:</strong> ${data.training_metadata.character_count} chars</p>
        <p><strong>Estimated Tokens:</strong> ${data.training_metadata.token_count}</p>
        <p><strong>Training Weight:</strong> ${data.training_metadata.weighting}</p>
    `;
    
    schemaContentDiv.textContent = JSON.stringify(data, null, 2);
    
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

function cancelPreview() {
    document.getElementById('preview-section').style.display = 'none';
    currentDocumentData = null;
    hideStatus();
}

function clearForm() {
    if (confirm('Are you sure you want to clear all form data?')) {
        document.getElementById('content-title').value = '';
        document.getElementById('content-author').value = '';
        document.getElementById('content-type').value = '';
        document.getElementById('content-language').value = 'en-US';
        document.getElementById('content-publisher').value = '';
        document.getElementById('content-isbn').value = '';
        document.getElementById('content-genre').value = '';
        document.getElementById('content-chapter').value = '';
        document.getElementById('content-url').value = '';
        document.getElementById('training-weight').value = '1';
        document.getElementById('content-text').value = '';
        
        updateContentStats();
        cancelPreview();
        
        showStatus('Form cleared successfully!', 'success');
    }
}

async function insertDocument() {
    if (!currentDocumentData) {
        showStatus('No data to insert', 'error');
        return;
    }
    
    const insertBtn = document.getElementById('insert-btn');
    insertBtn.disabled = true;
    insertBtn.textContent = 'Inserting...';
    showStatus('Inserting document to MongoDB...', 'loading');
    
    try {
        const response = await fetch('/api/insert-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentDocumentData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to insert document');
        }
        
        const result = await response.json();
        showStatus(`✅ Successfully inserted document! ID: ${result.insertedId}`, 'success');
        
        setTimeout(() => {
            clearForm();
        }, 2000);
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Insert error:', error);
    } finally {
        insertBtn.disabled = false;
        insertBtn.textContent = '💾 Insert to MongoDB';
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    const contentTextarea = document.getElementById('content-text');
    if (contentTextarea) {
        contentTextarea.addEventListener('input', updateContentStats);
    }
    
    // Initialize stats display
    updateContentStats();
});