const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
require('dotenv').config();




app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false}));

const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

const JWT_SECRET = "ldksfoadhfonfasd()sakfjoaisfoiasjklfsadywyh";

const mongoUrl = process.env.MONGODB_URL;

mongoose.connect(mongoUrl,{
    useNewUrlParser: true,
}).then(() => {
    console.log("Connected to database");
})
.catch((err) => console.log(err));


app.listen(5000, () => {
    console.log("Server Started");
})


app.post('/post', async (req, res) => {
    console.log(req.body);
    const {data}=req.body;
try{
    if(data=="Doe"){
        res.send({status:"ok"})
    } else {
        res.send({status:"User Not Found"})
    }
} catch(error) {
    res.send({status:"Something went wrong"})

}
   
});

require('./userDetails');

const User = mongoose.model('UserInfo');

app.post('/register', async (req, res) => {
    
    const{fname,lname, email, password} = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);

    try{
        const oldUser = await User.findOne({email});

        if (oldUser) {
           return res.send({error:"User already exists"});
        }
await User.create({
fname,
lname,
email,
password:encryptedPassword,
})
res.send({status:"OK"})
    } catch(error) {
res.send({status:"Something went wrong"})
    }
});




app.post ('/login-user', async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user) {
        return res.send({error:"User not found"});
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({email:user.email}, JWT_SECRET, {
            expiresIn: 300
        });

        if(res.status(201)) {
            return res.json({status:"OK", data: token });
        } else {
            return res.json({error: "error signing"});
        }
    }
    res.json({error: "error", error : "Invalid password" });
});




app.post('/userData', async (req, res) => {
    const { token } = req.body;
    try{
        const user = jwt.verify(token, JWT_SECRET, (err, res) => {
           if(err) {
            return "token expired";
           }
           return res;
        });
        console.log(user);
        if(user=="token expired") {
            return res.send({status: "error", data: "token expired"});
        }
        const useremail = user.email;
        User.findOne({email:useremail}).then((data) => {
            res.send({status: "OK", data: data});
        })
        .catch((err) =>{
            res.send({status: "error", data: err});
        })
    }catch(err){}
})



app.post("/forgot-password",async (req, res) => {
    const {email} = req.body;
    try {
        const oldUser = await User.findOne({email});
        if (!oldUser) {
            return res.json({status : "User not found"});
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({email : oldUser.email, id: oldUser._id},secret, { 
                        expiresIn: "5m"});
        const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'dossonlyfans6@gmail.com',
              pass: 'dkzdjucarzmhatxv'
            }
          });
          
          var mailOptions = {
            from: 'yourgmail@gmail.com',
            to: email,
            subject: 'Sending Email using Node.js',
            text: link,
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        console.log(link);
    } catch (err) {
console.log(err);
    }
})



app.get('/reset-password/:id/:token', async (req, res) => {
    const { id, token} = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id});
    if(!oldUser) {
        return res.json({ status: "User not exists"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
       res.render("index", {email:verify.email} )
    } catch (error)  {
        res.send("Not Verified token");
    }
    
})



app.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token} = req.params;
    const {password} = req.body;
    const oldUser = await User.findOne({_id: id});
    if(!oldUser) {
        return res.json({ status: "User not exists"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {$set: {
                password: encryptedPassword,
            },
        }
        );
        res.json({status: "Password Updated"})
     
       res.render("index", {email:verify.email});
    } catch (error)  {
        console.log(error);
        res.json({status: "Something Went Wrong"});
    }
    
})