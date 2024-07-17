import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId))
        throw new ApiError(404, "Channel not found");

    const currentStatus = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
    });

    if (!currentStatus) {
        const subscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id,
        });

        if (!subscription) {
            throw new ApiError(
                500,
                `Internal Server Error subscribing to the channel`
            );
        }
    } else {
        const unsub = await Subscription.findOneAndDelete({
            channel: channelId,
            subscriber: req.user?._id,
        });

        if (!unsub) {
            throw new ApiError(
                500,
                `Internal Server Error unsubscribing to the channel`
            );
        }
    }

    let responseMessage;
    responseMessage = currentStatus
        ? "Channel Unsubscribed"
        : "Channel Subscribed";

    return res.status(200).json(new ApiResponse(200, {}, responseMessage));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId))
        throw new ApiError(404, "Channel not found");

    const aggregationPipeline = [
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        { $unwind: "$subscriberDetails" },
        {
            $project: {
                "subscriberDetails.username": 1,
                "subscriberDetails.avatar": 1,
            },
        },
    ];

    const channelSubs = await Subscription.aggregate(aggregationPipeline);
    if (!channelSubs) {
        throw new ApiError(500, "Internal Server Error fetching subscribers");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelSubs,
                "Subscribers fetched successfully"
            )
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId))
        throw new ApiError(404, "Subscriber not found");

    const aggregationPipeline = [
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        { $unwind: "$channelDetails" },
        {
            $project: {
                "channelDetails.username": 1,
                "channelDetails.avatar": 1,
            },
        },
    ];
    const subbedChannels = await Subscription.aggregate(aggregationPipeline);
    if (!subbedChannels) {
        throw new ApiError(500, "Internal Server Error fetching subscribers");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subbedChannels,
                "Subscribers fetched successfully"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
