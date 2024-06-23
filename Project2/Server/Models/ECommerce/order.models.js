import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	productID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
	},
	quantity: {
		type: Number,
		required: true,
	},
});

const orderSchema = new mongoose.Schema(
	{
		orderPrice: {
			type: Number,
			required: true,
		},
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		orderItems: {
			type: [orderItemSchema],
		},
		address: {
			type: String,
			required: true,
		},
		states: {
			type: String,
			enum: ["Pending", "Cancelled", "Delivered"],
			default: "Pending",
		},
	},
	{ timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
