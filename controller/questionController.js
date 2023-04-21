const Question = require("../models/question");
const QuestionModel = require("../models/questionBankModel");
const Section = require("../models/sections");
const Joi = require("@hapi/joi");
const { Paginate } = require("../utils/paginate");
const responseMessage = require("../utils/responseMessage");
const ImageModel = require("../models/imageModel");
const { sendResponse, errorResponse } = require("../utils/response");
const reader = require("xlsx");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs/promises");


module.exports.bulkUpload = async (req, res) => {
  try {
    let { language, questionType, jobRole, question_bank_id, section_id } =
      req.body;
    const { error } = validatebulkUpload(req.body);
    if (error) {
      const fileDelete = await fs.unlink(req.file.path);

      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        error.message
      );
    }
    
    let workbook = reader.readFile(req.file.path);
    let sheet_name_list = workbook.SheetNames;
    let xlData = reader.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[language]]
    );
    let questions = [];
    xlData.map(async (item, index) => {
      let correctAnswer = item["Correct Answer"] ? item["Correct Answer"] : "";
      let questionMarks = item["Marks"] ? item["Marks"] : "";
      let diffculityLevel = item["Difficulty Level(Easy/Medium/Hard)"]
        ? item["Difficulty Level(Easy/Medium/Hard)"]
        : "";

      questions.push({
        questionText: item.Question,
        questionMarks,
        diffculityLevel,
        correctAnswer: correctAnswer,
        options: [
          { title: item.option1 },
          { title: item.option2 },
          { title: item.option3 },
          { title: item.option4 },
        ],
      });
    });
    const details = await QuestionModel.findById(question_bank_id);
    if (details) {
      for (let item of questions) {
        const isQuestionExist = await Question.findOne({
          questionText: item.questionText,
        });
        if (isQuestionExist)
          return errorResponse(
            res,
            400,
            responseMessage.request_invalid,
            "Question is already created"
          );
      }
      let sectionExist = await Section.findById(section_id);
      let sectionDetails = "";
      if (!sectionExist) {
        return errorResponse(
          res,
          400,
          responseMessage.request_invalid,
          "Please select Section Id"
        );
      } else {
        sectionDetails = sectionExist;
      }
      let questionAddSection = [...questions];
      let questionWithSection = await questionAddSection.map((item) => {
        return {
          ...item,
          section_id: sectionDetails._id,
          question_bank_id,
        };
      });

      let saveQuestion = await Question.insertMany(questionWithSection);
      if (saveQuestion) {
        const fileDelete = await fs.unlink(req.file.path);

        return sendResponse(
          res,
          200,
          responseMessage.question_create,
          saveQuestion
        );
      } else {
        const fileDelete = await fs.unlink(req.file.path);

        return errorResponse(
          res,
          400,
          responseMessage.question_not_create,
          responseMessage.errorMessage
        );
      }
    } else {
      const fileDelete = await fs.unlink(req.file.path);

      return errorResponse(
        res,
        400,
        responseMessage.job_role_not_found,
        responseMessage.errorMessage
      );
    }
  } catch (error) {
    console.log("err", error);
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};
module.exports.sectionList = async (req, res) => {
  try {
    const { page, limit, skip, sortOrder } = await Paginate(req);
    let query = {};
    const totalCounts = await Section.countDocuments(query);
    const totalPages = Math.ceil(totalCounts / limit);
    const sectionDetails = await Section.find({})
      .populate("question_id")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    if (!sectionDetails)
      return errorResponse(
        res,
        400,
        responseMessage.section_not_found,
        responseMessage.errorMessage
      );

    return sendResponse(res, 200, responseMessage.section_found, {
      sectionDetails,
      page,
      totalCounts,
      totalPages,
    });
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }

}
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
   const {status,section_id}=req.body;
     let change=(status=='active')?'active':'inactive';
 
     const updateStatus=await Section.findByIdAndUpdate(section_id,{status:change});
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
module.exports.uploadImage = async (req, res) => {
  try {
    let data = await fs.readFile(req.file.path);

    const imageDetails = await new ImageModel({
      imageName: req.file.filename,
      image_path: req.file.path,
      // img:{
      //   data:data,
      //   contentType:req.file.mimetype
      // },
      imageUrl: `${process.env.backendUrl}/images/${req.file.filename}`
    }).save();
    if (imageDetails) {
      // let imageUrl=`data:image/${imageDetails.img.contentType};7bit,${imageDetails.img.data.toString('7bit')}`
      return sendResponse(
        res,
        200,
        responseMessage.image_upload,
        imageDetails
      );
    } else {
      return errorResponse(
        res,
        400,
        responseMessage.image_not_upload,
        responseMessage.errorMessage
      );
    }

  } catch (error) {
    console.log("err", error);
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }



}
module.exports.getQuestionsBySectionId = async (req, res) => {
  try {
    const { page, limit, skip, sortOrder } = await Paginate(req);
    const sectionDetails = await Section.findById(req.query.id);
    let query = { section_id: sectionDetails._id };
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
module.exports.addSection = async (req, res) => {
  try {
    const { error } = validateSection(req.body);
    if (error)
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        error.message
      );
    const {
      section,
      performanceCriteria,
      isNext,
      nos,
      questionType,
      jobRole,
      question_bank_id,
      language,
    } = req.body;
    if (!mongoose.isValidObjectId(question_bank_id)) {
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        "Please fill valid Id"
      );
    }
    let sectionExist = await Section.findOne({ section: section,question_bank_id:question_bank_id });
    if (!sectionExist) {
      sectionDetails = await new Section({
        section,
        nos,
        questionType,
        jobRole,
        question_bank_id,
        performanceCriteria,
        language,
      }).save();
      return sendResponse(
        res,
        200,
        responseMessage.section_create,
        sectionDetails
      );
    } else {
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        "Section is already created"
      );
    }
  } catch (err) {
    console.log("err", err);
    return errorResponse(res, 500, responseMessage.errorMessage, err.message);
  }
}
module.exports.CreateQuestion = async (req, res) => {
  try {
    const { error } = validateQuestion(req.body);
    if (error)
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        error.message
      );
    const {
      question_bank_id,
      section_id,
      isNext,
      questions,
    } = req.body;

    if (!isNext)
      return errorResponse(
        res,
        400,
        responseMessage.request_invalid,
        "Please fill all fields"
      );
    for (let item of questions) {
      const isQuestionExist = await Question.findOne({
        questionText: item.questionText,
      });
      if (isQuestionExist)
        return errorResponse(
          res,
          400,
          responseMessage.request_invalid,
          "Question is already created"
        );
    }
    const sectionExist=await Section.findOne({_id:section_id,question_bank_id:question_bank_id}) 
       if(!sectionExist) return errorResponse(res,400,responseMessage.request_invalid,"Section ID or QuestionBank ID not Exist" ); 
    let questionAddSection = [...questions];

    let questionWithSection = await questionAddSection.map((item, index) => {
      let val = Math.floor(1000 + Math.random() * 9000);
      return {
        ...item,
        questionId: val + index,
        section_id: section_id,
        question_bank_id,
      };
    });
    const saveQuestion = await Question.insertMany(questionWithSection);
    if (saveQuestion) {
      return sendResponse(
        res,
        200,
        responseMessage.question_create,
        saveQuestion
      );
    } else {
      return errorResponse(
        res,
        400,
        responseMessage.question_not_create,
        responseMessage.errorMessage
      );
    }
  } catch (error) {
    console.log("err", error);
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};
//this function is used to list all  question
module.exports.dowloadfile = (req, res) => {
  const filepath = `public/files`;
  const file = `${filepath}/sample.xlsx`;
  return res.status(200).download(file);
};
module.exports.QuestionList = async (req, res) => {
  try {
    const { page, limit, skip, sortOrder } = await Paginate(req);
    let query = {};
    const totalCounts = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalCounts / limit);
    const questionDetails = await Question.find({})
      .populate("section_id")
      .populate("question_bank_id")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    if (!questionDetails)
      return errorResponse(
        res,
        400,
        responseMessage.question_not_found,
        responseMessage.errorMessage
      );

    return sendResponse(res, 200, responseMessage.question_found, {
      questionDetails,
      page,
      totalCounts,
      totalPages,
    });
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};
const validatebulkUpload = (data) => {
  try {
    const schema = Joi.object({
      question_bank_id: Joi.string().required(),
      questionType: Joi.string().required(),
      section_id: Joi.string().required(),
      language: Joi.number().required(),
    });
    return schema.validate(data);
  } catch (err) {
    console.log(err);
  }
};
function validateStatusChange(body){
  try {
    const schema = Joi.object({
      section_id: Joi.string().required(),
      status: Joi.string().required(),
    });
    return schema.validate(body);
  } catch (err) {
    console.log(err);
  }
}
//this function is used to validate the question schema
function validateSection(data) {
  try {
    const schema = Joi.object({
      questionType: Joi.string().required(),
      question_bank_id: Joi.string().required(),
      isNext: Joi.bool().required(),
      jobRole: Joi.string().required(),
      section: Joi.string().required(),
      nos: Joi.string().trim().required(),
      performanceCriteria: Joi.any(),
      language: Joi.number().required(),
    });
    return schema.validate(data);
  } catch (err) {
    console.log(err);
  }
}
function validateQuestion(data) {
  try {
    const schema = Joi.object({
      section_id: Joi.string().required(),
      question_bank_id: Joi.string().required(),
      isNext: Joi.boolean(),
      questions: Joi.array().items({
        diffculityLevel:Joi.string().required(),
      }),
      options: Joi.array().max(5),
    });
    return schema.validate(data);
  } catch (err) {
    console.log(err);
  }
}
