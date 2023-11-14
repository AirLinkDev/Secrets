//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
//import ejs from "ejs";
import { mongoose } from "mongoose";
//import encrypt from "mongoose-encryption";
import dotenv from "dotenv";
//import md5 from "md5";
//import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from "mongoose-findorcreate";
import GoogleStrategy from "passport-google-oauth20";
//const saltRounds = 10;
dotenv.config();
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
    password: String,
    googleId: String,
    secret: String
});
//userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"] });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//add additional fields into array as needed
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());//only works with local authentication
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {//works with local authentication
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
//console.log("myClientID is: "+process.env.CLIENT_ID);
passport.use(new GoogleStrategy.Strategy({
    clientID : process.env.CLIENT_ID,
    clientSecret : process.env.CLIENT_SECRET,
    callbackURL : "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("Profile: "+JSON.stringify(profile));
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



const port = 3000;
// app.get("/auth/google", function(req,res){
//     passport.authenticate("google", { scope: ["profile"] });
// });
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));

app.get('/auth/google/secrets', 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("authentication successful!!!!");
    res.redirect("/secrets");
  });
app.get("/", function(req,res){
    res.render("home");
});
app.get("/login", function(req,res){
    res.render("login");

    }); 
app.get("/logout", function(req, res, next) {
        console.log("inside logout");
        req.logout(function(err) {
            console.log("trying to logout");
          if (err) { 
            console.log(err);
            return next(err);
         }
          res.redirect('/');
        });
      });

app.get("/register", function(req,res){
    res.render("register");
});
app.get("/secrets", async function(req,res){
    const foundUsers = await User.find({"secret": {$ne: null}}).exec();
    console.log("my array: "+JSON.stringify(foundUsers));
    if(foundUsers){
        res.render("secrets", {usersWithSecrets: foundUsers});
    }
});

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});
app.post("/submit", async function(req,res){
 const submittedSecret = req.body.secret;
 try{
 console.log("User ID: " + req.user._id);
 }catch(err){
    console.log(err);
    res.redirect("/login");
 }
 const foundUser = await User.findById(req.user._id).exec();

        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save();
            res.redirect("/secrets");
        }else{
            res.redirect("/login");
        }
        console.log("Result : ", foundUser); 
    


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