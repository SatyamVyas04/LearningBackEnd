import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        username,
    } = req.query;

    if (!query) {
        throw new ApiError(400, "No Query provided");
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
    };

    const matchedConditions = {
        $text: { $search: query },
        isPublished: true,
    };

    if (username) {
        const user = await User.findOne({ username });
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        matchedConditions.owner = user._id;
    }

    try {
        const aggregationPipeline = [
            { $match: matchedConditions },
            { $sort: options.sort },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            { $unwind: "$owner" },
            {
                $project: {
                    title: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                },
            },
        ];

        const result = await Video.aggregatePaginate(
            Video.aggregate(aggregationPipeline),
            options
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "List of videos fetched based on the query"
                )
            );
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both video and thumbnail files are required");
    }

    try {
        const [videoFile, thumbnail] = await Promise.all([
            uploadOnCloudinary(videoLocalPath),
            uploadOnCloudinary(thumbnailLocalPath),
        ]);

        if (!videoFile || !thumbnail) {
            throw new ApiError(400, "File upload failed");
        }

        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration,
            views: 0,
            isPublished: true,
            owner: req.user._id,
        });

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video published successfully"));
    } catch (error) {
        if (videoFile?.url) await deleteFromCloudinary(videoFile.url);
        if (thumbnail?.url) await deleteFromCloudinary(thumbnail.url);
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username fullname avatar")
        .lean();

    if (!video || !video.isPublished) {
        throw new ApiError(404, "Video not found or is not published");
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const updateFields = { title, description };

    if (req.file?.path) {
        let currFileLocation =
            await Video.findById(videoId).select("thumbnail");
        await deleteFromCloudinary(currFileLocation.thumbnail);

        const thumbnail = await uploadOnCloudinary(req.file.path);
        if (!thumbnail.url) {
            throw new ApiError(400, "Error while uploading the thumbnail");
        }
        updateFields.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video details updated successfully"
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    await Promise.all([
        deleteFromCloudinary(video.videoFile),
        deleteFromCloudinary(video.thumbnail),
    ]);

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) throw new ApiError(400, "VideoId cannot be empty");

    try {
        const video = await Video.findById(videoId);
        if (!video) throw new ApiError(404, "Video not found");

        video.isPublished = !video.isPublished;
        await video.save({ validateBeforeSave: false });

        const responseMessage = video.isPublished
            ? "Video Published"
            : "Video UnPublished";
        return res.status(200).json(new ApiResponse(200, {}, responseMessage));
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
