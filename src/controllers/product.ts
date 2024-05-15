import { RequestHandler } from "express";
import ProductModel from "src/models/product";
import { sendErrorResponse } from "src/utils/helper";

export const listNewPRoduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate } = req.body;
  //create new product without needing thumbnail or image
  const newProduct = new ProductModel({
    name,
    price,
    category,
    description,
    purchasingDate,
  });

  const { images } = req.files;

  let invalidFileType = false;

  //check if more than one image
  if (Array.isArray(images)) {
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

  //save to db
  await newProduct.save();
};
