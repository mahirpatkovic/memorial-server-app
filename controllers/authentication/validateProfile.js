const User = require('../../models/userModel');
const crypto = require('crypto');
const catchAsync = require('../../utils/catchAsync');
const Email = require('../../utils/email');

exports.validateProfile = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        validationToken: hashedToken,
        // validationTokenExpires: { $gt: Date.now() },
    });
    // 2) if there is no user or If there is user and token has expired
    if (!user) {
        return res.status(403).json({
            status: 403,
            message: 'Pristup odbijen',
        });
    } else if (new Date(user.validationTokenExpires) < new Date(Date.now())) {
        return res.status(400).json({
            message: 'Reset token nije validan ili je istekao',
        });
    }
    // 3) Update validation property for the user

    user.validationToken = undefined;
    user.validationTokenExpires = undefined;
    user.active = true;
    await user.save();

    // 4) Send success and message
    return res.status(200).json({
        status: 'success',
        message: 'Uspješno ste verifikovali vaš profil.',
    });
});

exports.resendProfileValidationMail = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        validationToken: hashedToken,
        // validationTokenExpires: { $gt: Date.now() },
    });
    const validToken = crypto.randomBytes(32).toString('hex');

    const newValidationToken = crypto
        .createHash('sha256')
        .update(validToken)
        .digest('hex');

    try {
        const validationURL = `${
            process.env.NODE_ENV === 'production'
                ? process.env.PROD_API
                : process.env.DEV_API
        }/users/validateProfile/${validToken}`;
        const validationURLFront = `${
            process.env.NODE_ENV === 'production'
                ? process.env.PROD_HOST
                : process.env.DEV_HOST
        }/validateProfile/${validToken}`;

        await new Email(
            user,
            validationURL,
            validationURLFront
        ).sendValidateProfile();

        user.validationToken = newValidationToken;
        user.validationTokenExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: `Verifikacioni token je uspješno poslan na vašu email adresu: ${user.email}. Token je validan 10 minuta!`,
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: `Problem prilikom slanja verifikacionog tokena na vašu email adresu: ${user.email}. Pokušajte ponovo!`,
        });
    }
});
