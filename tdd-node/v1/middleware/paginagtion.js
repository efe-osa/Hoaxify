const pagination = (req, res, next) => {
  const { query } = req;
  let page = parseInt(query?.page || 0, 10);
  let limit = parseInt(query?.limit || 10, 10);
  if (page < 0) {
    page = 0;
  }
  if (limit > 10 || limit < 1) {
    limit = 10;
  }
  req.pagination = { limit, page };
  next();
};

module.exports = pagination;
