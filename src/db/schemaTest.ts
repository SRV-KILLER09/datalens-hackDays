import { pgTable, text, integer, doublePrecision, timestamp, varchar, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const customers = pgTable("customers", {
  customerId: text("customer_id").primaryKey(),
  customerUniqueId: text("customer_unique_id"),
  customerZipCodePrefix: integer("customer_zip_code_prefix"),
  customerCity: text("customer_city"),
  customerState: varchar("customer_state", { length: 2 }),
});

export const geolocation = pgTable("geolocation", {
  geolocationZipCodePrefix: integer("geolocation_zip_code_prefix"),
  geolocationLat: doublePrecision("geolocation_lat"),
  geolocationLng: doublePrecision("geolocation_lng"),
  geolocationCity: text("geolocation_city"),
  geolocationState: varchar("geolocation_state", { length: 2 }),
});

export const sellers = pgTable("sellers", {
  sellerId: text("seller_id").primaryKey(),
  sellerZipCodePrefix: integer("seller_zip_code_prefix"),
  sellerCity: text("seller_city"),
  sellerState: varchar("seller_state", { length: 2 }),
});

export const products = pgTable("products", {
  productId: text("product_id").primaryKey(),
  productCategoryName: text("product_category_name"),
  productNameLength: integer("product_name_lenght"),
  productDescriptionLength: integer("product_description_lenght"),
  productPhotosQty: integer("product_photos_qty"),
  productWeightG: integer("product_weight_g"),
  productLengthCm: integer("product_length_cm"),
  productHeightCm: integer("product_height_cm"),
  productWidthCm: integer("product_width_cm"),
});

export const orders = pgTable("orders", {
  orderId: text("order_id").primaryKey(),
  customerId: text("customer_id").references(() => customers.customerId),
  orderStatus: text("order_status"),
  orderPurchaseTimestamp: timestamp("order_purchase_timestamp"),
  orderApprovedAt: timestamp("order_approved_at"),
  orderDeliveredCarrierDate: timestamp("order_delivered_carrier_date"),
  orderDeliveredCustomerDate: timestamp("order_delivered_customer_date"),
  orderEstimatedDeliveryDate: timestamp("order_estimated_delivery_date"),
});

export const orderItems = pgTable("order_items", {
  orderId: text("order_id").references(() => orders.orderId),
  orderItemId: integer("order_item_id"),
  productId: text("product_id").references(() => products.productId),
  sellerId: text("seller_id").references(() => sellers.sellerId),
  shippingLimitDate: timestamp("shipping_limit_date"),
  price: doublePrecision("price"),
  freightValue: doublePrecision("freight_value"),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.orderId, table.orderItemId] }),
  };
});

export const orderPayments = pgTable("order_payments", {
  orderId: text("order_id").references(() => orders.orderId),
  paymentSequential: integer("payment_sequential"),
  paymentType: text("payment_type"),
  paymentInstallments: integer("payment_installments"),
  paymentValue: doublePrecision("payment_value"),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.orderId, table.paymentSequential] }),
  };
});

export const orderReviews = pgTable("order_reviews", {
  reviewId: text("review_id"),
  orderId: text("order_id").references(() => orders.orderId),
  reviewScore: integer("review_score"),
  reviewCommentTitle: text("review_comment_title"),
  reviewCommentMessage: text("review_comment_message"),
  reviewCreationDate: timestamp("review_creation_date"),
  reviewAnswerTimestamp: timestamp("review_answer_timestamp"),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.reviewId, table.orderId] }),
  };
});

export const productCategoryNameTranslation = pgTable("product_category_name_translation", {
  productCategoryName: text("product_category_name").primaryKey(),
  productCategoryNameEnglish: text("product_category_name_english"),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.customerId],
  }),
  items: many(orderItems),
  payments: many(orderPayments),
  reviews: many(orderReviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.orderId],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.productId],
  }),
  seller: one(sellers, {
    fields: [orderItems.sellerId],
    references: [sellers.sellerId],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  categoryTranslation: one(productCategoryNameTranslation, {
    fields: [products.productCategoryName],
    references: [productCategoryNameTranslation.productCategoryName],
  }),
  orderItems: many(orderItems),
}));