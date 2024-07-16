import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };

        const aggregatePipeline = [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] },
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes",
                },
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" },
                },
            },
            {
                $project: {
                    content: 1,
                    owner: 1,
                    createdAt: 1,
                    likesCount: 1,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
        ];

        const comments = await Comment.aggregatePaginate(
            Comment.aggregate(aggregatePipeline),
            options
        );

        return res
            .status(200)
            .json(
                new ApiResponse(200, comments, "Comments fetched successfully")
            );
    } catch (error) {
        throw new ApiError(500, "Server Error fetching comments");
    }
});

const addComment = asyncHandler(async (req, res) => {
    const { video } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content cannot be empty");
    }

    const comment = await Comment.create({
        content,
        video,
        owner: req.user._id,
    });

    const createdComment = await Comment.findById(comment._id);

    if (!createdComment) {
        throw new ApiError(
            500,
            "Something went wrong while registering the comment"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, createdComment, "Comment successfully posted")
        );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Content cannot be empty");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    comment.content = content;
    const updatedComment = await comment.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findByIdAndDelete({ _id: commentId });
    if (!comment) throw new ApiError(404, "Comment not found");
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
