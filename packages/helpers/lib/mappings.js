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

exports.generateDBObj = (input) =>
  Object.entries(input).reduce((acc, [key, val]) => ({ ...acc, [key]: mapDBProps(val) }), {});
