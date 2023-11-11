//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
//import ejs from "ejs";
import { mongoose } from "mongoose";
//import encrypt from "mongoose-encryption";
//import dotenv from "dotenv";
//import md5 from "md5";
//import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

//const saltRounds = 10;
//dotenv.config();
const app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());
const uri = "mongodb://127.0.0.1:27017/userDB";
//mongoose.connect("mongodb://localhost:27017/userDB");
//IMPORTANT: mongoose.connect does not work with "localhost"
mongoose.connect(uri)
.then(()=>console.log("DB Connected"))
.catch((err)=>console.log(err));
//mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
//userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"] });
userSchema.plugin(passportLocalMongoose);
//add additional fields into array as needed
const User = new mongoose.model("user",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




const port = 3000;
app.get("/", function(req,res){
    res.render("home");
});
app.get("/login", function(req,res){
    res.render("login");

    }); 
app.get("/logout", function(req,res){
    req.logout();
    res.render("home");

    }); 

app.get("/register", function(req,res){
    res.render("register");
});
app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});
app.post("/login", async function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.render("secrets");
            });              
        }
    })
});
app.post("/register", async function(req,res){
  User.register({username: req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.render("/register");
    }else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        })
    }
  })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });