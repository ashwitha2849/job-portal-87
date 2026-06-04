import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname) || '.pdf';
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});
const upload = multer({ storage });
export default upload;