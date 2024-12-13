import { asyncHandler } from "../utils/asynchandles.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadfile } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/Apiresponse.js"

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
  const coverimageLocalPath = req.files?.coverimage[0]?.path;

  if (!avatarLocalPath) {
     throw new ApiError(400 , "Avatar file is required")
  } 

  //upload to cloudinary,avatar

  const avatar = await uploadfile (avatarLocalPath)
  const coverImage = await uploadfile (coverimageLocalPath)
  if (!avatar) {
    throw new ApiError(400 , "Avatar file is required")
  }
  
  //create user object - create entry in DB
  
  const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username,

  })
 
 //check for user cretation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"//remove password and refresh token field from response
  )

  if (!createdUser) {
    throw new ApiError(500 , "Something went wrong in registration")
  }

  //return response
  return res.status(201).json(
  new ApiResponse(200 , createdUser, "User registered successfully" ) 
  )


});

export { registerUser };
