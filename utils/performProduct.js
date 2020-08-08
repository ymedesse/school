// const columnsBeEncoded = ["price_html", "description", "short_description"];
const columnsMustNumber = ["price", "regular_price", "sale_price"];

/**
 *
 * @param {Array} products Array of products to convert
 */
exports.convertNumberFieds = async (products) => {
  // for (let i = 0; i < products.length; i++) {
  //   const product = products[i];
  //   for (let y = 0; y < columnsMustNumber.length; y++) {
  //     const field = columnsMustNumber[y];
  //     if (product[field]) {
  //       const m = product[field];
  //       product[field] = m === "" ? 0 : parseInt(m);
  //     }
  //   }
  // }
  return products;
};
