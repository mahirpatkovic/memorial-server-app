const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');
const catchAsync = require('../../utils/catchAsync');
const validator = require('validator');
const Email = require('../../utils/email');

exports.signup = catchAsync(async (req, res, next) => {
    let {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        dob,
        gender,
        country,
        organization,
        registrationPurpose,
    } = req.body;
    if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !phoneNumber ||
        !dob ||
        !gender ||
        !country ||
        !registrationPurpose
    )
        return res
            .status(400)
            .json({ message: 'Molimo popunite sva polja za registraciju' });
    else if (password.length < 8)
        return res.status(400).json({
            message: 'Šifra mora da sadrži minimalno 8 karaktera',
        });

    const existingUser = await User.findOne({ email: email });
    if (existingUser)
        return res.status(400).json({
            message: 'Račun s ovim emailom već postoji.',
        });
    else if (!validator.isEmail(email)) {
        return res.status(400).json({
            message: 'Molimo unesite validan email.',
        });
    }

    let dobDate = new Date(dob);
    dobDate.setMinutes(dobDate.getMinutes() - dobDate.getTimezoneOffset());

    const salt = await bcrypt.genSalt(14);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: passwordHash,
        dob: dobDate,
        gender,
        phoneNumber,
        country,
        organization,
        registrationPurpose,
    });

    const validToken = newUser.createValidationConfirmToken();

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
            newUser,
            validationURL,
            validationURLFront
        ).sendValidateProfile();
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: `Problem prilikom slanja verifikacionog tokena na vašu email adresu: ${newUser.email}.`,
        });
    }

    await newUser.save({ validateBeforeSave: false });
    return res.status(200).json({
        status: 'success',
        message: `Verifikacioni token je uspješno poslan na vašu email adresu: ${newUser.email}. Token je validan 10 minuta!`,
    });
});
