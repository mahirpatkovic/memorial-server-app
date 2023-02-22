const catchAsync = require('../../utils/catchAsync');
const tokenController = require('./createSignToken');

exports.isLoggedIn = catchAsync(async (req, res, next) => {
    if (req.user) {
        return tokenController.createSendToken(req.user, 202, req, res);
    } else {
        return res.status(401).json({
            message: 'Nepostojeći korisnik.',
        });
    }
    // next();
});
