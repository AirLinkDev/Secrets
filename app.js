//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
//import ejs from "ejs";
import { mongoose } from "mongoose";
import encrypt from "mongoose-encryption";
import dotenv from "dotenv";
dotenv.config();
const uri = "mongodb://127.0.0.1:27017/userDB";
//mongoose.connect("mongodb://localhost:27017/userDB");
//IMPORTANT: mongoose.connect does not work with "localhost"
mongoose.connect(uri)
.then(()=>console.log("DB Connected"))
.catch((err)=>console.log(err));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"] });
//add additional fields into array as needed
const User = new mongoose.model("user",userSchema);

const app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));



const port = 3000;
app.get("/", function(req,res){
    res.render("home");
});
app.get("/login", function(req,res){
    res.render("login");

    }); 
app.get("/logout", function(req,res){
    res.render("home");

    }); 

app.get("/register", function(req,res){
    res.render("register");
});
app.post("/login", async function(req,res){
    const username= req.body.username;
    const password= req.body.password;
    
    try{
        /***
         * Capturing data from db is impossible without async and await
         */
    const foundUser = await User.findOne({email: req.body.username});
    console.log("db returned user: "+foundUser);
    if (foundUser){
        console.log("user found!!");
        if(foundUser.password==password){
            console.log("password matched!!");
        res.render("secrets");
        }else{
            console.log("password NOT matched!!");
            res.render("login");
        }
    }else{
        res.render("login");
    }
    }catch(err){
        if(err){
            console.log("findOne got Error: " + err);
        }
    }

});
app.post("/register", function(req,res){

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    console.log("Trying to save new user: "+JSON.stringify(newUser));
    res.render("login");
    try{
        newUser.save();
    }catch(err){
        if(err){
            console.log("we got Error: " + err);
        }else{
            res.render("secrets");
        }
    }
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });