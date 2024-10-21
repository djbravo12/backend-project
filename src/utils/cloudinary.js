import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_APIKEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SCRETE,
});

const fileUploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log(`File is upload on cloudinary ${response.url}`);
    console.log(response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    // console.log(error);
    return null;
  }
};

export { fileUploadOnCloudinary };
