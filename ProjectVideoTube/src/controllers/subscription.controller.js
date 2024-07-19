import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // console.log("Toggle Subscription - Channel ID:", channelId);

    if (!isValidObjectId(channelId)) {
        // console.log("Invalid channel ID");
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        const currentStatus = await Subscription.findOne({
            channel: channelId,
            subscriber: req.user?._id,
        });
        // console.log("Current Subscription Status:", currentStatus);

        let subscription;
        if (!currentStatus) {
            subscription = await Subscription.create({
                channel: channelId,
                subscriber: req.user?._id,
            });
            // console.log("Subscribed to Channel:", subscription);
        } else {
            subscription = await Subscription.findOneAndDelete({
                channel: channelId,
                subscriber: req.user?._id,
            });
            // console.log("Unsubscribed from Channel:", subscription);
        }

        if (!subscription) {
            // console.log("Error processing subscription");
            throw new ApiError(500, "Error processing subscription");
        }

        const responseMessage = currentStatus
            ? "Channel Unsubscribed"
            : "Channel Subscribed";
        return res.status(200).json(new ApiResponse(200, {}, responseMessage));
    } catch (error) {
        // console.error("Error toggling subscription:", error.message);
        throw new ApiError(500, error.message || "Error toggling subscription");
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.user?._id;
    // console.log("Get User Channel Subscribers - Channel ID:", channelId);

    if (!isValidObjectId(channelId)) {
        // console.log("Invalid channel ID");
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        if (req.user?._id.toString() !== channelId.toString()) {
            // console.log("Unauthorized access");
            throw new ApiError(403, "Unauthorized access");
        }

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
        // console.log("Subscribers:", channelSubs);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channelSubs,
                    "Subscribers fetched successfully"
                )
            );
    } catch (error) {
        // console.error("Error fetching subscribers:", error.message);
        throw new ApiError(500, error.message || "Error fetching subscribers");
    }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user?._id;
    // console.log("Get Subscribed Channels - Subscriber ID:", subscriberId);

    if (!isValidObjectId(subscriberId)) {
        // console.log("Invalid subscriber ID");
        throw new ApiError(400, "Invalid user ID");
    }

    try {
        const aggregationPipeline = [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId),
                },
            },
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
        const subbedChannels =
            await Subscription.aggregate(aggregationPipeline);
        // console.log("Subscribed Channels:", subbedChannels);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subbedChannels,
                    "Subscribed channels fetched successfully"
                )
            );
    } catch (error) {
        // console.error("Error fetching subscribed channels:", error.message);
        throw new ApiError(
            500,
            error.message || "Error fetching subscribed channels"
        );
    }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
