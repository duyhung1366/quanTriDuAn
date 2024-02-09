
import { Storage } from "@google-cloud/storage";
import { Router } from "express";
import moment from "moment";
import Multer from "multer";
import asyncHandler from "../../utils/asyncHandler";

const uploadGoogleCloudRouter = Router();


const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        type: "service_account",
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    }
});

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
});


const uploadImage = (
    file: Express.Multer.File,
    _baseFolder = process.env.GOOGLE_CLOUD_STORAGE_BASE_FORDER!,
    skipDateStructure = false,
    keepOriginFileName = false,
    disableAttachment = false
): Promise<string> => {
    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME!);
    return new Promise((resolve, reject) => {
        const { originalname, buffer } = file;
        const _fileName = `${moment().format("hh-mm-ss")}/${originalname}`
        const fileName = !skipDateStructure
            ? `${moment().format("YYYY_MM_DD")}/${_fileName}`
            : `${moment().format("YYYY_MM_DD")}_${_fileName}`;
        const baseFolder = _baseFolder.endsWith('/') ? _baseFolder : `${_baseFolder}/`;
        const blob = bucket.file(baseFolder + fileName);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                ...(disableAttachment ? {} : { contentDisposition: "attachment" }),
                metadata: {
                    originalBytes: file.size,
                },
            },
            resumable: false, // disable resumable for file size < 10MB.
        });

        blobStream
            .on("finish", async () => {
                await blob.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                resolve(publicUrl);
            })
            .on("error", (err) => {
                reject(new Error(`Unable to upload image, something went wrong ${err}`));
            })
            .end(buffer);
    });
};


uploadGoogleCloudRouter.post(
    "/upload-image-ckeditor",
    multer.single("upload"),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            res.status(400).send("No file uploaded.");
            return;
        }
        console.log("email ", process.env.CLIENT_EMAIL)
        const baseFolder = (req.query.baseFolder || req.body.baseFolder) ? (req.query.baseFolder || req.body.baseFolder) as string : undefined;
        const skipDateStructure = (["true", "false"].includes(req.query.skipDateStructure || req.body.skipDateStructure)) ? !!JSON.parse(req.query.skipDateStructure || req.body.skipDateStructure) : false;
        const keepOriginFileName = (["true", "false"].includes(req.query.keepOriginFileName || req.body.keepOriginFileName)) ? !!JSON.parse(req.query.keepOriginFileName || req.body.keepOriginFileName) : false;
        const disableAttachment = (["true", "false"].includes(req.query.disableAttachment || req.body.disableAttachment)) ? !!JSON.parse(req.query.disableAttachment || req.body.disableAttachment) : false;
        const imageUrl = await uploadImage(req.file, baseFolder, skipDateStructure, keepOriginFileName, disableAttachment);
        // console.log('imageUrl ', imageUrl)
        res.status(200).json({
            fileName: req.file.originalname,
            url: imageUrl,
            uploaded: 1,
        });
    })
);



export { uploadGoogleCloudRouter as imageRouter };
