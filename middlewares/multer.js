import multer from "multer";

export const singleUpload = multer({
    storage:multer.memoryStorage()
}).single("file");