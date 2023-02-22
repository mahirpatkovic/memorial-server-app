const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: validator.isEmail,
        },
        password: {
            type: String,
            trim: true,
            required: true,
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ['reader', 'editor', 'admin'],
            default: 'reader',
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        dob: { type: Date, required: true },
        gender: {
            type: String,
            enum: ['male', 'female'],
        },
        country: {
            type: String,
            required: true,
        },
        organization: {
            type: String,
        },
        registrationPurpose: {
            type: String,
            required: true,
        },
        address: String,
        city: String,
        about: String,
        visits: {
            type: Number,
            default: 0,
        },
        approvedDocuments: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Document',
            },
        ],
        pendingDocuments: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Document',
            },
        ],
        approvedDownload: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Document',
            },
        ],
        pendingDownload: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Document',
            },
        ],
        historyReview: [Object],
        validationToken: String,
        validationTokenExpires: Date,
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: false,
            select: false,
        },
        removed: {
            type: Boolean,
            default: false,
        },
        loginHistory: [Date],
        loginDate: {
            type: Date,
            default: Date.now(),
        },
    },
    { timestamps: true }
);

userSchema.methods.createValidationConfirmToken = function () {
    const validToken = crypto.randomBytes(32).toString('hex');

    this.validationToken = crypto
        .createHash('sha256')
        .update(validToken)
        .digest('hex');

    this.validationTokenExpires = Date.now() + 10 * 60 * 1000;

    return validToken;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
