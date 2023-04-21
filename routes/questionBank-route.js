const router = require("express").Router();
const { createQuestionForm,changeStatus, getJobrole,getSector,getQuestionBankList,questionBankFilter,getQuestionsByQuestionBankId,QuestionBankList} = require("../controller/questionBankController");
const auth = require("../middleware/userAuth");
router.post("/createQuestion",createQuestionForm);
router.get("/getJobrole", getJobrole);
router.get("/getSector", getSector);
router.post("/change-questionbank-status",changeStatus)
router.get("/questionbank-list",getQuestionBankList);
router.get("/questionbank-filter",questionBankFilter);
router.get("/get-questionByQBankId",getQuestionsByQuestionBankId)

module.exports = router;