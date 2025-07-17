const express = require('express')
const mongoose = require('mongoose');
const Product = require('./models/product.model.js');
const productRoute = require("./routes/product.route.js");
const app = express();


// middleware
app.use(express.json());
app.listen(3000, () => {
    console.log('server is running on port 3000');
});


//Routes
app.use("/api/products", productRoute);


app.get('/', (req, res) => {
    res.send("Hello from Node API");

});




mongoose.connect("mongodb+srv://okatuboeugene01:QfDfBvTFXSbE4tdW@quickbuy.vdpzpzw.mongodb.net/quickbuy?retryWrites=true&w=majority&appName=Quickbuy")
    .then(() => {
        console.log("Connected to database!");
    })
    .catch(() => {
        console.log("Connection failed!");
    });

app.post('/api/products', (req, res) => {

})