import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id;

    if (content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    const tweet = await Tweet.create({ content, owner: userId });

    if (!tweet) throw new ApiError(500, "Internal Server Error creating Tweet");

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) throw new ApiError(400, "UserId invalid");

    const user = await User.findById({ userId });
    if (!user) throw new ApiError(404, "User not found");

    const aggregatePipeline = [
        {
            $match: { owner: user._id },
        },
        { $sort: { createdAt: -1 } },
    ];

    const tweet = await Tweet.aggregate(aggregatePipeline);

    if (!tweet)
        throw new ApiError(500, "Internal Server Error fetching tweets");

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetId");

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: { content },
        },
        { new: true }
    );

    if (!tweet) throw new ApiError(500, "Internal Server Error updating Tweet");

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetId");

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) throw new ApiError(500, "Internal Server Error deleting Tweet");

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
