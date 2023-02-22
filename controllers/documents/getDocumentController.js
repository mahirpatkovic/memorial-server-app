const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');
const aws = require('aws-sdk');
const awsS3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const bucketName = process.env.AWS_BUCKET_NAME;

exports.getAllDocuments = catchAsync(async (req, res, next) => {
    const allDocuments = await Document.find();

    if (!allDocuments) {
        return res.status(400).json({
            status: 'error',
            message: 'Listu dokumenata nije moguće prikazati',
        });
    }

    return res.status(200).json({
        status: 'success',
        allDocuments,
    });
});

exports.getDocument = catchAsync(async (req, res, next) => {
    const { docId } = req.params;
    const document = await Document.findById(docId);

    const user = req.user;
    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Nepostojeći dokument',
        });
    }

    let params = [];
    document.files.forEach((file, i) => {
        // if (document.fileType === 'document') {
        params.push({
            Bucket: `${bucketName}/${file.split('/')[0]}`,
            Key: `${file.split('/')[1]}`, // File name you want to get from S3
            Expires: 3600,
        });
        // } else {
        //     params.push(
        //         `https://${bucketName}.s3.eu-central-1.amazonaws.com/${file}`
        //     );
        // }
    });

    // let fileData;
    // if (document.fileType === 'document') {
    // fileData = await Promise.all(
    //     params.map((param) =>
    //         awsS3
    //             .getObject(param)
    //             .promise()
    //             .then((data) => {
    //                 console.log(data);
    //                 let buf = Buffer.from(data.Body);
    //                 let base64 = buf.toString('base64');
    //                 return base64;
    //             })
    //     )
    // );
    // }

    if (user.role === 'reader') {
        document.visits++;
        document.lastVisit = Date.now();

        await document.save();
    }

    user.historyReview.unshift({ docId, time: new Date(Date.now()) });

    let filteredDocs = [];
    user.historyReview.forEach((doc) => {
        let i = filteredDocs.findIndex((idx) => idx.docId === doc.docId);
        if (i <= -1) {
            filteredDocs.push({ docId: doc.docId, time: doc.time });
        }
    });

    user.historyReview = filteredDocs.slice(0, 10);

    await user.save();

    let fileData = [];

    if (
        document.publicAccess ||
        user.role === 'editor' ||
        user.role === 'admin' ||
        user.approvedDocuments.includes(docId)
    ) {
        // if (document.fileType === 'document') {
        fileData = await Promise.all(
            params.map((param) =>
                awsS3
                    .getSignedUrlPromise('getObject', param)
                    .then((data) => data)
            )
        );
        document.files = fileData;
        // } else {
        //     document.files = params;
        // }
    } else {
        document.files = [];
    }

    // console.log(document.files);
    return res.status(200).json({
        status: 'success',
        document,
    });
});

exports.getApprovedDocuments = catchAsync(async (req, res, next) => {
    const currentUser = req.user;

    const userFilteredDocs = await Document.find({
        $or: [
            { _id: currentUser.approvedDocuments },
            { _id: currentUser.pendingDocuments },
            { publicAccess: true },
        ],
        $and: [{ active: true }],
    });

    if (!userFilteredDocs) {
        return res.status(400).json({
            status: 'error',
            message: 'Listu dokumenata nije moguće prikazati',
        });
    }

    return res.status(200).json({
        status: 'success',
        userFilteredDocs,
    });
});
