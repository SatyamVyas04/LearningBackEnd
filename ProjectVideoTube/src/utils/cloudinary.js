import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log(process.env.CLOUDINARY_CLOUD_NAME);
// console.log(process.env.CLOUDINARY_API_KEY);
// console.log(process.env.CLOUDINARY_API_SECRET);
// console.log(process.env.CLOUDINARY_LOCATION);

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File is uploaded on Cloudinary:", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

const deleteFromCloudinary = async (fileLink) => {
    try {
        if (!fileLink) return null;
        fileLink = fileLink.replace(`${process.env.CLOUDINARY_LOCATION}`, "");
        fileLink = fileLink.slice(12, -4);
        // console.log("After replacement:", fileLink);

        // Delete from Cloudinary
        const response = await cloudinary.uploader.destroy(fileLink);

        console.log("Current File is deleted from Cloudinary");
        return response;
    } catch (error) {
        throw new Error(`Failed to delete file: ${error}`);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
