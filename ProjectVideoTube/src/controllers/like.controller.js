import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked successfully"));
    }

    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId))
        throw new ApiError(400, "Invalid Comment ID");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    const existingLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment unliked successfully"));
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    const existingLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Tweet unliked successfully"));
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const aggregatePipeline = [
        {
            $match: { likedBy: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        { $unwind: "$video" },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                "video._id": 1,
                "video.title": 1,
                "video.description": 1,
                "video.thumbnail": 1,
                "video.videoFile": 1,
            },
        },
    ];

    const likedVideos = await Like.aggregate(aggregatePipeline);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
