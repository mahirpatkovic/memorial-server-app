const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');
const moment = require('moment');

exports.getDocsStats = catchAsync(async (req, res, next) => {
    const allDocs = await Document.find();

    if (!allDocs) {
        return res.status(400).json({
            status: 'error',
            message: 'Statistiku pregleda dockumenata nije moguće prikazati',
        });
    }

    const totalDocs = allDocs.length;

    let publicDocs = 0,
        privateDocs = 0,
        lastDayDocsVisits = 0;

    const mostSearchedDocs = [...allDocs]
        .sort((a, b) => b.searchNumber - a.searchNumber)
        .splice(0, 10);

    const sortedDocs = [...allDocs]
        .sort((a, b) => b.visits - a.visits)
        .splice(0, 10);

    const mostDownloadedDocs = [...allDocs]
        .sort((a, b) => b.downloadNumber - a.downloadNumber)
        .splice(0, 10);

    [...allDocs].forEach((doc) => {
        const dayDiff = moment(new Date(Date.now()))
            .startOf('day')
            .diff(moment(doc.lastVisit).startOf('day'), 'days');

        if (dayDiff === 0) {
            lastDayDocsVisits++;
        }
    });

    allDocs.forEach((doc) => (doc.publicAccess ? publicDocs++ : privateDocs++));

    return res.status(200).json({
        status: 'success',
        totalDocs,
        publicDocs,
        privateDocs,
        sortedDocs,
        mostSearchedDocs,
        lastDayDocsVisits,
        mostDownloadedDocs,
    });
});
