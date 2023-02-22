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

exports.editDocument = catchAsync(async (req, res, next) => {
    const {
        documentName,
        description,
        ownership,
        active,
        location,
        publicAccess,
        keyWords,
        files,
    } = req.body;

    if (!documentName || !description || !ownership || !location || !keyWords) {
        return res.status(400).json({
            message: 'Molimo popunite sva polja za izmjenu dokumenta',
        });
    } else if (!req.files && !files) {
        return res.status(400).json({
            status: 'error',
            message: 'Vaš upload ne sadrži fajl, pokušajte ponovo',
            data: [],
        });
    } else {
        const { docId } = req.body;
        const document = await Document.findById(docId);

        if (!document) {
            return res.status(400).json({
                status: 'error',
                message: 'Nepostojeći dokument',
            });
        }

        if (files) {
            let editedFiles = [];
            let removedFiles = [];

            if (typeof files === 'string') {
                document.files.forEach((docFl) => {
                    if (files.includes(docFl)) {
                        editedFiles.push(docFl);
                    } else {
                        removedFiles.push(docFl);
                    }
                });
            } else {
                for (let file of files) {
                    document.files.forEach((docFl) => {
                        if (file.includes(docFl)) {
                            editedFiles.push(docFl);
                        }
                    });
                }

                document.files.forEach((file) => {
                    if (!editedFiles.includes(file)) {
                        removedFiles.push(file);
                    }
                });
            }

            document.files = editedFiles;
            await document.save();

            if (removedFiles) {
                const params = removedFiles.map((file) => {
                    return {
                        Bucket: `${bucketName}/${document.fileType}-uploads`,
                        Key: file.split('/')[1],
                    };
                });

                await Promise.all(
                    params.map((param) => awsS3.deleteObject(param).promise())
                );
            }
        } else {
            const params = document.files.map((file) => {
                return {
                    Bucket: `${bucketName}/${document.fileType}-uploads`,
                    Key: file.split('/')[1],
                };
            });

            await Promise.all(
                params.map((param) => awsS3.deleteObject(param).promise())
            );

            document.files = [];
            await document.save();
        }

        if (req.files) {
            const params = req.files.map((file, i) => {
                return {
                    Bucket: `${bucketName}/${document.fileType}-uploads`,
                    Key: `${document.fileType}${i}-${
                        req.user._id
                    }-${Date.now()}${path.extname(file.originalname)}`,
                    Body: file.buffer,
                };
            });

            const fileData = await Promise.all(
                params.map((param) => awsS3.upload(param).promise())
            );

            fileData.map((file) => document.files.push(file.Key));
            await document.save();
        }

        const params = document.files.map((file) => {
            return {
                Bucket: `${bucketName}/${document.fileType}-uploads`,
                Key: file.split('/')[1],
            };
        });

        let tmpFileSizeArr = [];
        await Promise.all(
            params.map((param) =>
                awsS3
                    .headObject(param)
                    .promise()
                    .then((data) => {
                        tmpFileSizeArr.push(data.ContentLength);
                    })
            )
        );
        const filesSize = tmpFileSizeArr.reduce((a, b) => a + b, 0);

        document.documentName = documentName;
        document.description = description;
        document.ownership = ownership;
        document.active = active;
        document.location = location;
        document.publicAccess = publicAccess;
        document.keyWords = keyWords;
        document.lastEdit = Date.now();
        document.documentSize = filesSize;
        document.editedBy = req.user.firstName + ' ' + req.user.lastName;
        await document.save();

        return res.status(200).json({
            status: 'success',
            message: 'Dokument uspješno izmjenjen',
            document,
        });
    }
});
