const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../../utils/catchAsync');
const Email = require('../../utils/email');
const tokenController = require('./createSignToken');
const moment = require('moment');

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
        return res.status(400).json({ message: 'Molimo popunite sva polja.' });
    }

    // 2) Check if user exists && password is correct
    let user = await User.findOne({ email })
        .select('+password')
        .select('+active');
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({
            message: 'Pogrešan email ili šifra! Pokušajte ponovo',
        });
    } else if (!user.active) {
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

            user.password = undefined;
            return res.status(200).json({
                status: 'success',
                message: `Vaš profil nije verifikovan! Uspješno je poslan novi verifikacioni token na vašu email adresu: ${user.email}. Token je validan 10 minuta!`,
                user,
            });
        } catch (err) {
            return res.status(500).json({
                status: 'error',
                message: `Problem prilikom slanja verifikacionog tokena na vašu email adresu: ${user.email}. Pokušajte ponovo!`,
            });
        }
    } else if (user.removed) {
        return res.status(400).json({
            status: 'error',
            message: 'Pristup ovom računu je zabranjen, molimo registrujte se!',
        });
    } else {
        user.visits++;
        user.loginDate = Date.now();

        let tmpLoginHistory = [];

        for (let log of user.loginHistory) {
            const dayDiff = moment(new Date(Date.now()))
                .startOf('day')
                .diff(moment(log).startOf('day'), 'days');
            if (dayDiff === 0) {
                continue;
            }
            if (dayDiff < 7) {
                tmpLoginHistory.push(log);
            }
        }
        tmpLoginHistory.push(new Date(Date.now()));
        user.loginHistory = tmpLoginHistory;

        await user.save();
        tokenController.createSendToken(user, 200, req, res);
    }
});

exports.logout = (req, res) => {
    res.clearCookie('token');
    // res.clearCookie('_csrf');

    res.status(200).json({ status: 'success' });
};
