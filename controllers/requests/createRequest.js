const catchAsync = require('../../utils/catchAsync');
const Request = require('../../models/requestModel');

exports.createRequest = catchAsync(async (req, res, next) => {
    const { reason, user, document, type } = req.body;
    const currentUser = req.user;

    const newRequest = new Request({ reason, user, document, type });
    await newRequest.save();

    if (type === 'access') {
        currentUser.pendingDocuments.push(newRequest.document);
    } else {
        currentUser.pendingDownload.push(newRequest.document);
    }

    await currentUser.save();

    return res.status(200).json({
        status: 'success',
        message: `Zahjev za ${
            type === 'access' ? 'pregled' : 'preuzimanje'
        } je uspješno poslan`,
        currentUser,
    });
});
