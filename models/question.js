const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
    
   questionId:{
    type:String,
   },
    diffculityLevel:{
        type:String,
        required:true
    },
    questionMarks:{
        type:Number,
        required:true
    },
    correctAnswer:String,
    question_url:{
        type:String,

    },
    questionText:{
        type:String,
        required:true
    },
    section_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'sections'
    },
    question_bank_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'QuestionBank'
    },
    options: [{
        option_url:{
            type:String
        },
        optionId:{
            type:String,
        },
        title:String,
        isDelete:Boolean,
        isSelect:{
            type:Boolean,
            default:false
        }
        }]
   }, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
