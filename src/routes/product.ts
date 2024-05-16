import { Router } from "express";
import { listNewProduct, updateProduct } from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validate";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();

productRouter.post(
  "/list",
  isAuth,
  fileParser,
  validate(newProductSchema),
  listNewProduct
);

productRouter.patch(
  "/:id",
  isAuth,
  fileParser,
  validate(newProductSchema),
  updateProduct
);

export default productRouter;
