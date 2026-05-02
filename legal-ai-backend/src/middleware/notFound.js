import ApiError from "../utils/ApiError.js";

/**
 * Not Found Middleware
 * يلتقط أي طلب على route غير موجود
 */
const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route not found: ${req.originalUrl}`);
  next(error);
};

export default notFound;