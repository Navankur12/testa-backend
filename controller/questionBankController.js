const QuestionModel = require("../models/questionBankModel");
const { Paginate } = require("../utils/paginate");
const responseMessage = require('../utils/responseMessage')
const { sendResponse, errorResponse } = require("../utils/response")
const Joi = require("@hapi/joi");
const _ = require("lodash");
const Question = require("../models/question");

exports.createQuestionForm = async (req, res) => {
  try {
    const { error } = validateQuestionDetails(req.body);
    if (error)
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        error.message
      );

    const {
      questionBankId,
      questionType,
      jobRole,
      jobLevel,
      code,
      sector,
      subSector,
      sectorCode,
      schemeName,
      schemeCode,
      nos,
      nosCode,
      theoryMarks,
      practicalMarks,
      status,
    } = req.body;

    let questionExists = await QuestionModel.findOne({
      $or: [{ code: req.body.code }],
    });
    if (questionExists) {
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        "QuestionBank is already created"
      );
    } else {
      // get data from req.body
      let questionBankCount = await QuestionModel.countDocuments({});
      let questionBankautoId = `QN-10-${questionBankCount ? questionBankCount : 1}`;
      const newQuestionModel = new QuestionModel({
        questionType,
        jobRole,
        jobLevel,
        code,
        sector,
        questionBankId:  questionBankId || questionBankautoId,
        subSector,
        sectorCode,
        schemeName,
        schemeCode,
        nos,
        nosCode,
        theoryMarks,
        practicalMarks,
        isQuestionFormCreated: true,
        status,
      });
      const savedQuestionForm = await newQuestionModel.save();
      if (savedQuestionForm) {
        return sendResponse(
          res,
          201,
          responseMessage.question_bank_create,
          savedQuestionForm
        );
      } else {
        return errorResponse(
          res,
          400,
          responseMessage.question_bank_not_create,
          responseMessage.errorMessage
        );
      }
    }
  } catch (error) {
    return res
      .status(500)
      .send({
        statusCode: 500,
        error: "Oops! Something went wrong here...",
        message: error.message,
      });
  }
};

exports.getSector = async (req, res) => {
    try {
        let regex = new RegExp(req.query.sector, 'i');
    
        var sectorFilter = QuestionModel.find({'sector':regex},{'sector':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(5);
        sectorFilter.exec(function(err,data){
            console.log('data',data)
            let result = []
            if(!err){
                if(data && data.length && data.length>0){
                    data.forEach(user => {
                        let obj = {
                            id:user._id,
                            label:user.sector
                        };
                        result.push(obj)
                    })
                }
                res.json(result)
            } else {
                return res.status(400).send({
                    statusCode: 400,
                    success: false,
                    error: "JobSector not found",
                    message: "You have entered an invalid sector details"
                });
            }

        }) 
    } catch (error) {
        return res.status(500).send({ statusCode: 500, success: false, message: 'Oops! Something went wrong here...', error: error.message });
    }
};
module.exports.changeStatus=async(req,res)=>{
       try{
        const { error } = validateStatusChange(req.body);
    if (error)
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        error.message
      );
        const {status,question_bank_id}=req.body;
          let change=(status=='active')?'active':'inactive';
      
          const updateStatus=await QuestionModel.findByIdAndUpdate(question_bank_id,{status:change});
          if(updateStatus){
            return sendResponse(res,200,responseMessage.status_change,{status:change})
          }else{
             return errorResponse(
              res,
              400,
              responseMessage.status_not_change,
              responseMessage.errorMessage
            );
          }
       }catch(error){
        console.log('err',err)
        return errorResponse(res, 500, responseMessage.errorMessage, error.message)
       }
     

}
exports.getJobrole = async (req, res) => {
  try {
    let regex = new RegExp(req.query.jobRole, "i");

    var jobRoleFilter = QuestionModel.find({ jobRole: regex }, { jobRole: 1 })
      
      .sort({ updated_at: -1 })
      .sort({ created_at: -1 })
      .limit(5);
    
    jobRoleFilter.exec(function (err, data) {
     
      let result = [];
      if (!err) {
        if (data && data.length && data.length > 0) {
          data.forEach((user) => {
            let obj = {
              id: user._id,
              label: user.jobRole,
            };
            result.push(obj);
          });
        }
        res.json(result);
      } else {
        return res.status(400).send({
          statusCode: 400,
          success: false,
          error: "Jobrole not found",
          message: "You have entered an invalid Jobrole details",
        });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .send({
        statusCode: 500,
        success: false,
        message: "Oops! Something went wrong here...",
        error: error.message,
      });
  }
};
module.exports.getQuestionBankList = async (req, res) => {
  try {
    const { page, limit, skip, sortOrder } = await Paginate(req);
    let query = {};
    const totalCounts = await QuestionModel.countDocuments(query);
    const totalPages = Math.ceil(totalCounts / limit);
    const questionBankDetails = await QuestionModel.find({})
    .select('jobRole jobLevel code sector subSector schemeCode questionType nos schemeName nosCode theoryMarks practicalMarks status questionBankId')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    if (!questionBankDetails)
      return errorResponse(
        res,
        400,
        responseMessage.question_not_found,
        responseMessage.errorMessage
      );

    return sendResponse(res, 200, responseMessage.question_bank_found, {
      questionBankDetails,
      page,
      totalCounts,
      totalPages,
    });
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};

module.exports.getQuestionsByQuestionBankId = async (req, res) => {
  try {
    const { page, limit, skip, sortOrder } = await Paginate(req);
    const questionBank = await QuestionModel.findById(req.query.id);
    let query = { question_bank_id: questionBank._id };
    const questions = await Question.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);
    const totalCounts = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalCounts / limit);
    if (!questions)
      return errorResponse(
        res,
        400,
        responseMessage.question_not_found,
        responseMessage.errorMessage
      );

    return sendResponse(res, 200, responseMessage.question_bank_found, {
      questions,
      page,
      totalCounts,
      totalPages,
    });
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};

exports.questionBankFilter = async (req, res) => {
    try {
        let {questionBankId,questionType,jobRole,sector,subSector,nos} = req.query;
        const questionBankList = await QuestionModel.find({
            $or: [
                   { questionBankId: questionBankId },
                   { questionType: questionType },
                   { jobRole: jobRole },
                   { sector: sector },
                   { subSector: subSector },
                   { nos: nos }
            ]                   
        })
        if (!questionBankList) 
        return errorResponse(
            res, 
            400, 
            responseMessage.question_bank_list_not_found, 
            responseMessage.errorMessage
        );
       
        return sendResponse(
            res, 
            200, 
            responseMessage.question_bank_list_found, 
            questionBankList
        );
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
}
function validateStatusChange(body){
  try {
    const schema = Joi.object({
      question_bank_id: Joi.string().required(),
      status: Joi.string().required(),
    });
    return schema.validate(body);
  } catch (err) {
    console.log(err);
  }
}
function validateQuestionDetails(body) {
  try {
    const schema = Joi.object({
      jobLevel: Joi.string().min(1).trim().max(255).required(),
      sector: Joi.string().min(2).max(255).required(),
      subSector: Joi.string().min(5).max(255).required(),
      sectorCode: Joi.string().min(2).max(50).trim().required(),
      questionType: Joi.string().required(),
      questionBankId: Joi.string().alphanum().min(3).max(10),
      jobRole: Joi.string().required(),
      schemeCode: Joi.string().min(2).max(50).trim().required(),
      schemeName: Joi.string().min(2).max(50).trim().required(),
      nos: Joi.string().min(2).max(50).trim().required(),
      nosCode: Joi.string().min(2).max(50).trim().required(),
      code: Joi.string().min(2).max(50).trim().required(),
      theoryMarks: Joi.string().min(2).max(255).trim().required(),
      practicalMarks: Joi.string().min(2).max(255).trim().required(),
      status: Joi.string().min(2).max(50).trim().required(),
    });
    return schema.validate(body);
  } catch (err) {
    console.log(err);
  }
}
