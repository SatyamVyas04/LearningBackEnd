import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
        throw new ApiError(500, "Internal Server Error, while fetching videos");
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
