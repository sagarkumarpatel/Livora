const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../Models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/Livora";

main().then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect(MONGO_URL)
}

const initDB=async()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({
        ...obj,
        owner:"695d0d749b11df64bd593ab4",
    }))

    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};

initDB();
