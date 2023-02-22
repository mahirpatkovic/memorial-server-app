const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema(
    {
        reason: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        document: {
            type: mongoose.Schema.ObjectId,
            ref: 'Document',
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: ['access', 'download'],
        },
    },
    { timestamps: true }
);

documentRequestSchema.pre(/^find/, function (next) {
    this.populate('user').populate('document');
    next();
});

const Request = mongoose.model('Request', documentRequestSchema);

module.exports = Request;
