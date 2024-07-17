import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const healthcheck = asyncHandler(async (req, res) => {
    const dbStatus =
        mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    const healthStatus = {
        uptime: process.uptime(),
        responsetime: process.hrtime(),
        message: "OK",
        databaseStatus: dbStatus,
        timestamp: Date.now(),
    };

    res.status(200).json(
        new ApiResponse(200, healthStatus, "Health check successful")
    );
});

export { healthcheck };
