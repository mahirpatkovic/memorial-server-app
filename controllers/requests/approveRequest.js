const User = require('../../models/userModel');
const Request = require('../../models/requestModel');
const catchAsync = require('../../utils/catchAsync');

exports.approveRequest = catchAsync(async (req, res, next) => {
    const { id, userId, docId, type } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom odobravanja zahtjeva',
        });
    }

    const pendingAccessIndex = user.pendingDocuments.indexOf(docId);
    const pendingDownloadIndex = user.pendingDownload.indexOf(docId);

    if (pendingAccessIndex > -1) {
        user.pendingDocuments.splice(pendingAccessIndex, 1); // 2nd parameter means remove one item only
    } else if (pendingDownloadIndex > -1) {
        user.pendingDownload.splice(pendingDownloadIndex, 1);
    }

    if (type === 'access') {
        user.approvedDocuments.push(docId);
    } else {
        user.approvedDownload.push(docId);
    }

    await user.save();
    await Request.findByIdAndDelete(id);

    return res.status(200).json({
        status: 'success',
        message: `Zahjev za ${
            type === 'access' ? 'pregled' : 'preuzimanje'
        } je uspješno odobren`,
    });
});
