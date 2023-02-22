const Request = require('../models/requestModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const allUsers = await User.find();

    if (!allUsers) {
        return res.status(400).json({
            status: 'error',
            message: 'Listu korisnika nije moguće prikazati',
        });
    }

    return res.status(200).json({
        status: 'success',
        allUsers,
    });
});

exports.deactivateUser = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja korisnika',
        });
    }

    user.removed = true;

    await user.save();

    return res.status(200).json({
        status: 'success',
        message: 'Korisnik uspješno deaktiviran',
        user,
    });
});

exports.activateUser = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja korisnika',
        });
    }

    user.removed = false;

    await user.save();

    return res.status(200).json({
        status: 'success',
        message: 'Korisnik uspješno aktiviran',
        user,
    });
});

exports.userEditorAdd = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja korisnika',
        });
    }

    user.role = 'editor';

    await user.save();

    return res.status(200).json({
        status: 'success',
        message: 'Uređivanje korisnika uspješno',
        user,
    });
});

exports.userEditorRemove = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja korisnika',
        });
    }

    user.role = 'reader';

    await user.save();

    return res.status(200).json({
        status: 'success',
        message: 'Uređivanje korisnika uspješno',
        user,
    });
});

exports.updateUserProfile = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.body.id, req.body.values, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja profila',
        });
    }

    return res.status(200).json({
        status: 'success',
        message: 'Profil uspješno uređen.',
        user,
    });
});

exports.removeUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    await Request.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
        status: 'success',
        message: 'Korisnik je uspješno izbrisan',
    });
});
