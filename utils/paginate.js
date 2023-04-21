const Paginate=async(req,res)=>{
    //it will sort on createdAt field
    const sortOrder=req.query.sortOrder?{createdAt:1}:{createdAt:-1}
    //it will take page number
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

     const skip = (page - 1) * limit;
  
 return { page, limit, skip,sortOrder }
}
module.exports={Paginate}