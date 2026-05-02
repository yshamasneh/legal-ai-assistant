/**
 * Wrapper للدوال async
 * يلتقط الأخطاء تلقائياً ويرسلها للـ errorHandler
 *
 * الاستخدام:
 * app.get("/users", asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;