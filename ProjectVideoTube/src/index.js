import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

connectDB()
    .then(() => {
        const port = process.env.PORT || 8000;
        app.on("Error", (error) => {
            console.log("APP ERROR:", error);
            throw error;
        });
        app.listen(port, () => {
            console.log("Server is running at port:", port);
        });
    })
    .catch((err) => {
        console.log("MongoDB CONNECTION FAILED:", err);
    });
