import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "src/cloud";
import ProductModel from "src/models/product";
import { UserDocument } from "src/models/user";
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

export const updateProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate, thumbnail } =
    req.body;
  const productId = req.params.id;
  if (!isValidObjectId(productId))
    return sendErrorResponse(res, "Invalid product id!", 422);

  const product = await ProductModel.findOneAndUpdate(
    { _id: productId, owner: req.user.id },
    { name, price, category, description, purchasingDate },
    { new: true }
  );
  if (!product) return sendErrorResponse(res, "Product not found!", 404);

  if (typeof thumbnail === "string") product.thumbnail = thumbnail;

  const { images } = req.files;
  const isMultipleImages = Array.isArray(images);

  //restrict no. of image upload
  if (isMultipleImages) {
    const oldImages = product.images?.length || 0;
    if (oldImages + images.length > 5)
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
    const newImages = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    if (product.images) product.images.push(...newImages);
    else product.images = newImages;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      if (product.images)
        product.images.push({ url: secure_url, id: public_id });
      else product.images = [{ url: secure_url, id: public_id }];
    }
  }

  //save to db
  await product.save();

  //creating object for db = 201
  res.status(201).json({ message: "Product updated successfully!" });
};

export const deleteProduct: RequestHandler = async (req, res) => {
  //check product is valid
  const productId = req.params.id;
  if (!isValidObjectId(productId))
    return sendErrorResponse(res, "Invalid product id!", 422);

  //check if product created by user requesting
  const product = await ProductModel.findOneAndDelete({
    _id: productId,
    owner: req.user.id,
  });

  if (!product) return sendErrorResponse(res, "Product not found!", 404);

  const images = product.images || [];
  if (images.length) {
    const ids = images.map(({ id }) => id);
    await cloudApi.delete_resources(ids);
  }

  //creating object for db = 201
  res.json({ message: "Product removed successfully!" });
};

export const deleteProductImage: RequestHandler = async (req, res) => {
  //check product is valid
  const { productId, imageId } = req.params;
  if (!isValidObjectId(productId))
    return sendErrorResponse(res, "Invalid product id!", 422);

  //remove from db
  const product = await ProductModel.findOneAndUpdate(
    { _id: productId, owner: req.user.id },
    //loop through images and pull out value that matches given id
    { $pull: { images: { id: imageId } } },
    { new: true }
  );

  if (!product) return sendErrorResponse(res, "Invalid image id!", 422);

  //update thumbnail if deleted
  if (product.thumbnail?.includes(imageId)) {
    const images = product.images;
    if (images) product.thumbnail = images[0].url;
    product.thumbnail = "";
    await product.save();
  }

  //remove from cloud storage
  await cloudUploader.destroy(imageId);

  res.json({ message: "Image removed successfully!" });
};

export const getProductDetail: RequestHandler = async (req, res) => {
  //check product is valid
  const { id } = req.params;
  if (!isValidObjectId(id))
    return sendErrorResponse(res, "Invalid product id!", 422);

  //using User document as owner
  const product = await ProductModel.findById(id).populate<{
    owner: UserDocument;
  }>("owner");
  if (!product) return sendErrorResponse(res, "Product not found!", 404);

  res.json({
    product: {
      id: product._id,
      name: product.name,
      description: product.description,
      thumbnail: product.thumbnail,
      category: product.category,
      date: product.purchasingDate,
      price: product.price,
      images: product.images?.map((url) => url),
      seller: {
        id: product.owner._id,
        name: product.owner.name,
        avatar: product.owner.avatar?.url,
      },
    },
  });
};
