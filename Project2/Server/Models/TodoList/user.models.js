import mongoose from "mongoose";

const userSchema = mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: [true, "Password Required!"], // Custom Validators
		},
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);
