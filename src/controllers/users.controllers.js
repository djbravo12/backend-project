import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { fileUploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespone } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in database");
  }
};

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

  const { email, userName, fullName, password } = req.body;
  console.log(req.body);

  if (email === "") {
    throw new ApiError(400, "Email is required");
  }
  if (userName === "") {
    throw new ApiError(400, "userName is required");
  }
  if (fullName == "") {
    throw new ApiError(400, "fullName is required");
  }
  if (password == "") {
    throw new ApiError(400, "fullName is required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with email address or username already exist"
    );
  }

  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is requried");
  }

  const avatar = await fileUploadOnCloudinary(avatarLocalPath);
  const coverImage = await fileUploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Avatar is Requried");
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // Take email and password input from the user
  // verify the email and password
  // check the refresh token and access token is given to user or not
  // if given then verify the refresh token
  // Allow user to use the website with the give access token

  const { email, userName, password } = req.body;

  if (!(email || userName)) {
    throw new ApiError(400, "Email and UserName required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(405, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(
      new ApiRespone(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Login Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(new ApiRespone(200, {}, "User Logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.body.refreshToken || req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unautharized Access");
    }

    const decodeToken = jwt.verify(
      incomingRefreshToken,
      env.proccess.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new ApiRespone(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRespone(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(new ApiRespone(200, user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All field are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email: email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespone(200, user, "Account details updated successfulyy"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await fileUploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespone(200, user, "Avatar upload successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await fileUploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on CoverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespone(200, user, "Cover Image upload successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
