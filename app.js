//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
//import ejs from "ejs";
import { mongoose } from "mongoose";
import encrypt from "mongoose-encryption";
import dotenv from "dotenv";
//import md5 from "md5";
import bcrypt from "bcrypt";
const saltRounds = 10;
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
    try{
        /***
         * Capturing data from db is impossible without async and await
         */
    const foundUser = await User.findOne({email: req.body.username});

    console.log("db returned user: "+foundUser);
        //bcrypt.compare(someOtherPlaintextPassword, hash, function(err, result) {
        // result == false
    //});
    bcrypt.compare(req.body.password,foundUser.password, function(err,result){
        console.log("Inside Compare Method");
        if(result){
            console.log("password matched!!");
            res.render("secrets");
        }else{
            console.log("password did not match!!");
            res.render("login");
        }
    })
        
       



    }catch(err){
        if(err){
            console.log("findOne got Error: " + err);
        }else{
            console.log("password NOT matched!!");
            res.render("login");
        }
    }



    
    

});
app.post("/register", async function(req,res){
    const newUser = await bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        try{
            newUser.save();
        }catch(err){
            if(err){
                console.log("we got Error: " + err);
            }
        }
        console.log("Trying to save new user: "+JSON.stringify(newUser));
    });

    
    res.render("secrets");

});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });