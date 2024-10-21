import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { fileUploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespone } from "../utils/ApiResponse.js";

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

  const user = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(405, "User does not exist");
  }

  const isPasswordValid = user.isPasswordCorrect(password);

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
  await User.findByIdAndIUpdate(
    req.user?._id,
    { $set: { refreshToken } },
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

export { registerUser, loginUser, logoutUser };
