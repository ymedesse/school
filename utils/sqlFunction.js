// creation

exports.formatDate = (date) => {
  return `DATE_FORMAT(${date},"%d/%m/%Y à %H:%m:%s")`;
};

exports.dateToMysqlFormat = (date = Date.now()) => {
  const madate = new Date(date);
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    second: "numeric",
    minute: "numeric",
  };

  return madate.toLocaleDateString(undefined, options);
};
