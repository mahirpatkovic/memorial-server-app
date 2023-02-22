const User = require('../../models/userModel');
const catchAsync = require('../../utils/catchAsync');
const bcrypt = require('bcryptjs');

exports.updateUserPassword = catchAsync(async (req, res, next) => {
    const { id, currentPassword, newPassword } = req.body;
    // 1) Get user from collection
    const user = await User.findById(id).select('+password');

    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom promjene šifre',
        });
    }

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
        return res.status(401).json({
            status: 'error',
            message: 'Trenutna šifra nije tačna.',
        });
    }

    // // 3) If so, update password
    const salt = await bcrypt.genSalt(14);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.password = passwordHash;
    await user.save();

    return res.status(200).json({
        status: 'success',
        message: 'Šifra je uspješno promjenjena',
    });
});
