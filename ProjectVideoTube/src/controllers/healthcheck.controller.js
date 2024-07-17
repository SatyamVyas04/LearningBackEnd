import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        res.status(200, new ApiResponse(200, {}, "Server is running fine!"));
    } catch (error) {
        throw new ApiError(501, "Server Error! Please try again later");
    }
});

export { healthcheck };
