exports.handler = async (event) => {
  const { history } = event;
  const images = history.reduce((acc, curr) => {
    const { files = [] } = JSON.parse(curr);
    if (files.length) {
      return [...acc, ...files];
    }
    return [...acc];
  }, []);

  return { images };
};
