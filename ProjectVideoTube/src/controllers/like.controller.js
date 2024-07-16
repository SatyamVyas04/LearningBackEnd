import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(404, "Video not found");

    try {
        const preLiked = await Like.findOneAndDelete({
            video: videoId,
            likedBy: req.user._id,
        });

        if (preLiked) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Unliked successfully"));
        }

        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });

        if (!like)
            throw new ApiError(500, "Internal Server Error while liking");

        return res
            .status(200)
            .json(new ApiResponse(200, like, "Like posted successfully"));
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!commentId) throw new ApiError(404, "Comment not found");

    try {
        const preLiked = await Like.findOneAndDelete({
            comment: commentId,
            likedBy: req.user._id,
        });

        if (preLiked) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Unliked successfully"));
        }

        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        });

        if (!like)
            throw new ApiError(500, "Internal Server Error while liking");

        return res
            .status(200)
            .json(new ApiResponse(200, like, "Like posted successfully"));
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!tweetId) throw new ApiError(404, "Tweet not found");

    try {
        const preLiked = await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy: req.user._id,
        });

        if (preLiked) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Unliked successfully"));
        }

        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        });

        if (!like)
            throw new ApiError(500, "Internal Server Error while liking");

        return res
            .status(200)
            .json(new ApiResponse(200, like, "Like posted successfully"));
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const aggregatePipeline = [
            {
                $match: { likedBy: req.user._id },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videos",
                },
            },
        ];

        const likedVideos = Like.aggregate(aggregatePipeline);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    likedVideos,
                    "Liked videos fetched successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, `Internal Server Error: ${error.message}`);
    }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
