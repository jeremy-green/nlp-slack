function sortMessagesByDay(messages) {
  return messages
    .sort((a, b) => (parseFloat(b.ts) * 1000 < parseFloat(a.ts) * 1000 ? -1 : 1))
    .reduce((acc, curr) => {
      const { ts } = curr;
      const parsedDate = new Date(parseFloat(ts) * 1000);
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const date = parsedDate.getDate();

      const dayOf = new Date(year, month, date);
      const time = dayOf.getTime();

      if (!acc[time]) {
        acc[time] = [];
      }

      acc[time].push(curr);
      return acc;
    }, {});
}

function sortMessagesByWeek(messages) {
  return messages
    .sort((a, b) => (parseFloat(b.ts) * 1000 < parseFloat(a.ts) * 1000 ? -1 : 1))
    .reduce((acc, curr) => {
      const { ts } = curr;
      const parsedDate = new Date(parseFloat(ts) * 1000);
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const date = parsedDate.getDate();
      const day = parsedDate.getDay();

      const weekOf = new Date(year, month, date - day);
      const time = weekOf.getTime();

      if (!acc[time]) {
        acc[time] = [];
      }

      acc[time].push(curr);
      return acc;
    }, {});
}

exports.sortMessagesByDay = sortMessagesByDay;
exports.sortMessagesByWeek = sortMessagesByWeek;
