const Document = require('../../models/documentModel');
const path = require('path');
const catchAsync = require('../../utils/catchAsync');
const multer = require('multer');
const aws = require('aws-sdk');
const awsS3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const bucketName = process.env.AWS_BUCKET_NAME;

// const maxSize = 30 * 1024 * 1024;

const fileUpload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //     fileSize: maxSize, // 30000000 Bytes = 30 MB
    // },
    fileFilter(req, file, cb) {
        // upload these file formats
        if (
            !file.originalname.match(
                /\.(mp4|MPEG-4|mov|mkv|avi|flv|png|jpg|jpeg|gif|mp3|aac|wav|wma|pdf|doc|docx|txt)$/
            )
        ) {
            return cb(
                new Error('Vaš uploadovani fajl nije podržan, pokušajte ponovo')
            );
        }
        cb(undefined, true);
    },
});

exports.uploadFiles = fileUpload.array('files', 5);

exports.createDocument = catchAsync(async (req, res, next) => {
    const {
        documentName,
        description,
        ownership,
        active,
        location,
        publicAccess,
        keyWords,
        fileType,
        fileSize,
        uploadedBy,
        userId,
    } = req.body;
    if (
        !documentName ||
        !description ||
        !ownership ||
        !location ||
        !keyWords ||
        !fileType
    ) {
        return res
            .status(400)
            .json({ message: 'Molimo popunite sva polja za upload dokumenta' });
    } else if (!req.files) {
        return res.status(400).json({
            status: 'error',
            message: 'Vaš upload ne sadrži fajl, pokušajte ponovo',
            data: [],
        });
    } else {
        // Setting up S3 upload parameters
        const params = req.files.map((file, i) => {
            return {
                Bucket: `${bucketName}/${fileType}-uploads`,
                Key: `${fileType}${i}-${userId}-${Date.now()}${path.extname(
                    file.originalname
                )}`, // File name you want to save as in S3
                Body: file.buffer,
            };
        });

        // Uploading files to the bucket
        const fileData = await Promise.all(
            params.map((param) => awsS3.upload(param).promise())
        );

        const newDocument = new Document({
            documentName,
            description,
            ownership,
            documentSize: fileSize,
            location,
            active,
            publicAccess,
            keyWords,
            fileType,
            uploadedBy,
            files: fileData.map((file) => file.Key),
        });

        await newDocument.save();

        return res.status(200).json({
            message: 'Dokument uspješno uploadovan',
            data: newDocument,
        });
    }
});
