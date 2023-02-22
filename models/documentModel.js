const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        documentName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        ownership: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        keyWords: {
            type: String,
            required: true,
        },
        documentSize: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        uploadedBy: String,
        visits: {
            type: Number,
            default: 0,
        },
        searchNumber: {
            type: Number,
            default: 0,
        },
        active: Boolean,
        files: [Object],
        publicAccess: Boolean,
        lastEdit: {
            type: Date,
            default: Date.now(),
        },
        lastVisit: Date,
        editedBy: String,
        downloadNumber: {
            type: Number,
            default: 0,
        },
        downloadedBy: [Object],
    },
    { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
