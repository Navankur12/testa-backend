const mongoose = require("mongoose");

const QuestionBankSchema = mongoose.Schema({
    questionType: {
        type: String,
        required: true,
        enum: ['MCQ', 'Objective', 'Psychometric'],
    },
    questionBankId:{
        type:String,
        required:true,
    },
    jobRole: {
        type: String,
        required: true,
    },
    jobLevel: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    sector: {
        type: String,
        required: true
    },
    subSector: {
        type: String,
        required: true
    },
    sectorCode: {
        type: String,
        required:true
    },
    schemeName: {
        type: String,
        required: false
    },
    schemeCode: {
        type: String,
        required: false
    },
    nos: {
        type: String,
        required: true
    },
    nosCode: {
        type: String,
        required: true,
    },
    schemeName: {
        type: String,
        required: false
    },
    theoryMarks: {
        type: Number,
        required: true
    },
    practicalMarks: {
        type: Number,
        required:true
    },
    isQuestionFormCreated:{
        type:Boolean,
      },
    status:{
        type:String,
        enum:['active','inactive'],
        required:true
    }
}, { timestamps: true })

const QuestionModel = mongoose.model("QuestionBank", QuestionBankSchema)
module.exports = QuestionModel;
