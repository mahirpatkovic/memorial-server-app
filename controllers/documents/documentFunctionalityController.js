const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');

exports.approvePublicAccess = catchAsync(async (req, res, next) => {
    const { docId } = req.body;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja dokumenta',
        });
    }

    document.publicAccess = true;
    document.lastEdit = Date.now();

    await document.save();

    return res.status(200).json({
        status: 'success',
        message: 'Uređivanje dokumenta uspješno',
        document,
    });
});

exports.forbidPublicAccess = catchAsync(async (req, res, next) => {
    const { docId } = req.body;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja dokumenta',
        });
    }

    document.publicAccess = false;
    document.lastEdit = Date.now();

    await document.save();

    return res.status(200).json({
        status: 'success',
        message: 'Uređivanje dokumenta uspješno',
        document,
    });
});

exports.deleteDocument = catchAsync(async (req, res, next) => {
    const { docId } = req.body;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja dokumenta',
        });
    }

    document.active = false;
    document.lastEdit = Date.now();

    await document.save();

    return res.status(200).json({
        status: 'success',
        message: 'Uređivanje dokumenta uspješno',
        document,
    });
});

exports.searchDocument = catchAsync(async (req, res, next) => {
    const { query } = req.body;

    // full text search query
    // let searchQuery = { $text: { $search: query } };

    // partial text search query
    let regexQuery = { documentName: { $regex: new RegExp(query, 'i') } };

    Document.find(regexQuery, async (err, docs) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: 'Problem prilikom pretraživanja dokumenata',
            });
        }
        let tmpDocArr = [];
        for (let doc of docs) {
            if (
                doc.active ||
                req.user.role === 'editor' ||
                req.user.role === 'admin'
            ) {
                tmpDocArr.push(doc);
                if (req.user.role === 'reader') {
                    doc.searchNumber++;
                }

                await doc.save();
            }
        }

        return res.status(200).json({
            status: 'success',
            documents: tmpDocArr,
        });
    });
});
