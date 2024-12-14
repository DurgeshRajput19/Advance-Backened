import { asyncHandler } from "../utils/asynchandles.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadfile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccsessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      506,
      "Something is wrong while generating accses and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from user

  const { fullname, email, password, username } = req.body;

  console.log(email);

  //validation of details not empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "fullname is required");
  }

  //user alredy exist  either email or username

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existedUser) {
    throw new ApiError(409, "User with email already exist");
  }

  //check for images , or avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverimageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverimageLocalPath = req.files.coverimage[0];
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //upload to cloudinary,avatar

  const avatar = await uploadfile(avatarLocalPath);

  const coverImage = await uploadfile(coverimageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object - create entry in DB

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverImage?.url || "",
    email,
    password,
    username: username,
  });

  //check for user cretation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken" //remove password and refresh token field from response
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong in registration");
  }

  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body data

  const { username, email, password } = req.body;

  //username or email

  if (!username || !email) {
    throw new ApiError(400, "Username or Password is Required");
  }

  //find the user

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User doesnot exist");
  }

  //password check

  const isPassvalid = await user.isPasscorrect(password);
  if (!isPassvalid) {
    throw new ApiError(401, "Wrong Password ");
  }

  //access and refresh token

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //send cookies

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
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );

  //response
});

const logOutUser = asyncHandler(async (req, res) => {
  //create middleware to logout user
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

export { registerUser, loginUser, logOutUser };
