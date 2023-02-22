const Document = require('../models/documentModel');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
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
    // console.log(document);

    if (!document) {
        return res.status(400).json({
            status: 'error',
            message: 'Nepostojeći dokument',
        });
    }

    let params = [];
    let fileData = [];
    document.files.forEach((file, i) => {
        if (file.startsWith('document')) {
            // console.log(file);
            params.push({
                Bucket: `${bucketName}/${file.split('/')[0]}`,
                Key: `${file.split('/')[1]}`, // File name you want to get from S3
                Expires: 10,
            });
        } else {
            fileData.push(
                `https://memorialapp.s3.eu-central-1.amazonaws.com/${file}`
            );
        }
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

    if (document.fileType === 'document') {
        console.log(document);
        fileData = await Promise.all(
            params.map((param) =>
                awsS3
                    .getSignedUrlPromise('getObject', param)
                    .then((data) => data)
            )
        );
    }
    console.log(fileData);
    document.visits++;
    document.lastVisit = Date.now();

    await document.save();

    document.files = fileData;

    return res.status(200).json({
        status: 'success',
        document,
    });
});

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
        if (err)
            return res.status(400).json({
                status: 'error',
                message: 'Problem prilikom pretraživanja dokumenata',
            });

        for (let doc of docs) {
            doc.searchNumber++;
            await doc.save();
        }

        return res.status(200).json({
            status: 'success',
            documents: docs,
        });
    });
});
