const { v4: uuid } = require('uuid');
const { years = '2020,2019,2018', id = uuid() } = require('config');
exports.handler = () =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve({ years: years.split(',').map((year) => parseInt(year)), id, cursor: null, hasMore: true }),
      1000,
    ),
  );
