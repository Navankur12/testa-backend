const Subadminprofile = require("../models/subadminModel");
const { weekDays, months, weeks, weekNumber } = require("../utils/custom-validators");
const responseMessage = require('../utils/responseMessage');
const { sendResponse, errorResponse } = require("../utils/response");
const CommonUsers = require("../models/common-user-model");
const DashboardLayout = require("../models/dashboard-layout-model");
exports.getDashboardStatistics = async (req, res) => {
    try {

        const getClientDetails = await Subadminprofile.find({}).countDocuments();

        if (getClientDetails) {

            let responseData = {
                onlineTestStreaming: 524,
                activeClients: (getClientDetails) ? getClientDetails : 0,
                totalAssessment: 102,
                scheduledAssessement: 132,
            }

            return sendResponse(res, 200, "statistics get successfully", responseData);
        } else {
            return errorResponse(res, 204, "client detials not found", "No data found");
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};

exports.getAdminDashboard = async (req, res) => {

    try {

        const getClientDetails = await Subadminprofile.find({}).countDocuments();

        const getActiveClients = await Subadminprofile.find({ status: "active" }).countDocuments();

        if (!getClientDetails) return errorResponse(res, 400, "client detials not found", "No data found");

        let responseData = {
            activeClientsStatistics: {
                maleCount: 25,
                femaleCount: 14
            },
            activeClients: (getActiveClients) ? getActiveClients : 0,
            notification: [
                "user created Successfully",
                "change password successfully",
                "file uploaded",
                "new account profile created",
                "test conducted successfully"
            ],
            upcomingAssignment: "",
            assessmentStatistics: "",

        }

        return sendResponse(res, 200, "Dashboard details get successfully", responseData);

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

exports.getUpcomingAssessement = async (req, res) => {

    try {

        if (req.body.isVisible) {

            const startDate = new Date(req.body.startDate);

            const endDate = new Date(req.body.endDate);

            if (startDate > endDate) {

                return errorResponse(res, 400, "End date is not valid", "End date should after than start date");

            }

            let upcomingAssessmentArray = [];

            let loopDate = new Date(startDate);

            do {

                let newDate = new Date(loopDate.setDate(loopDate.getDate()));

                loopDate = new Date(newDate);

                upcomingAssessmentArray.push({
                    date: loopDate.getDate(),
                    day: weekDays[loopDate.getDay()],
                    month: months[loopDate.getMonth()],
                    year: loopDate.getFullYear(),
                    totalAssessment: Math.floor((Math.random() * 90) + 10),
                });

                let addDate = new Date(loopDate.setDate(loopDate.getDate() + 1));

                loopDate = new Date(addDate);

            } while (loopDate <= endDate);

            let responseData = {
                isVisible: req.body.isVisible,
                assessmentDetail: upcomingAssessmentArray
            }

            return sendResponse(res, 200, "upcoming assessment get successfully", responseData);

        } else {

            let responseData = {
                isVisible: req.body.isVisible,
                assessmentDetail: []
            }
            return sendResponse(res, 200, "upcoming assessment is not visible", responseData);
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};


exports.getAssessmentStatistics = async (req, res) => {

    try {

        if (req.query.type) {

            const type = req.query.type;

            let responseData = [];

            switch (type) {

                case 'week':
                    responseData = weekDays.map((list) => {
                        return {
                            name: list,
                            value: Math.floor((Math.random() * 90) + 10)
                        }
                    });
                    return sendResponse(res, 200, responseMessage.assessment_statistics_success, responseData);
                case 'month':
                    responseData = weeks.map((list) => {
                        return {
                            name: list,
                            value: Math.floor((Math.random() * 90) + 10)
                        }
                    });
                    return sendResponse(res, 200, responseMessage.assessment_statistics_success, responseData);
                case 'year':
                    responseData = months.map((list) => {
                        return {
                            name: list,
                            value: Math.floor((Math.random() * 90) + 10)
                        }
                    });
                    return sendResponse(res, 200, responseMessage.assessment_statistics_success, responseData);
                default:
                    return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);
            }
        } else {

            return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);

        }

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}


exports.getActiveClientStatistics = async (req, res) => {

    try {

        const type = req.query.type;

        let manipulateCurrentDate = new Date();

        let getClientCount = await Subadminprofile.find({}).countDocuments();

        switch (type) {

            case 'week':

                let getweekday = weekNumber[manipulateCurrentDate.getDay()];

                let getFirstWeekDate = new Date(manipulateCurrentDate.setDate(manipulateCurrentDate.getDate() - getweekday));

                let getLastWeekDate = new Date(manipulateCurrentDate.setDate(manipulateCurrentDate.getDate() + 6));

                return sendFinalResultForAssessmentStatistics(res, getFirstWeekDate, getLastWeekDate, getClientCount);

            case 'month':

                let firstMonthDate = new Date(manipulateCurrentDate.getFullYear(), manipulateCurrentDate.getMonth(), 1);

                let lastMonthDate = new Date(manipulateCurrentDate.getFullYear(), manipulateCurrentDate.getMonth() + 1, 0);

                return sendFinalResultForAssessmentStatistics(res, firstMonthDate, lastMonthDate, getClientCount);

            case 'year':

                let yearFirstDate = new Date(manipulateCurrentDate.getFullYear(), manipulateCurrentDate.getMonth(), 1);

                let yearLastDate = new Date(manipulateCurrentDate.getFullYear(), manipulateCurrentDate.getMonth() + 12, 0);

                return sendFinalResultForAssessmentStatistics(res, yearFirstDate, yearLastDate, getClientCount);

            default:

                return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);

        }

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
};

async function sendFinalResultForAssessmentStatistics(res, firstDate, lastDate, getClientCount) {

    const getCount = await Subadminprofile.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(firstDate), $lte: new Date(lastDate) }
            }
        },
        {
            $project: {
                male: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] },
                female: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] },
                others: { $cond: [{ $eq: ["$gender", "others"] }, 1, 0] },
            }
        },
        {
            $group: {
                _id: 0,
                male: { $sum: "$male" },
                female: { $sum: "$female" },
                others: { $sum: "$others" }
            }
        },
    ]);

    getCount[0]['total'] = getClientCount;

    let setAssessmentObj = {
        male: getCount[0]['male'],
        female: getCount[0]['female'],
        others: getCount[0]['others'],
        total: getCount[0]['total']
    }

    let assessmentArr = [];

    if (setAssessmentObj.total > 0) {

        let malePercentage = calculatePercentage(setAssessmentObj.male, setAssessmentObj.total);

        let femalePercentage = calculatePercentage(setAssessmentObj.female, setAssessmentObj.total);

        let othersPercentage = calculatePercentage(setAssessmentObj.others, setAssessmentObj.total);

        assessmentArr = [
            {
                name: "male",
                count:malePercentage.count,
                per:malePercentage.percentage
                
            },
            {
                name: "female",
                count:femalePercentage.count,
                per:femalePercentage.percentage
            },
            {
                name: "others",
                count:othersPercentage.count,
                per:othersPercentage.percentage
            }
        ]

        let finalAssessmentObj = {
            total:setAssessmentObj.total,
            data:assessmentArr
        }

        return sendResponse(res, 200, "Assessment Statistics get successfully", finalAssessmentObj);
    }
}

function calculatePercentage(value, total) {
    return {
        count: value,
        percentage: `${value / total * 100}%`
    }
}

exports.setResponsiveDashboard = async (req, res) => {
    try {
        if (req.body.id) {

            const userId = req.body.id;

            const requestLayout = req.body.layout;

            const user = await CommonUsers.findById(userId);

            if (!user) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);

            const findLayout = await DashboardLayout.findOne({ userId: userId });

            if (findLayout) {

                let updateLayout = await DashboardLayout.findOneAndUpdate({ userId: findLayout.userId }, {
                    lg: requestLayout.lg,
                    md: requestLayout.md,
                    sm: requestLayout.sm,
                    xs: requestLayout.xs,
                    xxs: requestLayout.xxs,
                }, { new: true });

                return sendResponse(res, 200, "Dashboard layout set successfully", updateLayout);

            } else {
                let createLayout = new DashboardLayout({
                    lg: requestLayout.lg,
                    md: requestLayout.md,
                    sm: requestLayout.sm,
                    xs: requestLayout.xs,
                    xxs: requestLayout.xxs,
                    userId: user._id
                });
                let layoutSettled = await createLayout.save();

                return sendResponse(res, 200, "Dashboard layout set successfully", layoutSettled);

            }

        } else {
            return errorResponse(res, 400, "User id is required", responseMessage.errorMessage);
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};

exports.getResponsiveDashboard = async (req, res) => {

    try {

        if (req.params.id) {

            const getUserId = req.params.id;

            const getLayout = await DashboardLayout.findOne({ userId: getUserId });

            if (!getLayout) return errorResponse(res, 400, "Layout not found to this user", responseMessage.errorMessage);

            return sendResponse(res, 200, "dashboard layout get successfully", getLayout);

        }

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

exports.dashboardNotification = async (req,res) => {
    try {
        
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};
