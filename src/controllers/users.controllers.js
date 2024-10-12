import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { fileUploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespone } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  // });
  // Get user response from frontend
  // Validation - not empty
  // Check if user already exist: username, Email
  // Check for images, Check for avatar
  // Upload them to cloudinary, avatar
  // Create user Object = create entry in MongoDb
  // Remove password and refresh token remove from response
  // Check for user creation
  // Return res

  const { email, userName, fullName } = req.body;
  console.log(`email: ${email}`);

  if (email === "") {
    throw new ApiError(400, "Email is required");
  }
  if (userName === "") {
    throw new ApiError(400, "userName is required");
  }
  if (fullName == "") {
    throw new ApiError(400, "fullName is required");
  }

  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with email address or username already exist"
    );
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!imageLocalPath) {
    throw new ApiError(400, "Avatar is requried");
  }

  const avatar = await fileUploadOnCloudinary(avatarLocalPath);
  const coverImage = await fileUploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is Requried");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Somewent wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiRespone(createdUser, 200, "User Registered"));
});

export default registerUser;
