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

        // Extract public ID using URL parsing
        const url = new URL(fileLink);
        const pathSegments = url.pathname.split("/");
        const filename = pathSegments[pathSegments.length - 1];
        const publicId = filename.split(".")[0];

        // Determine resource type (image or video)
        const resourceType = fileLink.includes("/video/") ? "video" : "image";

        // Delete from Cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        console.log(`${publicId} is deleted from Cloudinary (${resourceType})`);
        return response;
    } catch (error) {
        throw new Error(`Failed to delete file: ${error}`);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
