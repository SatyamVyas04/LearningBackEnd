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
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video File is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail File is required");
    }

    try {
        const [videoFile, thumbnail] = await Promise.all([
            uploadOnCloudinary(videoLocalPath),
            uploadOnCloudinary(thumbnailLocalPath),
        ]);

        if (!videoFile) {
            throw new ApiError(400, "Video File upload failed");
        }

        if (!thumbnail) {
            throw new ApiError(400, "Thumbnail File upload failed");
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

        if (!video) {
            throw new ApiError(500, "Internal Server Error creating video");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video published successfully"));
    } catch (error) {
        if (videoFile?.url) await deleteFromCloudinary(videoFile.url);
        if (thumbnail?.url) await deleteFromCloudinary(thumbnail.url);
        throw new ApiError(500, error.message);
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

    const user = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { title, description },
        },
        { new: true }
    );

    if (!req.file?.path) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Video Details updated successfully")
            );
    }

    let curr_file_location = await Video.findById(videoId);
    curr_file_location = curr_file_location.thumbnail;
    const response = await deleteFromCloudinary(curr_file_location);
    console.log(response);

    const newThumbnailLocalPath = req.file?.path;
    if (!newThumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }

    const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on Avatar");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Video Details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const deleteVideo = await Video.findById(videoId);
    await deleteFromCloudinary(deleteVideo.videoFile);
    await deleteFromCloudinary(deleteVideo.thumbnail);
    const video = await Video.findByIdAndDelete(videoId);

    if (!video) throw new ApiError(400, "Video Not Found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) throw new ApiError(400, "VideoId cannot be empty");

    try {
        const video = await Video.findById(videoId);

        const currentStatus = video.isPublished;

        video.isPublished = !currentStatus;

        await video.save({ validateBeforeSave: false });

        const responseMessage = currentStatus
            ? "Video UnPublished"
            : "Video Published";

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
