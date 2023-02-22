const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    let token = null;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (req.headers.authorization.split(' ')[1] === 'null') {
        token = req.cookies.token;
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            message:
                'Niste prijavljeni na vaš račun ili vam je istekao token. Molimo prijavite se.',
        });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return res.status(401).json({
            message: 'Nepostojeći korisnik',
        });
    }

    // 4) Check if user changed password after the token was issued
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //     return res.status(401).json({
    //         message: 'Korisnik je nedavno promjenio šifru. Molimo prijavite se',
    //     });
    // }
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return catchAsync(async (req, res, next) => {
        // roles ['admin', 'editor']. role='user'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Pristup onemogućen, vaš profil nema prava pristupa',
            });
        }

        next();
    });
};
