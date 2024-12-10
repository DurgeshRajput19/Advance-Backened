const asynchandler = (handler) => {
  (res, req, next) => {
    Promise.resolve(handler(req, res, next)).catch((err) => next(err));
  };
};
export { asynchandler };
