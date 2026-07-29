import * as searchService from '../services/search.service.js';

const search = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    const results = await searchService.globalSearch(q, type);
    res.json({ success: true, query: q, ...results });
  } catch (error) {
    next(error);
  }
};

export { search };
