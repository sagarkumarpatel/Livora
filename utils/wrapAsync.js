function wrapAsync(fn){
    return function(req,res,next){
        // ensure async handlers forward errors to Express
        fn(req,res,next).catch(next);
    }
}

module.exports=wrapAsync;