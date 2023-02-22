const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');

exports.getUserHistoryReview = catchAsync(async (req, res, next) => {
    const userDocs = req.user.historyReview;

    const userReviewDocs = await Document.find({
        _id: { $in: userDocs.map((usr) => usr.docId) },
    });

    if (!userReviewDocs) {
        return res.status(400).json({
            status: 'error',
            message: 'Listu dokumenata nije moguće prikazati',
        });
    }

    return res.status(200).json({
        status: 'success',
        userReviewDocs,
        userDocs,
    });
});
