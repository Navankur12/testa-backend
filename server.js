const express = require("express");
const cors = require("cors")
const session = require("express-session")
var bodyParser = require("body-parser");
//const connectDB = require("./config/db");
//const { SESSION_SECRET } = require("./config/keys")
const appTour = require("./routes/app-tour")
const authRoutes = require("./routes/auth-route")
const countryRoute = require("./routes/country-city-routes");
const userProfileRoute = require("./routes/userProfile-routes");
const subadminRoutes = require("./routes/subadmin-route");
const questionRoutes=require("./routes/question-route");
const questionBankRoutes=require("./routes/questionBank-route");
const uploadRoutes=require("./routes/file-upload-route");
const dashboardRoutes = require('./routes/dashboard-route');
const path = require("path");
const app = express()
const http = require("http").Server(app);
const swaggerUi = require('swagger-ui-express');
const swaggerDocument=require('./swagger.json');
let options = {
  explorer: true,
  // customCssUrl: './swagger-ui.css'
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument,options));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.get('/images/:id',(req,res)=>{
    
            return res.sendFile(path.join(__dirname,`public/files/${req.params.id}`))
})


app.use(
  cors({
    // origin: ["http://localhost:3000","https://testa-front-end.vercel.app"],
    // methods: "GET,POST,PUT,DELETE",
    // credentials: true,
    origin: '*'
  })
);

app.use(
  express.json({
    type: [
      "application/json",
      "text/plain", // AWS sends this content-type for its messages/notifications
    ],
  })
);

const port = process.env.PORT || 5000;
// Connecting to the db
//connectDB()

// 
// app.use(session({
//   secret: SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true

// }))

app.get("/", (req, res) => res.send(`<h1>Server started</h1>`));
app.use("/api", authRoutes);
app.use("/api/admin-routes", appTour);

// app.use("/api/admin-routes", adminRoutes);
app.use("/api", countryRoute,
                userProfileRoute,
                subadminRoutes,
                questionRoutes,
                uploadRoutes,
                questionBankRoutes,
                dashboardRoutes);

server = app.listen(port, () => console.log(`server listning port at ${port}`));

// app.listen(3000, () => {
//     console.log(`Server Started at port 3000`);
// });
