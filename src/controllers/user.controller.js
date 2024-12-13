import {asyncHandler}  from "../utils/asynchandles.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "hello from durgesh",
  });
});

export { registerUser };
