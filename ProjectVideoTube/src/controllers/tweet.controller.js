import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id;

    const trimmedContent = content.trim();
    if (trimmedContent === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    const tweet = await Tweet.create({
        content: trimmedContent,
        owner: userId,
    });

    if (!tweet) throw new ApiError(500, "Error creating Tweet");

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) throw new ApiError(404, "User not found");

    const tweets = await Tweet.aggregate([
        {
            $match: { owner: user._id },
        },
        { $sort: { createdAt: -1 } },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetId");

    const trimmedContent = content.trim();
    if (trimmedContent === "")
        throw new ApiError(400, "Tweet content cannot be empty");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (req.user._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(
            401,
            "Unauthorised access: Tweet does not belong to the user"
        );
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content: trimmedContent },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetId");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");

    if (req.user._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(
            401,
            "Unauthorised access: Tweet does not belong to the user"
        );
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { message: "Tweet deleted successfully" },
                "Tweet deleted successfully"
            )
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
