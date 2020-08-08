/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const slugify = require("slugify");

/**
 *
 * @param {Model} model Le model pour le quel l'action sera effectué
 * @param {res} res requette
 * @param {Array} values Array of values to be upadated
 * @param {func} next Next actions
 */
exports.bulkUpdateModelValues = (Model, values, key = "_id", setNew = true) => {
  let options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  };

  if (values.length > 0) {
    return new Promise((resolve, reject) => {
      Model.bulkWrite(
        values.map((t) => {
          const val = !t._id ? new Model(t) : t;
          return {
            updateOne: {
              filter: { [`${key}`]: val[`${key}`] },
              update: {
                $set: {
                  ...extractFields(Model, val),
                },
              },
              upsert: true,
              //  options
            },
          };
        }),
        {},
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            let resultat = result.result.upserted.map((item) => item._id);
            if (result.modifiedCount && result.modifiedCount > 0) {
              resultat = [...resultat, ...values.map((item) => item._id)];
            }

            resolve(resultat);
          }
        }
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve([]);
    });
  }
};

const extractFields = (Model, val) => {
  let fieldsValue = {};
  Model.schema.eachPath((path) => {
    if (
      path != "createdAt" &&
      path != "_id" &&
      path != "updatedAt" &&
      val[`${path}`]
    ) {
      fieldsValue = { ...fieldsValue, [`${path}`]: val[`${path}`] };
    }
  });
  return fieldsValue;
};

exports.modelInsertMany = (Model, res, values, next) => {
  Model.insertMany(values, (err, newValues) => {
    if (err) {
      return res.status(400).json({ err });
    }
    next(newValues);
  });
};

exports.checkError = (err, message) => {
  if (err) {
    return res.status(400).json(message);
  }
};

exports.slug = (value) => {
  return slugify(value, {
    lower: true,
    remove: /[*^#{°=}+|`_+~.()'"!:@&]/g,
  });
};

const indexOfObject = (array = [], element) => {
  return array.findIndex(
    (item) => JSON.stringify(item) === JSON.stringify(element)
  );
};
/**
 * remove duplicate object values
 */
exports.setObjectArray = (array = []) => {
  return array.filter((item, index) => indexOfObject(array, item) === index);
};

exports.copyfromModel = async (finalModel, from) => {
  for (let [key, value] of Object.entries(from)) {
    if (!["__v", "createdAt", "updatedAt"].includes(key))
      finalModel[key] = from[key];
  }
};

exports.removeArrayFromArray = async (rootArray, childArray, fieldId) => {
  let mu = [...rootArray];
  for (let i = 0; i < childArray.length; i++) {
    const element = childArray[i];

    if (fieldId) {
      mu = mu.filter((item) => item[`${fieldId}`] !== element[`${fieldId}`]);
    }
    if (!fieldId) {
      mu = mu.filter((item) => item.id !== childArray[i]);
    }
  }

  return mu;
};

exports.calculPourcentage = (sale_price, price, tva) => {
  const sp = parseInt(sale_price);
  const p = parseInt(price);
  const t = parseInt(tva);
  const pourc = 100 - ((sp - t) * 100) / (p - t);
  return Math.round(pourc);
};

exports.arrayFromObject = async (object) => {
  return object ? Object.entries(object).map(([key, item]) => item) : [];
};

exports.objectFromArray = async (array, key) => {
  let val = {};

  for (let i = 0; i < array.length; i++) {
    const elem = array[i];
    const id = key ? elem[key] : i;
    val = { ...val, [`${id}`]: elem };
  }
  return val;
};

exports.objectFromObjectArray = async (array, keyField, valueField) => {
  let val = {};
  for (let i = 0; i < array.length; i++) {
    const elem = array[i];
    const key = elem[`${keyField}`];
    const value = elem[`${valueField}`];
    val = { ...val, [`${key}`]: value };
  }
  return val;
};

exports.dateToText = (date = "2020-04-18T18:07:09.753Z") => {
  const madate = new Date("2020-04-18T18:07:09.753Z");
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    second: "numeric",
    minute: "numeric",
  };

  return madate.toLocaleDateString(undefined, options);
};

exports.frontErrorMessage = (
  res,
  logObject,
  message = "une erreur s'est produite, veuillez contacter l'administrateur"
) => {
  console.log({ ...logObject });
  res.status(400).json({
    error: message,
  });
};

exports.covertToPlainText = (val) => {
  return JSON.parse(JSON.stringify(val));
};

exports.convertStringNumber = (val) => {
  return parseInt(val) || 0;
};
