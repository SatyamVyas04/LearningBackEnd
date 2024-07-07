import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend based off of user model
    // Validation of user details - not empty
    // Check is user already exists or not : username/email
    // Check for Images, Check for Avatar
    // Upload them to Cloudinary and fetch response
    // Create user object - create entry in db
    // Remove password and refresh token field from response
    // Check for user creation
    // Return res

    // Step 1: Getting Details
    // console.log(req.body);
    const { fullname, email, username, password } = req.body;

    // Step 2: Empty field check
    if (
        [fullname, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Step 3: Existing user check
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    // Step 4: Check avatar and cover images
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required");
    }

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image File is required");
    }

    // Step 5: Upload the media on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Step 6: Check again
    if (!avatar) {
        throw new ApiError(400, "Avatar File is required");
    }

    if (!coverImage) {
        throw new ApiError(400, "Cover Image File is required");
    }

    // Step 7: Enter data into the DB
    const user = await User.create({
        fullname,
        avatar: avatar.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // Step 8: Check user creation
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // Step 9: Return proper output
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User successfully created"));
});

const loginUser = asyncHandler(async (req, res) => {
    // Request Body Date
    // Check all field values
    // Find the User in Mongo
    // Password Check in Mongo
    // Generate Access and Refresh Token
    // Return Access and Refresh Token
    // Send Cookies

    // Step 1: Retrieve Req Data
    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "Username or Email is Required");
    }

    if (!password) throw new ApiError("400", "Password is Required");

    // Step 2: Finding User
    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Step 3: Check Password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Credentials");
    }

    // Step 4: Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    // Step 5: Returning Tokens with Cookies
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // Finding the user by decoding received bearer token from the auth middleware
    // Updating the refresh token
    // Sending response

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        },
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
