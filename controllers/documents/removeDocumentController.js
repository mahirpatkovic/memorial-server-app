const Document = require('../../models/documentModel');
const catchAsync = require('../../utils/catchAsync');
const aws = require('aws-sdk');
const awsS3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const bucketName = process.env.AWS_BUCKET_NAME;

exports.removeDocument = catchAsync(async (req, res, next) => {
    const { docId } = req.params;
    const document = await Document.findById(docId);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Nepostojeći dokument',
        });
    }

    const params = document.files.map((file) => {
        return {
            Bucket: `${bucketName}/${document.fileType}-uploads`,
            Key: file.split('/')[1],
        };
    });

    await Promise.all(
        params.map((param) => awsS3.deleteObject(param).promise())
    );

    await Document.findByIdAndDelete(docId);

    return res.status(200).json({
        status: 'success',
        message: 'Dokument i fajlovi uspješno izbrisani',
    });
});
