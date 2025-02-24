async function dbFetchPaginatedResults(model, query, fields, orderBy, populate, page, pageSize) {
  const skip = (page - 1) * pageSize;
  const modelQuery = model.find(query);

  if (Object.keys(fields).length > 0) {
    modelQuery.select(fields);
  }

  modelQuery.sort(orderBy);

  if (populate && populate.length > 0) {
    populate.forEach(populateObj => {
      modelQuery.populate(populateObj);
    });
  }

  modelQuery.skip(skip).limit(pageSize);

  const [results, totalCount] = await Promise.all([
    modelQuery.exec(),
    model.countDocuments(query)
  ]);

  return {
    data: results,
    currentPage: page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

module.exports = dbFetchPaginatedResults;