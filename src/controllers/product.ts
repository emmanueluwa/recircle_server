import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import cloudUploader from "src/cloud";
import ProductModel from "src/models/product";
import { sendErrorResponse } from "src/utils/helper";

const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
  return cloudUploader.upload(filePath, {
    width: 1280,
    height: 720,
    crop: "fill",
  });
};

export const listNewProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate } = req.body;
  //create new product without needing thumbnail or image
  const newProduct = new ProductModel({
    owner: req.user.id,
    name,
    price,
    category,
    description,
    purchasingDate,
  });

  const { images } = req.files;

  const isMultipleImages = Array.isArray(images);

  //restrict no. of image upload
  if (isMultipleImages && images.length > 5) {
    return sendErrorResponse(res, "Image files cannot be more than 5!", 422);
  }

  let invalidFileType = false;

  //check if more than one image
  if (isMultipleImages) {
    for (let img of images) {
      if (!img.mimetype?.startsWith("image")) {
        invalidFileType = true;
        break;
      }
    }
  } else {
    //case of single file
    if (images) {
      if (!images.mimetype?.startsWith("image")) {
        invalidFileType = true;
      }
    }
  }

  if (invalidFileType)
    return sendErrorResponse(
      res,
      "Invalid file type, files must be images!",
      422
    );

  //upload files
  if (isMultipleImages) {
    const uploadPromise = images.map((file) => uploadImage(file.filepath));
    // handle entire promise
    const uploadResults = await Promise.all(uploadPromise);

    //add image urls and public id to products images field
    newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    newProduct.thumbnail = newProduct.images[0].url;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      newProduct.images = [{ url: secure_url, id: public_id }];
      newProduct.thumbnail = secure_url;
    }
  }

  //save to db
  await newProduct.save();

  //creating object for db = 201
  res.status(201).json({ message: "Added new product" });
};