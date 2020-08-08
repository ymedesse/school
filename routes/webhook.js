/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const User = require("../models/user");


const {
  directSycronization: synChOrder,
  remove: removeOrder,
} = require("../controllers/wooOrder");
const {
  directSycronization: synChCustomer,
} = require("../controllers/wooCustomer");


router.post("/webhook/woocommerce/order-created", (req, res) => {
  updtateInsertOrder(req, res);
});

router.post("/webhook/woocommerce/order-updated", (req, res) => {
  console.log(JSON.stringify(req.body));
  updtateInsertOrder(req, res);
});

router.post("/webhook/woocommerce/order-restored", (req, res) => {
  console.log("order-restored");
  updtateInsertOrder(req, res);
});

router.post("/webhook/woocommerce/order-deleted", async (req, res) => {
  console.log("order-deleted");
  try {
    await getWoocommerceUser(async (user) => {
      req.profile = user;
      await removeOrder(req, res, (data) => {
        sendResponse(res, data);
      });
    });
  } catch (error) {
    console.log({ error });
    res.status(400).end;
  }
});

router.post("/webhook/woocommerce/customer-created", (req, res) => {
  console.log("customer-created");
  updtateInsertCustomer(req, res);
});

router.post("/webhook/woocommerce/customer-updated", (req, res) => {
  console.log("customer-updated");
  updtateInsertCustomer(req, res);
});

const getWoocommerceUser = async (next) => {
  await User.findOne({ email: "woocommerce@librairielbu.com" }).exec(
    (error, result) => {
      let user = { _id: "" };
      if (!error) {
        user = result;
      }
      next(user);
    }
  );
};

const updtateInsertOrder = async (req, res) => {
  try {
    await getWoocommerceUser(async (user) => {
      req.profile = user;
      req.body = { orders: [{ ...req.body }] };
      await synChOrder(req, res, (data) => {
        console.log({ data });
        data.succes && res.status(200).end();
        data.error && res.status(400).end;
        res.send();
      });
    });
  } catch (error) {
    console.log({ error });
    res.status(400).end;
  }
};

const updtateInsertCustomer = async (req, res) => {
  try {
    await getWoocommerceUser(async (user) => {
      req.profile = user;
      req.body = { customers: [{ ...req.body }] };
      await synChCustomer(req, res, (data) => {
        data.succes && res.status(200).end();
        data.error && res.status(400).end;
        res.send();
      });
    });
  } catch (error) {
    console.log({ error });
    res.status(400).end;
  }
};

const sendResponse = (res, data) => {
  console.log({ data });
  data.succes && res.status(200).end();
  data.error && res.status(400).end;
  res.send();
};
module.exports = router;

// const m = {
//   "id": 727,
//   "parent_id": 0,
//   "number": "727",
//   "order_key": "wc_order_58d2d042d1d",
//   "created_via": "rest-api",
//   "version": "3.0.0",
//   "status": "processing",
//   "currency": "USD",
//   "date_created": "2017-03-22T16:28:02",
//   "date_created_gmt": "2017-03-22T19:28:02",
//   "date_modified": "2017-03-22T16:28:08",
//   "date_modified_gmt": "2017-03-22T19:28:08",
//   "discount_total": "0.00",
//   "discount_tax": "0.00",
//   "shipping_total": "10.00",
//   "shipping_tax": "0.00",
//   "cart_tax": "1.35",
//   "total": "29.35",
//   "total_tax": "1.35",
//   "prices_include_tax": false,
//   "customer_id": 0,
//   "customer_ip_address": "",
//   "customer_user_agent": "",
//   "customer_note": "",
//   "billing": {
//     "first_name": "John",
//     "last_name": "Doe",
//     "company": "",
//     "address_1": "969 Market",
//     "address_2": "",
//     "city": "San Francisco",
//     "state": "CA",
//     "postcode": "94103",
//     "country": "US",
//     "email": "john.doe@example.com",
//     "phone": "(555) 555-5555",
//   },
//   "shipping": {
//     "first_name": "John",
//     "last_name": "Doe",
//     "company": "",
//     "address_1": "969 Market",
//     "address_2": "",
//     "city": "San Francisco",
//     "state": "CA",
//     "postcode": "94103",
//     "country": "US",
//   },
//   "payment_method": "bacs",
//   "payment_method_title": "Direct Direct Bank Transfer",
//   "transaction_id": "",
//   "date_paid": "2017-03-22T16:28:08",
//   "date_paid_gmt": "2017-03-22T19:28:08",
//   "date_completed": null,
//   "date_completed_gmt": null,
//   "cart_hash": "",
//   "meta_data": [
//     { "id": 13106, "key": "_download_permissions_granted", "value": "yes" },
//   ],
//   "line_items": [
//     {
//       "id": 315,
//       "name": "Woo Single #1",
//       "product_id": 93,
//       "variation_id": 0,
//       "quantity": 2,
//       "tax_class": "",
//       "subtotal": "6.00",
//       "subtotal_tax": "0.45",
//       "total": "6.00",
//       "total_tax": "0.45",
//       "taxes": [{ "id": 75, "total": "0.45", "subtotal": "0.45" }],
//       "meta_data": [],
//       "sku": "",
//       "price": 3,
//     },
//     {
//       "id": 316,
//       "name": "Ship Your Idea &ndash; Color: Black, Size: M Test",
//       "product_id": 22,
//       "variation_id": 23,
//       "quantity": 1,
//       "tax_class": "",
//       "subtotal": "12.00",
//       "subtotal_tax": "0.90",
//       "total": "12.00",
//       "total_tax": "0.90",
//       "taxes": [{ "id": 75, "total": "0.9", "subtotal": "0.9" }],
//       "meta_data": [
//         { "id": 2095, "key": "pa_color", "value": "black" },
//         { "id": 2096, "key": "size", "value": "M Test" },
//       ],
//       "sku": "Bar3",
//       "price": 12,
//     },
//   ],
//   "tax_lines": [
//     {
//       "id": 318,
//       "rate_code": "US-CA-STATE TAX",
//       "rate_id": 75,
//       "label": "State Tax",
//       "compound": false,
//       "tax_total": "1.35",
//       "shipping_tax_total": "0.00",
//       "meta_data": [],
//     },
//   ],
//   "shipping_lines": [
//     {
//       "id": 317,
//       "method_title": "Flat Rate",
//       "method_id": "flat_rate",
//       "total": "10.00",
//       "total_tax": "0.00",
//       "taxes": [],
//       "meta_data": [],
//     },
//   ],
//   "fee_lines": [],
//   "coupon_lines": [],
//   "refunds": [],
//   "_links": {
//     "self": [{ "href": "https://example.com/wp-json/wc/v3/orders/727" }],
//     "collection": [{ "href": "https://example.com/wp-json/wc/v3/orders" }],
//   },
// };
