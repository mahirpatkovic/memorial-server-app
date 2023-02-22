const catchAsync = require('../../utils/catchAsync');
const Request = require('../../models/requestModel');

exports.getAllRequests = catchAsync(async (req, res, next) => {
    const allRequests = await Request.find();

    if (!allRequests) {
        return res.status(400).json({
            status: 'error',
            message: 'Listu zahtjeva nije moguće prikazati',
        });
    }

    return res.status(200).json({
        status: 'success',
        allRequests,
    });
});
