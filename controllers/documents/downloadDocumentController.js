const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');
const aws = require('aws-sdk');
const awsS3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const bucketName = process.env.AWS_BUCKET_NAME;

exports.downloadDocument = catchAsync(async (req, res, next) => {
    const { docId } = req.body;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Problem prilikom uređivanja dokumenta',
        });
    }

    const newUser = {
        userId: req.user._id,
        user: `${req.user.firstName} ${req.user.lastName}`,
        time: new Date(Date.now()),
    };

    document.downloadNumber++;

    if (document.downloadedBy.length === 0) {
        document.downloadedBy.push(newUser);
    } else {
        for (let i = 0; i <= document.downloadedBy.length; i++) {
            if (
                document.downloadedBy[i]?.userId.toString() ===
                req.user._id.toString()
            ) {
                document.downloadedBy[i] = newUser;
                break;
            } else {
                document.downloadedBy.push(newUser);
            }
        }
    }
    document.downloadedBy = [...new Set(document.downloadedBy)];
    await document.save();

    let params = [];
    document.files.forEach((file, i) => {
        params.push({
            Bucket: `${bucketName}/${file.split('/')[0]}`,
            Key: `${file.split('/')[1]}`, // File name you want to get from S3
            Expires: 3600,
        });
    });

    const fileData = await Promise.all(
        params.map((param) =>
            awsS3.getSignedUrlPromise('getObject', param).then((data) => data)
        )
    );
    document.files = fileData;

    return res.status(200).json({
        status: 'success',
        message: 'Preuzimanje dokumenta uspješno',
        document,
    });
});
