import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        console.log(file);
        cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
    },
});

export const upload = multer({ storage });
