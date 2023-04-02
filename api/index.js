import express from "express";
const app = express();

import authRoutes from "./Routes/auth.js"
import browseRoutes from "./Routes/browse.js"
import callRoutes from "./Routes/call.js"
import dashboardRoutes from "./Routes/dashboard.js"
import feedbackRoutes from "./Routes/feedback.js"
import homeRoutes from "./Routes/home.js"
import rateRoutes from "./Routes/rate.js"




//middlewares 
app.use(express.json())


app.use("/api/auth", authRoutes);
app.use("/api/browse", browseRoutes);
app.use("/api/call", callRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/rate", rateRoutes);



app.listen(8800, () => {
    console.log("API working!")
})