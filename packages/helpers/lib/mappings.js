function mapDBProps(input) {
  if (typeof input === 'boolean') {
    return { BOOL: input };
  }

  if (typeof input === 'string') {
    return { S: input };
  }

  if (typeof input === 'number') {
    return { N: input.toString() };
  }

  if (input instanceof Array) {
    return { L: input.map((item) => mapDBProps(item)) };
  }

  if (input instanceof Object) {
    return { M: Object.entries(input).reduce((acc, [key, val]) => ({ ...acc, [key]: mapDBProps(val) }), {}) };
  }

  return input;
}

function mapMessageProps(input) {
  const [[key, val]] = Object.entries(input);
  if (key === 'S') {
    return val;
  }

  if (key === 'N') {
    return +val;
  }

  if (key === 'L') {
    return val.map((item) => mapDBProps(item));
  }

  if (key === 'M') {
    return Object.entries(val).reduce((acc, [key, val]) => {
      return { ...acc, [key]: mapDBProps(val) };
    }, {});
  }

  return input;
}

exports.generateDBObj = (input) =>
  Object.entries(input).reduce((acc, [key, val]) => ({ ...acc, [key]: mapDBProps(val) }), {});

exports.generateMessageObj = (input) =>
  Object.entries(input).reduce((acc, [key, val]) => ({ ...acc, [key]: mapMessageProps(val) }), {});

exports.mapDBProps = mapDBProps;
exports.mapMessageProps = mapMessageProps;
