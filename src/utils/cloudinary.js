import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadfile = async (path) => {
  try {
    if (!path) return null;
    //upload file
    const response = await cloudinary.uploader.upload(path, {
      resource_type: "auto",
    });

    console.log("file upload successfully", response.url);

    return response;
  } catch (error) {
    fs.unlinkSync(path); //remove local save temporary file if upload operation got failed
  }
};

export { uploadfile };
