const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose").default || require("passport-local-mongoose"); 

const userSchema=new Schema({
    email:{
        type:String,
        required:true
    }
});


userSchema.plugin(passportLocalMongoose);//why we use passportLocalMongoose as plugin because it automatically implement username, hashing, salting and hashpassword that's why we don't need to build all the things from the scratch, it also implement many method like authenticate(), register, findByUserName() and many more
module.exports = mongoose.model('User', userSchema);