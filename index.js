import mongoose from "mongoose"
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
const app = express();
dotenv.config()

app.use(express.json())
app.use(cors())



//Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: [true, "username aleady taken."],
    required: [true, "Please choose a username"],
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [50, "Username is too long (max 50 characters)"],
    match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
  },
  gmail: {
    type: String,
    required: [true, "Please enter your Gmail address"],
    unique: [true, "This gmail already has an account"],
    trim: true,
    lowercase: true,
    maxlength: [100, "Email is too long"],
    match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Please enter a valid Gmail address"]
  },
  phone: {
    type: String,
    unique: [true, "This phone number already has account"],
    required: [true, "Please enter your phone number"],
    trim: true,
    match: [/^\d{10}$/, "Phone number must be 10 digits (9117624343)"]
  },
  password: {
    type: String,
    required: [true, "Please create a password"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  accessToken: {
    type: String,
    unique: [true, "Something went wrong our server. Please try again"],
    required: true
  },
  otp: {
    value: {
      type: String,
      match: [/^\d{6}$/, "OTP must be 6 digits"]
    },
    expires: {
      type: Date
    }
  },
  referral: {
    type: String,
    default: "none",
      trim: true,
      validate: {
        validator: function(value) {
          return value === 'none' || /^[a-zA-Z0-9_]{3,50}$/.test(value);
        },
        message: "Invalid referral code"
      }
    },
    referrals: [{
      type: String,
      trim: true,
      match: [/^[a-zA-Z0-9_]{3,50}$/, "Invalid username format"]
    }],
    signins: [{
      date: {
        type: Date,
      default: Date.now
      },
      ip: String,
      userAgent: String
    }],
    transactions: [{
      type: {
        type: String,
        enum: ['Airtime', 'Data', 'Funding', 'Share'],
        required: true
      },
      cost: {
        type: Number,
        required: true,
        min: [100, "Amount is 100"]
      },
      description: String,
      status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
      default: 'pending'
      },
      date: {
        start: {
          type: String
        },
        verified: {
          type: String,
        default: null
        }

      },
      new_balance: {
        type: Number,
      default: 0,
        min: [0, "Balance cannot be negative"]
      },
      old_balance: {
        type: Number,
      default: 0,
        min: [0, "Balance cannot be negative"]
      },
      id: {
        type: String,
      },
    }],


    balance: {
      type: Number,
    default: 5000,
      min: [0, "Balance cannot be negative"]
    },
  }, {
    timestamps: true
  });
  const transactionSchema = new mongoose.Schema({
    userTransaction: {
      type: {
        type: String,
        enum: ['Airtime', 'Data', 'Funding', 'Share'],
        required: true
      },
      cost: {
        type: Number,
        required: true,
        min: [0, "Amount cannot be negative"]
      },
      description: String,
      status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
      default: 'pending'
      },
      date: {
        start: {
          type: Date,
        default: Date.now
        },
        verified: {
          type: Date,
        default: null
        }

      },
      new_balance: {
        type: Number,
      default: 0,
        min: [0, "Balance cannot be negative"]
      },
      old_balance: {
        type: Number,
      default: 0,
        min: [0, "Balance cannot be negative"]
      },
    },

    gmail: {
      type: String,
    },
    uniqueid: {
      type: String,
    },
    userid: {
      type: String,
    },
  });
  //models//
  const User = mongoose.model("User", userSchema);
  const transactions = mongoose.model("transactions", transactionSchema);













  app.get("/", async (req, res)=> {
    res.send("ok guy")
  })
    

  app.post("/wk", async (req, res)=> {
    const body = req.body;
    try {
      const gmail = body.data.metadata.guide.email;
      const amount = body.data.metadata.guide.amount;
      const trackId = body.data.reference;
      console.log(gmail, amount, trackId)

      //find gmail.
      const user = await User.findOne({
        gmail: gmail
      })
      //find interested trackId
      let history = user.transactions;

      let transIndex;
      for (let i = 0; i < history.length; i++) {
        const transaction = history[i];
        if (transaction.id === trackId) {
          transIndex = i;
          console.log("transaction")
          console.log(transaction)
          console.log("transaction")
        }
      }



      user.balance = history[transIndex].new_balance;
      user.transactions[transIndex].status = "success";
      user.transactions[transIndex].date.verified = Date.now();

      await user.save();
      console.log("User Saved")


      let GlobalTrans = {
        userTransaction: user.transactions[transIndex],
        userid: user.transactions[transIndex].id,
        gmail: user.gmail,
        uniqueid: user.transactions[transIndex]._id,
      };


      const transactionObjDB = new transactions(GlobalTrans);
      await transactionObjDB.save();


      res.send("ok")
      console.log(transactionObjDB)
      //pending to success, balane to new balane
    }catch(err) {
      console.log(err.message)
      res.send("ok")
    }


  })



  app.use((req, res)=> {
    res.status(404).send("Not found here.")
  })



  app.listen(process.env.PORT || 2028, async ()=> {
    await mongoose.connect(process.env.DB_URL);
    console.log("successful to connection");
    console.log(`http://localhost:${process.env.PORT || 2028}`)
  })
  