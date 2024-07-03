import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // File has been uploaded
        console.log("File is uploaded on Cloudinary");
        console.log("Cloudinary Response", response);
    } catch (error) {
        // Remove the locally saved temp file as the upload operation failed
        fs.unlinkSync(localFilePath);
    }
};

export { uploadOnCloudinary };
