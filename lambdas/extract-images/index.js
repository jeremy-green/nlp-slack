exports.handler = async (event) => {
  const { history } = event;
  const images = history.reduce((acc, curr) => {
    const { files = [] } = curr;
    if (files.length) {
      return [...acc, ...files];
    }
    return [...acc];
  }, []);

  return { images };
};
