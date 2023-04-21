const express = require("express");
const router = express.Router()
const { addSection,CreateQuestion,sectionList,changeStatus,QuestionList,getQuestionsBySectionId} = require("../controller/questionController")

router.post("/create-section",addSection)
router.post("/create-question", CreateQuestion);
router.post("/change-section-status",changeStatus)
router.get("/section-list",sectionList)
router.get("/question-list",QuestionList);
router.get("/question-by-section",getQuestionsBySectionId);


module.exports = router