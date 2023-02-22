const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../../utils/catchAsync');
const Email = require('../../utils/email');

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email }).select(
        '+active'
    );
    if (!user) {
        return res.status(403).json({
            message: 'Nepostojeća email adresa',
        });
    } else if (user.removed) {
        return res.status(403).json({
            message: 'Pristup ovom računu je zabranjen, molimo registrujte se!',
        });
    } else if (!user.active) {
        return res.status(404).json({
            message:
                'Vaš profil nije verifikovan, pokušajte se prijaviti kako biste dobili novi verifikacioni token na vašu email adresu',
        });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
        const validationURL = `${
            process.env.NODE_ENV === 'production'
                ? process.env.PROD_API
                : process.env.DEV_API
        }/users/resetPassword/${resetToken}`;
        const validationURLFront = `${
            process.env.NODE_ENV === 'production'
                ? process.env.PROD_HOST
                : process.env.DEV_HOST
        }/resetPassword/${resetToken}`;

        await new Email(
            user,
            validationURL,
            validationURLFront
        ).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: `Reset token je uspješno poslan na vašu email adresu: ${user.email}. Token je validan 10 minuta!`,
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
            message: `Problem prilikom slanja reset tokena na vašu email adresu: ${user.email}. Pokušajte ponovo!`,
        });
    }
    next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { password, passwordConfirm } = req.body;

    // 1) Get user based on the token
    if (password.length < 8)
        return res.status(400).json({
            message: 'Šifra mora da sadrži minimalno 8 karaktera',
        });

    if (password !== passwordConfirm)
        return res.status(400).json({
            message: 'Šifre moraju biti iste',
        });
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return res.status(400).json({
            message:
                'Reset token nije validan ili je istekao, pošaljite zahtjev ponovo!',
        });
    }

    const salt = await bcrypt.genSalt(14);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // 3) Everything ok, send success message
    return res.status(200).json({
        status: 'success',
        message: 'Uspješno ste promjenili vašu šifru.',
    });
});

exports.findResetToken = catchAsync(async (req, res, next) => {
    const { resetToken } = req.body;
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken });

    if (user) {
        return res.status(200).json({
            status: 'success',
            message: 'Pristup dozvoljen',
        });
    }

    return res.status(403).json({
        status: 'error',
        message: 'Pristup odbijen',
    });
});
