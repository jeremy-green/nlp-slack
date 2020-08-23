exports.handler = async (event) => {
  const { history } = event;
  console.log(history);
  const images = history.reduce((acc, curr) => {
    const { files = [] } = curr;
    console.log(files);
    if (files.length) {
      return [...acc, ...files];
    }
    return [...acc];
  }, []);

  return { images };
};
