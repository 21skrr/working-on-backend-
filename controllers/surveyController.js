// backend/controllers/surveyController.js
const {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyQuestionResponse,
  User,
  Notification,
  sequelize,
  Team,
  SurveySchedule,
  SurveySettings
} = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// Get all surveys
const getAllSurveys = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [
        { 
          model: SurveyQuestion,
          as: 'SurveyQuestions'
        },
        { 
          model: User,
          as: "creator"
        }
      ],
    });
    res.json(surveys);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's surveys
const getUserSurveys = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      where: {
        targetRole: {
          [Op.or]: ["all", req.user.role],
        },
        status: "active",
      },
      include: [
        { 
          model: SurveyQuestion,
          as: 'SurveyQuestions'
        },
        { 
          model: User,
          as: "creator"
        }
      ],
    });
    res.json(surveys);
  } catch (error) {
    console.error("Error fetching user surveys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available surveys for the current user
const getAvailableSurveys = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentDate = new Date();

    // Find all active surveys that match the user's role and program
    const surveys = await Survey.findAll({
      where: {
        status: 'active',
        [Op.and]: [
          // Match user's role or 'all'
          {
            targetRole: {
              [Op.or]: ['all', currentUser.role]
            }
          },
          // Match user's program or 'all'
          {
            targetProgram: {
              [Op.or]: ['all', currentUser.programType]
            }
          },
          // Check due date if exists
          {
            [Op.or]: [
              { dueDate: { [Op.gt]: currentDate } },
              { dueDate: null }
            ]
          }
        ]
      },
      include: [
        {
          model: SurveyQuestion,
          as: 'SurveyQuestions',
          attributes: ['id', 'question', 'type', 'required', 'options', 'questionOrder']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        },
        {
          model: SurveyResponse,
          as: 'responses',
          where: { userId: currentUser.id },
          required: false,
          attributes: ['id', 'status', 'submittedAt']
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: SurveyQuestion, as: 'SurveyQuestions' }, 'questionOrder', 'ASC']
      ]
    });

    // Format the response to include completion status
    const formattedSurveys = surveys.map(survey => {
      const surveyJson = survey.toJSON();
      const hasResponded = surveyJson.responses && surveyJson.responses.length > 0;
      
      return {
        ...surveyJson,
        isCompleted: hasResponded,
        completionDate: hasResponded ? surveyJson.responses[0].submittedAt : null,
        responses: undefined // Remove detailed response data from output
      };
    });

    res.json(formattedSurveys);
  } catch (error) {
    console.error('Error fetching available surveys:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get survey by ID
const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id, {
      include: [
        { 
          model: SurveyQuestion,
          as: 'SurveyQuestions'
        },
        { 
          model: User,
          as: "creator"
        }
      ],
    });
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    res.json(survey);
  } catch (error) {
    console.error("Error fetching survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create survey
const createSurvey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, type, targetRole, description } = req.body;
    const survey = await Survey.create({
      title,
      type,
      targetRole,
      description,
      creatorId: req.user.id,
      status: "draft",
    });

    res.status(201).json(survey);
  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update survey
const updateSurvey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { title, status, description } = req.body;
    await survey.update({
      title: title || survey.title,
      status: status || survey.status,
      description: description || survey.description,
    });

    res.json(survey);
  } catch (error) {
    console.error("Error updating survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete survey
const deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    await survey.destroy();
    res.json({ message: "Survey deleted successfully" });
  } catch (error) {
    console.error("Error deleting survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add question to survey
const addQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { text, type, options, required } = req.body;
    
    // Get the highest questionOrder
    const maxOrderQuestion = await SurveyQuestion.findOne({
      where: { surveyId: survey.id },
      order: [['questionOrder', 'DESC']]
    });
    const nextOrder = maxOrderQuestion ? maxOrderQuestion.questionOrder + 1 : 1;

    const question = await SurveyQuestion.create({
      surveyId: survey.id,
      question: text,
      type,
      options: options ? JSON.stringify(options) : null,
      required: required || false,
      questionOrder: nextOrder
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const question = await SurveyQuestion.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const { text, type, options, required } = req.body;
    await question.update({
      question: text || question.question,
      type: type || question.type,
      options: options ? JSON.stringify(options) : question.options,
      required: required !== undefined ? required : question.required
    });

    res.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await SurveyQuestion.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await question.destroy();
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit survey response
const submitResponse = async (req, res) => {
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // First check if survey exists and get questions
    const survey = await Survey.findByPk(req.params.surveyId, {
      include: [{
        model: SurveyQuestion,
        as: 'SurveyQuestions'
      }],
      transaction
    });

    if (!survey) {
      await transaction.rollback();
      return res.status(404).json({ message: "Survey not found" });
    }

    // Check if user has already submitted a response - do this first before any other operations
    const existingResponse = await SurveyResponse.findOne({
      where: {
        surveyId: survey.id,
        userId: req.user.id
      },
      transaction
    });

    if (existingResponse) {
      await transaction.rollback();
      return res.status(400).json({ message: "You have already submitted a response to this survey" });
    }

    // Validate that all required questions are answered
    const { responses } = req.body;
    if (!responses || !Array.isArray(responses)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid response format" });
    }

    const questionMap = new Map(survey.SurveyQuestions.map(q => [q.id, q]));
    
    // Check if all required questions are answered
    for (const question of survey.SurveyQuestions) {
      if (question.required) {
        const response = responses.find(r => r.questionId === question.id);
        if (!response) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Missing response for required question: ${question.question}` 
          });
        }

        // Validate response format based on question type
        if (question.type === 'rating') {
          const rating = parseInt(response.rating);
          if (isNaN(rating) || rating < 1 || rating > 5) {
            await transaction.rollback();
            return res.status(400).json({ 
              message: `Invalid rating for question: ${question.question}. Rating must be between 1 and 5.` 
            });
          }
        }
        if (question.type === 'multiple_choice' && !response.selectedOption) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Missing selected option for question: ${question.question}` 
          });
        }
        if (question.type === 'text' && !response.answer) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: `Missing text answer for question: ${question.question}` 
          });
        }
      }
    }
    const surveyAnonymity = await getSystemSetting("surveyAnonymity");
    const isAnonymous = surveyAnonymity === true || surveyAnonymity === "true";
    // Create the survey response
    const surveyResponse = await SurveyResponse.create({
      surveyId: survey.id,
      userId: isAnonymous ? null : req.user.id,
      status: 'completed',
      submittedAt: new Date()
    }, { transaction });

    // Create individual question responses
    const questionResponses = [];
    for (const response of responses) {
      const question = questionMap.get(response.questionId);
      if (!question) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Invalid question ID: ${response.questionId}` 
        });
      }

      questionResponses.push(
        await SurveyQuestionResponse.create({
          surveyResponseId: surveyResponse.id,
          questionId: response.questionId,
          answer: response.answer || null,
          ratingValue: response.rating || null,
          selectedOption: response.selectedOption || null
        }, { transaction })
      );
    }

    // If everything succeeded, commit the transaction
    await transaction.commit();

    res.status(201).json({
      message: "Survey response submitted successfully",
      isAnonymous,
      responseId: surveyResponse.id,
      submittedAt: surveyResponse.submittedAt,
      responses: questionResponses.map(qr => ({
        questionId: qr.questionId,
        answer: qr.answer,
        rating: qr.ratingValue,
        selectedOption: qr.selectedOption
      }))
    });
    
  } catch (error) {
    // If anything fails, rollback the transaction
    await transaction.rollback();
    console.error("Error submitting response:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message // Include error message for debugging
    });
  }
};

// Get survey responses
const getSurveyResponses = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const responses = await SurveyResponse.findAll({
      where: { surveyId: survey.id },
      include: [
        { 
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: SurveyQuestionResponse,
          include: [{
            model: SurveyQuestion,
            attributes: ['question', 'type']
          }]
        }
      ]
    });

    res.json(responses);
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get survey history for the current user
const getSurveyHistory = async (req, res) => {
  try {
    const responses = await SurveyResponse.findAll({
      where: { 
        userId: req.user.id,
        status: 'completed'
      },
      include: [
        {
          model: Survey,
          as: 'survey',
          attributes: ['id', 'title', 'type', 'description'],
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'role']
          }]
        },
        {
          model: SurveyQuestionResponse,
          as: 'questionResponses',
          include: [{
            model: SurveyQuestion,
            as: 'question',
            attributes: ['question', 'type']
          }]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    // Format the response to be more user-friendly
    const formattedResponses = responses.map(response => {
      const responseJson = response.toJSON();
      return {
        id: responseJson.id,
        submittedAt: responseJson.submittedAt,
        survey: responseJson.survey,
        answers: responseJson.questionResponses.map(qr => ({
          question: qr.question.question,
          type: qr.question.type,
          answer: qr.answer,
          rating: qr.ratingValue,
          selectedOption: qr.selectedOption
        }))
      };
    });

    res.json(formattedResponses);
  } catch (error) {
    console.error("Error fetching survey history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team survey results
const getTeamSurveyResults = async (req, res) => {
  try {
    const { 
      view = 'all', 
      surveyType, 
      formId, 
      employeeId, 
      startDate, 
      endDate,
      status // Add status filter
    } = req.query;

    // Validate user is a supervisor
    if (!['supervisor', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view team results' });
    }

    // Base query to get team members
    let teamMemberQuery = {
      role: 'employee'
    };

    // For supervisors, only show their direct reports
    if (req.user.role === 'supervisor') {
      teamMemberQuery.supervisorId = req.user.id;
    }
    // For managers/HR, optionally filter by department if they have one
    else if (req.user.department) {
      teamMemberQuery.department = req.user.department;
    }

    // Get team members
    const teamMembers = await User.findAll({
      where: teamMemberQuery,
      attributes: ['id', 'name', 'email', 'role', 'department', 'teamId'],
      include: [{
        model: Team,
        attributes: ['name', 'department']
      }]
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    // Base query for survey responses
    let surveyQuery = {
      userId: { [Op.in]: teamMemberIds }
    };

    // Add date filters if provided
    if (startDate && endDate) {
      surveyQuery.submittedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add specific survey filters if provided
    if (formId) {
      surveyQuery.surveyId = formId;
    }

    // Get survey responses with questions
    const responses = await SurveyResponse.findAll({
      where: surveyQuery,
      include: [
        {
          model: Survey,
          as: 'survey',
          where: {
            ...(surveyType ? { type: surveyType } : {}),
            ...(status ? { status } : {}) // Add status filter to survey
          },
          attributes: ['id', 'title', 'type', 'description', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'teamId']
        },
        {
          model: SurveyQuestionResponse,
          as: 'questionResponses',
          include: [{
            model: SurveyQuestion,
            as: 'question',
            attributes: ['id', 'question', 'type']
          }]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    let result;

    switch (view) {
      case 'aggregated':
        // Aggregate responses by survey type/form
        result = responses.reduce((acc, response) => {
          const surveyId = response.survey.id;
          if (!acc[surveyId]) {
            acc[surveyId] = {
              surveyTitle: response.survey.title,
              surveyType: response.survey.type,
              totalResponses: 0,
              participationRate: 0,
              averageScores: {},
              responseCount: 0
            };
          }

          acc[surveyId].totalResponses++;
          acc[surveyId].participationRate = (acc[surveyId].totalResponses / teamMembers.length) * 100;

          // Aggregate scores for rating questions
          response.questionResponses.forEach(qr => {
            if (qr.question.type === 'rating' && qr.ratingValue) {
              if (!acc[surveyId].averageScores[qr.question.id]) {
                acc[surveyId].averageScores[qr.question.id] = {
                  question: qr.question.question,
                  totalScore: 0,
                  responseCount: 0
                };
              }
              acc[surveyId].averageScores[qr.question.id].totalScore += qr.ratingValue;
              acc[surveyId].averageScores[qr.question.id].responseCount++;
            }
          });

          return acc;
        }, {});

        // Calculate final averages
        Object.values(result).forEach(survey => {
          Object.values(survey.averageScores).forEach(score => {
            score.averageScore = score.totalScore / score.responseCount;
            delete score.totalScore;
            delete score.responseCount;
          });
        });
        break;

      case 'individual':
        // Filter for specific employee if provided
        if (employeeId) {
          result = responses.filter(r => r.user.id === employeeId);
        } else {
          result = responses;
        }
        
        // Format individual responses
        result = result.map(response => ({
          submissionId: response.id,
          employeeId: response.user.id,
          employeeName: response.user.name,
          department: response.user.department,
          surveyTitle: response.survey.title,
          surveyType: response.survey.type,
          submittedAt: response.submittedAt,
          answers: response.questionResponses.map(qr => ({
            questionId: qr.question.id,
            question: qr.question.question,
            type: qr.question.type,
            answer: qr.answer,
            rating: qr.ratingValue,
            selectedOption: qr.selectedOption
          }))
        }));
        break;

      case 'all':
      default:
        // Return all raw responses with basic formatting
        result = responses.map(response => ({
          submissionId: response.id,
          employeeId: response.user.id,
          employeeName: response.user.name,
          department: response.user.department,
          surveyTitle: response.survey.title,
          surveyType: response.survey.type,
          submittedAt: response.submittedAt,
          responses: response.questionResponses.map(qr => ({
            question: qr.question.question,
            type: qr.question.type,
            answer: qr.answer,
            rating: qr.ratingValue,
            selectedOption: qr.selectedOption
          }))
        }));
        break;
    }

    res.json({
      teamSize: teamMembers.length,
      filters: {
        view,
        surveyType: surveyType || 'all',
        dateRange: startDate && endDate ? { startDate, endDate } : 'all',
        employeeId: employeeId || 'all',
        status: status || 'all'
      },
      results: result
    });

  } catch (error) {
    console.error('Error fetching team survey results:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team survey completion status
const getTeamSurveyCompletionStatus = async (req, res) => {
  try {
    const { status = 'active' } = req.query; // Default to active surveys if no status provided

    // Validate status value
    const validStatuses = ['draft', 'active', 'completed', 'all'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: draft, active, completed, all' 
      });
    }

    // Validate user is a supervisor
    if (!['supervisor', 'manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view team completion status' });
    }

    // Base query to get team members
    let teamMemberQuery = {
      role: 'employee'
    };

    // For supervisors, only show their direct reports
    if (req.user.role === 'supervisor') {
      teamMemberQuery.supervisorId = req.user.id;
    }
    // For managers/HR, optionally filter by department if they have one
    else if (req.user.department) {
      teamMemberQuery.department = req.user.department;
    }

    // Get team members
    const teamMembers = await User.findAll({
      where: teamMemberQuery,
      attributes: ['id', 'name', 'email', 'department', 'teamId'],
      include: [{
        model: Team,
        attributes: ['name', 'department']
      }]
    });

    // Get surveys based on status
    const surveyQuery = {
      targetRole: {
        [Op.or]: ['employee', 'all']
      },
      ...(status !== 'all' ? { status } : {})
    };

    // Get filtered surveys
    const surveys = await Survey.findAll({
      where: surveyQuery,
      attributes: ['id', 'title', 'type', 'description', 'dueDate', 'createdAt', 'status']
    });

    // Get all survey responses for team members
    const surveyResponses = await SurveyResponse.findAll({
      where: {
        userId: {
          [Op.in]: teamMembers.map(member => member.id)
        },
        surveyId: {
          [Op.in]: surveys.map(survey => survey.id)
        }
      },
      attributes: ['id', 'surveyId', 'userId', 'status', 'submittedAt'],
      include: [{
        model: Survey,
        as: 'survey',
        attributes: ['title', 'type', 'status']
      }]
    });

    // Calculate completion status for each team member
    const teamCompletionStatus = teamMembers.map(member => {
      const memberResponses = surveyResponses.filter(response => 
        response.userId === member.id
      );

      const surveyStatus = surveys.map(survey => {
        const response = memberResponses.find(r => r.surveyId === survey.id);
        return {
          surveyId: survey.id,
          surveyTitle: survey.title,
          surveyType: survey.type,
          surveyStatus: survey.status,
          dueDate: survey.dueDate,
          status: response ? response.status : 'pending',
          submittedAt: response ? response.submittedAt : null,
          isOverdue: survey.dueDate && new Date() > new Date(survey.dueDate) && (!response || response.status !== 'completed')
        };
      });

      const completionStats = {
        total: surveys.length,
        completed: surveyStatus.filter(s => s.status === 'completed').length,
        pending: surveyStatus.filter(s => s.status === 'pending').length,
        overdue: surveyStatus.filter(s => s.isOverdue).length
      };

      return {
        employeeId: member.id,
        employeeName: member.name,
        email: member.email,
        department: member.department,
        team: member.Team ? member.Team.name : null,
        completionRate: completionStats.total > 0 ? (completionStats.completed / completionStats.total) * 100 : 0,
        stats: completionStats,
        surveys: surveyStatus
      };
    });

    // Calculate overall team statistics
    const teamStats = {
      totalTeamMembers: teamMembers.length,
      totalSurveys: surveys.length,
      surveyStatusBreakdown: {
        draft: surveys.filter(s => s.status === 'draft').length,
        active: surveys.filter(s => s.status === 'active').length,
        completed: surveys.filter(s => s.status === 'completed').length
      },
      averageCompletionRate: teamMembers.length > 0 ? 
        teamCompletionStatus.reduce((acc, curr) => acc + curr.completionRate, 0) / teamMembers.length : 0,
      surveyBreakdown: surveys.map(survey => {
        const responses = surveyResponses.filter(r => r.surveyId === survey.id);
        return {
          surveyId: survey.id,
          title: survey.title,
          type: survey.type,
          status: survey.status,
          completionRate: (responses.filter(r => r.status === 'completed').length / teamMembers.length) * 100,
          dueDate: survey.dueDate
        };
      })
    };

    res.json({
      filterStatus: status,
      teamStats,
      memberDetails: teamCompletionStatus
    });

  } catch (error) {
    console.error('Error fetching team survey completion status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get department survey analytics
const getDepartmentAnalytics = async (req, res) => {
  try {
    // Validate user is a manager or HR
    if (!['manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view department analytics' });
    }

    const { 
      department = req.user.department, // Default to user's department
      startDate,
      endDate,
      surveyType,
      programType
    } = req.query;

    // If user is manager, they can only view their department
    if (req.user.role === 'manager' && department !== req.user.department) {
      return res.status(403).json({ message: 'Managers can only view their own department analytics' });
    }

    // Base query for department users
    let departmentQuery = {
      role: 'employee'
    };
    
    if (department) {
      departmentQuery.department = department;
    }

    if (programType) {
      departmentQuery.programType = programType;
    }

    // Get department employees
    const departmentEmployees = await User.findAll({
      where: departmentQuery,
      attributes: ['id', 'name', 'email', 'programType', 'startDate'],
      include: [{
        model: Team,
        attributes: ['name']
      }]
    });

    const employeeIds = departmentEmployees.map(emp => emp.id);

    // Build survey query
    let surveyQuery = {};
    if (surveyType) {
      surveyQuery.type = surveyType;
    }

    // Get all relevant surveys
    const surveys = await Survey.findAll({
      where: surveyQuery,
      attributes: ['id', 'title', 'type', 'status', 'createdAt', 'dueDate'],
      include: [{
        model: SurveyResponse,
        as: 'responses',
        where: {
          userId: { [Op.in]: employeeIds },
          ...(startDate && endDate ? {
            submittedAt: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          } : {})
        },
        required: false,
        include: [{
          model: SurveyQuestionResponse,
          as: 'questionResponses',
          include: [{
            model: SurveyQuestion,
            as: 'question',
            attributes: ['type', 'question']
          }]
        }]
      }]
    });

    // Calculate analytics
    const analytics = {
      departmentInfo: {
        name: department || 'All Departments',
        totalEmployees: departmentEmployees.length,
        programTypeBreakdown: departmentEmployees.reduce((acc, emp) => {
          acc[emp.programType] = (acc[emp.programType] || 0) + 1;
          return acc;
        }, {})
      },
      surveyMetrics: {
        total: surveys.length,
        byType: surveys.reduce((acc, survey) => {
          acc[survey.type] = (acc[survey.type] || 0) + 1;
          return acc;
        }, {}),
        byStatus: surveys.reduce((acc, survey) => {
          acc[survey.status] = (acc[survey.status] || 0) + 1;
          return acc;
        }, {})
      },
      participationMetrics: surveys.map(survey => {
        const responses = survey.responses || [];
        const responseRate = (responses.length / departmentEmployees.length) * 100;
        
        // Calculate average ratings if applicable
        const ratingResponses = responses.flatMap(r => 
          r.questionResponses.filter(qr => qr.question.type === 'rating')
        );
        
        const averageRating = ratingResponses.length > 0
          ? ratingResponses.reduce((sum, qr) => sum + (qr.ratingValue || 0), 0) / ratingResponses.length
          : null;

        return {
          surveyId: survey.id,
          title: survey.title,
          type: survey.type,
          status: survey.status,
          responseRate,
          totalResponses: responses.length,
          pendingResponses: departmentEmployees.length - responses.length,
          averageRating,
          submissionTrend: responses.reduce((acc, r) => {
            const date = new Date(r.submittedAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {}),
          completionByProgram: departmentEmployees.reduce((acc, emp) => {
            const hasResponded = responses.some(r => r.userId === emp.id);
            acc[emp.programType] = acc[emp.programType] || { total: 0, completed: 0 };
            acc[emp.programType].total++;
            if (hasResponded) acc[emp.programType].completed++;
            return acc;
          }, {})
        };
      }),
      timeAnalysis: {
        averageCompletionTime: calculateAverageCompletionTime(surveys),
        responseDistribution: calculateAnalyticsResponseDistribution(surveys.responses),
      }
    };

    res.json({
      filters: {
        department: department || 'all',
        dateRange: startDate && endDate ? { startDate, endDate } : 'all',
        surveyType: surveyType || 'all',
        programType: programType || 'all'
      },
      analytics
    });

  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate average completion time
const calculateAverageCompletionTime = (surveys) => {
  const completionTimes = surveys.flatMap(survey => 
    survey.responses
      .filter(r => r.submittedAt && r.createdAt)
      .map(r => new Date(r.submittedAt) - new Date(r.createdAt))
  );

  return completionTimes.length > 0
    ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
    : null;
};

// Helper function to calculate response distribution for analytics
const calculateAnalyticsResponseDistribution = (responses) => {
  const distribution = {
    morning: 0,    // 6-12
    afternoon: 0,  // 12-17
    evening: 0,    // 17-22
    night: 0       // 22-6
  };

  responses.forEach(response => {
    if (!response.submittedAt) return;
    
    const hour = new Date(response.submittedAt).getHours();
    if (hour >= 6 && hour < 12) distribution.morning++;
    else if (hour >= 12 && hour < 17) distribution.afternoon++;
    else if (hour >= 17 && hour < 22) distribution.evening++;
    else distribution.night++;
  });

  return distribution;
};

// Get department survey insights
const getDepartmentInsights = async (req, res) => {
  try {
    // Validate user is a manager or HR
    if (!['manager', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view department insights' });
    }

    const { 
      department = req.user.department, // Default to user's department
      timeframe = '6months', // Options: '3months', '6months', '1year'
      programType,
      surveyType
    } = req.query;

    // If user is manager, they can only view their department
    if (req.user.role === 'manager' && department !== req.user.department) {
      return res.status(403).json({ message: 'Managers can only view their own department insights' });
    }

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // 6months
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Base query for department users
    let departmentQuery = {
      role: 'employee'
    };
    
    if (department) {
      departmentQuery.department = department;
    }

    if (programType) {
      departmentQuery.programType = programType;
    }

    // Get department employees
    const departmentEmployees = await User.findAll({
      where: departmentQuery,
      attributes: ['id', 'name', 'programType', 'startDate']
    });

    const employeeIds = departmentEmployees.map(emp => emp.id);

    // Get surveys and responses
    const surveys = await Survey.findAll({
      where: {
        ...(surveyType ? { type: surveyType } : {}),
        status: 'completed'
      },
      include: [{
        model: SurveyResponse,
        as: 'responses',
        where: {
          userId: { [Op.in]: employeeIds },
          submittedAt: {
            [Op.between]: [startDate, endDate]
          },
          status: 'completed'
        },
        include: [{
          model: SurveyQuestionResponse,
          as: 'questionResponses',
          include: [{
            model: SurveyQuestion,
            as: 'question',
            attributes: ['type', 'question']
          }]
        }]
      }]
    });

    // Generate insights
    const insights = {
      overview: {
        totalSurveys: surveys.length,
        totalResponses: surveys.reduce((sum, s) => sum + s.responses.length, 0),
        participationRate: calculateParticipationRate(surveys, departmentEmployees.length),
        timeframeComparison: await compareWithPreviousTimeframe(
          department, 
          startDate, 
          endDate, 
          employeeIds
        )
      },
      trends: {
        responseRateTrend: calculateResponseTrend(surveys),
        satisfactionTrend: calculateSatisfactionTrend(surveys),
        programTypeComparison: calculateProgramTypeInsights(surveys, departmentEmployees)
      },
      keyFindings: {
        strengths: identifyStrengths(surveys),
        areasForImprovement: identifyAreasForImprovement(surveys),
        emergingPatterns: identifyEmergingPatterns(surveys)
      },
      recommendations: generateRecommendations(surveys),
      engagementMetrics: calculateEngagementMetrics(surveys, departmentEmployees)
    };

    res.json({
      department: department || 'All Departments',
      timeframe,
      dateRange: {
        start: startDate,
        end: endDate
      },
      insights
    });

  } catch (error) {
    console.error('Error generating department insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate participation rate
const calculateParticipationRate = (surveys, totalEmployees) => {
  if (surveys.length === 0 || totalEmployees === 0) return 0;
  
  const uniqueRespondents = new Set(
    surveys.flatMap(s => s.responses.map(r => r.userId))
  ).size;
  
  return (uniqueRespondents / totalEmployees) * 100;
};

// Helper function to compare with previous timeframe
const compareWithPreviousTimeframe = async (department, startDate, endDate, employeeIds) => {
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(startDate);
  const timeframeDiff = endDate - startDate;
  
  previousStartDate.setTime(previousStartDate.getTime() - timeframeDiff);
  previousEndDate.setTime(previousEndDate.getTime() - timeframeDiff);

  const previousResponses = await SurveyResponse.count({
    where: {
      userId: { [Op.in]: employeeIds },
      submittedAt: {
        [Op.between]: [previousStartDate, previousEndDate]
      },
      status: 'completed'
    }
  });

  const currentResponses = await SurveyResponse.count({
    where: {
      userId: { [Op.in]: employeeIds },
      submittedAt: {
        [Op.between]: [startDate, endDate]
      },
      status: 'completed'
    }
  });

  return {
    previousPeriod: {
      startDate: previousStartDate,
      endDate: previousEndDate,
      responses: previousResponses
    },
    currentPeriod: {
      startDate,
      endDate,
      responses: currentResponses
    },
    changePercentage: previousResponses === 0 ? 100 :
      ((currentResponses - previousResponses) / previousResponses) * 100
  };
};

// Helper function to calculate response trend
const calculateResponseTrend = (surveys) => {
  const trend = {};
  
  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      const month = new Date(response.submittedAt).toISOString().slice(0, 7);
      trend[month] = (trend[month] || 0) + 1;
    });
  });

  return Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
};

// Helper function to calculate satisfaction trend
const calculateSatisfactionTrend = (surveys) => {
  const trend = {};
  
  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      const month = new Date(response.submittedAt).toISOString().slice(0, 7);
      const ratings = response.questionResponses
        .filter(qr => qr.question.type === 'rating')
        .map(qr => qr.ratingValue || 0);
      
      if (!trend[month]) {
        trend[month] = { sum: 0, count: 0 };
      }
      
      trend[month].sum += ratings.reduce((a, b) => a + b, 0);
      trend[month].count += ratings.length;
    });
  });

  return Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      averageRating: data.count > 0 ? data.sum / data.count : 0
    }));
};

// Helper function to calculate program type insights
const calculateProgramTypeInsights = (surveys, employees) => {
  const programTypes = {};
  
  employees.forEach(emp => {
    if (!programTypes[emp.programType]) {
      programTypes[emp.programType] = {
        totalEmployees: 0,
        responses: 0,
        averageRating: 0,
        ratingSum: 0,
        ratingCount: 0
      };
    }
    programTypes[emp.programType].totalEmployees++;
  });

  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      const employee = employees.find(emp => emp.id === response.userId);
      if (!employee) return;

      const programType = programTypes[employee.programType];
      programType.responses++;

      response.questionResponses
        .filter(qr => qr.question.type === 'rating')
        .forEach(qr => {
          if (qr.ratingValue) {
            programType.ratingSum += qr.ratingValue;
            programType.ratingCount++;
          }
        });
    });
  });

  // Calculate final averages
  Object.values(programTypes).forEach(pt => {
    pt.averageRating = pt.ratingCount > 0 ? pt.ratingSum / pt.ratingCount : 0;
    pt.participationRate = (pt.responses / pt.totalEmployees) * 100;
    delete pt.ratingSum;
    delete pt.ratingCount;
  });

  return programTypes;
};

// Helper function to identify strengths
const identifyStrengths = (surveys) => {
  const questionScores = {};
  
  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      response.questionResponses.forEach(qr => {
        if (qr.question.type === 'rating' && qr.ratingValue) {
          if (!questionScores[qr.question.question]) {
            questionScores[qr.question.question] = {
              sum: 0,
              count: 0
            };
          }
          questionScores[qr.question.question].sum += qr.ratingValue;
          questionScores[qr.question.question].count++;
        }
      });
    });
  });

  return Object.entries(questionScores)
    .map(([question, data]) => ({
      question,
      averageRating: data.count > 0 ? data.sum / data.count : 0
    }))
    .filter(q => q.averageRating >= 4) // Consider ratings >= 4 as strengths
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5); // Top 5 strengths
};

// Helper function to identify areas for improvement
const identifyAreasForImprovement = (surveys) => {
  const questionScores = {};
  
  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      response.questionResponses.forEach(qr => {
        if (qr.question.type === 'rating' && qr.ratingValue) {
          if (!questionScores[qr.question.question]) {
            questionScores[qr.question.question] = {
              sum: 0,
              count: 0
            };
          }
          questionScores[qr.question.question].sum += qr.ratingValue;
          questionScores[qr.question.question].count++;
        }
      });
    });
  });

  return Object.entries(questionScores)
    .map(([question, data]) => ({
      question,
      averageRating: data.count > 0 ? data.sum / data.count : 0
    }))
    .filter(q => q.averageRating < 3.5) // Consider ratings < 3.5 as areas for improvement
    .sort((a, b) => a.averageRating - b.averageRating)
    .slice(0, 5); // Top 5 areas needing improvement
};

// Helper function to identify emerging patterns
const identifyEmergingPatterns = (surveys) => {
  // Sort surveys by date
  const sortedSurveys = [...surveys].sort((a, b) => 
    new Date(a.responses[0]?.submittedAt) - new Date(b.responses[0]?.submittedAt)
  );

  const patterns = {
    ratingTrends: [],
    participationPatterns: [],
    programTypePatterns: []
  };

  if (sortedSurveys.length >= 2) {
    // Compare first and last surveys for trends
    const firstSurvey = sortedSurveys[0];
    const lastSurvey = sortedSurveys[sortedSurveys.length - 1];

    // Calculate rating trends
    const firstAvgRating = calculateAverageRatings(firstSurvey);
    const lastAvgRating = calculateAverageRatings(lastSurvey);
    
    if (Math.abs(lastAvgRating - firstAvgRating) >= 0.5) {
      patterns.ratingTrends.push({
        type: lastAvgRating > firstAvgRating ? 'improvement' : 'decline',
        magnitude: Math.abs(lastAvgRating - firstAvgRating),
        description: `Overall satisfaction has ${lastAvgRating > firstAvgRating ? 'improved' : 'declined'} by ${Math.abs(lastAvgRating - firstAvgRating).toFixed(1)} points`
      });
    }
  }

  return patterns;
};

// Helper function to calculate average ratings
const calculateAverageRatings = (survey) => {
  const ratings = survey.responses.flatMap(response =>
    response.questionResponses
      .filter(qr => qr.question.type === 'rating')
      .map(qr => qr.ratingValue || 0)
  );
  
  return ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0;
};

// Helper function to generate recommendations
const generateRecommendations = (surveys) => {
  const recommendations = [];
  const areasForImprovement = identifyAreasForImprovement(surveys);
  
  // Generate recommendations based on areas needing improvement
  areasForImprovement.forEach(area => {
    if (area.averageRating < 3) {
      recommendations.push({
        priority: 'high',
        area: area.question,
        suggestion: `Immediate attention needed for "${area.question}". Consider conducting focused feedback sessions.`
      });
    } else {
      recommendations.push({
        priority: 'medium',
        area: area.question,
        suggestion: `Regular monitoring and improvement needed for "${area.question}".`
      });
    }
  });

  // Add participation-based recommendations
  const participationRate = calculateParticipationRate(surveys, surveys.reduce((max, s) => 
    Math.max(max, s.responses.length), 0));
  
  if (participationRate < 70) {
    recommendations.push({
      priority: 'high',
      area: 'Survey Participation',
      suggestion: 'Implement strategies to increase survey participation rate, such as regular reminders and highlighting the importance of feedback.'
    });
  }

  return recommendations.slice(0, 5); // Return top 5 most important recommendations
};

// Helper function to calculate engagement metrics
const calculateEngagementMetrics = (surveys, employees) => {
  const metrics = {
    overall: {
      participationTrend: [],
      responseTimeAnalysis: {
        averageResponseTime: 0,
        responseTimeDistribution: {
          within24h: 0,
          within48h: 0,
          within1week: 0,
          over1week: 0
        }
      }
    },
    byProgram: {}
  };

  // Calculate response times and distributions
  let totalResponseTime = 0;
  let totalResponses = 0;

  surveys.forEach(survey => {
    survey.responses.forEach(response => {
      const responseTime = new Date(response.submittedAt) - new Date(survey.createdAt);
      totalResponseTime += responseTime;
      totalResponses++;

      // Categorize response time
      const hoursToRespond = responseTime / (1000 * 60 * 60);
      if (hoursToRespond <= 24) {
        metrics.overall.responseTimeAnalysis.responseTimeDistribution.within24h++;
      } else if (hoursToRespond <= 48) {
        metrics.overall.responseTimeAnalysis.responseTimeDistribution.within48h++;
      } else if (hoursToRespond <= 168) { // 1 week
        metrics.overall.responseTimeAnalysis.responseTimeDistribution.within1week++;
      } else {
        metrics.overall.responseTimeAnalysis.responseTimeDistribution.over1week++;
      }
    });
  });

  metrics.overall.responseTimeAnalysis.averageResponseTime = 
    totalResponses > 0 ? totalResponseTime / totalResponses : 0;

  return metrics;
};

// Create survey template
const createSurveyTemplate = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, type, questions, targetRole = 'all', targetProgram = 'all' } = req.body;

    // Create the survey template
    const survey = await Survey.create({
      title,
      description,
      type,
      targetRole,
      targetProgram,
      createdBy: req.user.id,
      status: 'draft',
      isTemplate: true
    }, { transaction });

    // Create questions for the template
    const surveyQuestions = await Promise.all(
      questions.map(async (q, index) => {
        return await SurveyQuestion.create({
          surveyId: survey.id,
          question: q.question,
          type: q.type,
          required: q.required,
          options: q.options ? JSON.stringify(q.options) : null,
          questionOrder: index + 1
        }, { transaction });
      })
    );

    await transaction.commit();

    // Return the created template with questions
    res.status(201).json({
      template: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        targetRole: survey.targetRole,
        targetProgram: survey.targetProgram,
        createdBy: survey.createdBy,
        status: survey.status,
        questions: surveyQuestions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          required: q.required,
          options: q.options ? JSON.parse(q.options) : null,
          order: q.questionOrder
        }))
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error creating survey template:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
};

// Schedule survey distribution
const scheduleSurvey = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      surveyId, 
      scheduleType, 
      targetDate,
      targetDepartments,
      targetPrograms
    } = req.body;

    // Verify survey exists
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      await transaction.rollback();
      return res.status(404).json({ message: "Survey not found" });
    }

    // Validate dates
    const startDate = new Date(targetDate);
    if (startDate < new Date()) {
      await transaction.rollback();
      return res.status(400).json({ message: "Target date must be in the future" });
    }

    // Create target audience JSON
    const targetAudience = JSON.stringify({
      departments: targetDepartments || [],
      programs: targetPrograms || []
    });

    // Create schedule
    const schedule = await SurveySchedule.create({
      surveyId,
      scheduleType,
      startDate,
      targetAudience,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: "Survey scheduled successfully",
      schedule: {
        id: schedule.id,
        surveyId: schedule.surveyId,
        scheduleType: schedule.scheduleType,
        startDate: schedule.startDate,
        targetAudience: JSON.parse(schedule.targetAudience)
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error scheduling survey:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
};

// Monitor survey participation
const monitorSurveyParticipation = async (req, res) => {
  try {
    const { startDate, endDate, department, programType } = req.query;

    // Build base query for surveys
    let surveyQuery = {
      status: 'active'
    };

    // Add date filters if provided
    if (startDate && endDate) {
      surveyQuery.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get surveys with responses and questions
    const surveys = await Survey.findAll({
      where: surveyQuery,
      include: [
        {
          model: SurveyResponse,
          as: 'responses',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'department', 'programType', 'role'],
              where: {
                ...(department && { department }),
                ...(programType && { programType })
              },
              required: false
            }
          ]
        },
        {
          model: SurveyQuestion,
          as: 'SurveyQuestions'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        },
        {
          model: SurveySchedule,
          as: 'schedules',
          where: {
            startDate: {
              [Op.lte]: new Date()
            }
          },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate participation metrics
    const monitoringData = surveys.map(survey => {
      const totalResponses = survey.responses.length;
      const uniqueRespondents = new Set(survey.responses.map(r => r.userId)).size;
      
      // Filter responses by department/program if specified
      const filteredResponses = survey.responses.filter(response => {
        if (!response.user) return false;
        if (department && response.user.department !== department) return false;
        if (programType && response.user.programType !== programType) return false;
        return true;
      });

      // Safely parse schedule target audiences
      const schedules = survey.schedules.map(schedule => {
        let parsedTargetAudience = null;
        if (schedule.targetAudience) {
          try {
            // Handle both string and object cases
            parsedTargetAudience = typeof schedule.targetAudience === 'string' 
              ? JSON.parse(schedule.targetAudience)
              : schedule.targetAudience;
          } catch (e) {
            console.warn(`Failed to parse targetAudience for schedule ${schedule.id}:`, e);
            parsedTargetAudience = null;
          }
        }

        return {
          id: schedule.id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          scheduleType: schedule.scheduleType,
          frequency: schedule.frequency,
          targetAudience: parsedTargetAudience
        };
      });

      return {
        surveyId: survey.id,
        title: survey.title,
        type: survey.type,
        status: survey.status,
        createdBy: survey.creator ? {
          id: survey.creator.id,
          name: survey.creator.name,
          role: survey.creator.role
        } : null,
        metrics: {
          totalQuestions: survey.SurveyQuestions.length,
          totalResponses,
          uniqueRespondents,
          completionRate: filteredResponses.length > 0 ? 
            (filteredResponses.length / totalResponses) * 100 : 0,
          averageResponseTime: calculateAverageResponseTime(filteredResponses),
          responseDistribution: calculateMonitoringResponseDistribution(filteredResponses)
        },
        schedules,
        lastResponse: filteredResponses.length > 0 ? 
          new Date(Math.max(...filteredResponses.map(r => new Date(r.submittedAt)))) : null
      };
    });

    res.json({
      filters: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        department: department || 'all',
        programType: programType || 'all'
      },
      totalSurveys: surveys.length,
      surveys: monitoringData
    });

  } catch (error) {
    console.error("Error monitoring survey participation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to calculate average response time
const calculateAverageResponseTime = (responses) => {
  if (responses.length === 0) return 0;
  
  const responseTimes = responses.map(response => {
    const submittedAt = new Date(response.submittedAt);
    const createdAt = new Date(response.createdAt);
    return submittedAt - createdAt;
  });

  return Math.floor(
    responseTimes.reduce((sum, time) => sum + time, 0) / responses.length
  );
};

// Helper function to calculate response distribution for monitoring
const calculateMonitoringResponseDistribution = (responses) => {
  const distribution = {
    byTime: {
      morning: 0,    // 6-12
      afternoon: 0,  // 12-17
      evening: 0,    // 17-22
      night: 0       // 22-6
    },
    byDay: {}
  };

  responses.forEach(response => {
    const submitTime = new Date(response.submittedAt);
    const hour = submitTime.getHours();
    const day = submitTime.toLocaleDateString('en-US', { weekday: 'long' });

    // Time distribution
    if (hour >= 6 && hour < 12) distribution.byTime.morning++;
    else if (hour >= 12 && hour < 17) distribution.byTime.afternoon++;
    else if (hour >= 17 && hour < 22) distribution.byTime.evening++;
    else distribution.byTime.night++;

    // Day distribution
    distribution.byDay[day] = (distribution.byDay[day] || 0) + 1;
  });

  return distribution;
};

// Export survey results
const exportSurveyResults = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department, 
      programType,
      surveyType,
      format = 'json' // 'json', 'csv', 'excel', or 'pdf'
    } = req.query;

    // Build base query
    let surveyQuery = {};
    
    // Add filters
    if (surveyType) {
      surveyQuery.type = surveyType;
    }
    if (startDate && endDate) {
      surveyQuery.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get surveys with responses and related data
    const surveys = await Survey.findAll({
      where: surveyQuery,
      include: [
        {
          model: SurveyResponse,
          as: 'responses',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'department', 'programType', 'role'],
              where: {
                ...(department && { department }),
                ...(programType && { programType })
              },
              required: false
            },
            {
              model: SurveyQuestionResponse,
              as: 'questionResponses',
              include: [{
                model: SurveyQuestion,
                as: 'question',
                attributes: ['question', 'type']
              }]
            }
          ]
        },
        {
          model: SurveyQuestion,
          as: 'SurveyQuestions',
          attributes: ['id', 'question', 'type', 'required']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Prepare data in a format suitable for all export types
    const headers = ['Survey ID', 'Survey Title', 'Respondent ID', 'Respondent Name', 
      'Department', 'Program Type', 'Submission Date'];
    
    // Get all unique questions across all surveys
    const allQuestions = new Set();
    surveys.forEach(survey => {
      survey.SurveyQuestions.forEach(q => {
        allQuestions.add(q.question);
      });
    });
    
    headers.push(...Array.from(allQuestions));

    // Prepare rows data
    const rows = [];
    surveys.forEach(survey => {
      survey.responses.forEach(response => {
        if (!response.user) return;
        
        const row = [
          survey.id,
          survey.title,
          response.user.id,
          response.user.name,
          response.user.department,
          response.user.programType,
          response.submittedAt
        ];

        // Add answers for each question
        Array.from(allQuestions).forEach(question => {
          const answer = response.questionResponses.find(qr => 
            qr.question.question === question
          );
          row.push(answer ? (answer.answer || answer.ratingValue || answer.selectedOption || '') : '');
        });

        rows.push(row);
      });
    });

    switch (format.toLowerCase()) {
      case 'csv': {
        const csvRows = [headers.join(',')];
        rows.forEach(row => {
          csvRows.push(row.join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=survey_results.csv');
        return res.send(csvRows.join('\n'));
      }

      case 'excel': {
        try {
          // Create workbook and worksheet
          const wb = XLSX.utils.book_new();
          
          // Prepare data for Excel
          const excelData = [];
          
          // Add headers
          excelData.push([
            'Survey ID',
            'Survey Title',
            'Survey Type',
            'Respondent ID',
            'Respondent Name',
            'Department',
            'Program Type',
            'Submission Date',
            ...Array.from(allQuestions)
          ]);

          // Add data rows
          surveys.forEach(survey => {
            survey.responses.forEach(response => {
              if (!response.user) return;

              const row = [
                survey.id || '',
                survey.title || '',
                survey.type || '',
                response.user.id || '',
                response.user.name || '',
                response.user.department || '',
                response.user.programType || '',
                response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''
              ];

              // Add answers for each question
              Array.from(allQuestions).forEach(question => {
                const questionResponse = response.questionResponses.find(qr => 
                  qr.question.question === question
                );
                
                let answer = '';
                if (questionResponse) {
                  if (questionResponse.answer) answer = questionResponse.answer;
                  else if (questionResponse.ratingValue) answer = questionResponse.ratingValue.toString();
                  else if (questionResponse.selectedOption) answer = questionResponse.selectedOption;
                }
                row.push(answer);
              });

              excelData.push(row);
            });
          });

          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(excelData);

          // Set column widths
          const colWidths = [
            { wch: 36 },  // Survey ID
            { wch: 30 },  // Survey Title
            { wch: 15 },  // Survey Type
            { wch: 36 },  // Respondent ID
            { wch: 25 },  // Respondent Name
            { wch: 20 },  // Department
            { wch: 15 },  // Program Type
            { wch: 20 },  // Submission Date
          ];
          
          // Add standard width for question columns
          Array.from(allQuestions).forEach(() => {
            colWidths.push({ wch: 30 });
          });

          ws['!cols'] = colWidths;

          // Add the worksheet to workbook
          XLSX.utils.book_append_sheet(wb, ws, 'Survey Results');

          // Create a buffer
          const excelBuffer = XLSX.write(wb, { 
            type: 'buffer', 
            bookType: 'xlsx',
            bookSST: false
          });

          // Set headers and send response
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=survey_results.xlsx');
          return res.send(excelBuffer);

        } catch (error) {
          console.error("Error generating Excel file:", error);
          if (!res.headersSent) {
            return res.status(500).json({ message: "Error generating Excel file" });
          }
        }
        return;
      }

      case 'pdf': {
        try {
          const doc = new PDFDocument({ margin: 50 });
          
          // Set response headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=survey_results.pdf');
          
          // Pipe the PDF document to the response
          doc.pipe(res);

          // Add title
          doc.fontSize(20).text('Survey Results Report', { align: 'center' });
          doc.moveDown(2);

          // Add filters information
          doc.fontSize(14).text('Filters', { underline: true });
          doc.fontSize(12)
            .text(`Department: ${department || 'All'}`)
            .text(`Program Type: ${programType || 'All'}`)
            .text(`Survey Type: ${surveyType || 'All'}`)
            .text(`Date Range: ${startDate ? `${startDate} to ${endDate}` : 'All'}`);
          doc.moveDown(2);

          // Process each survey
          surveys.forEach((survey, index) => {
            // Add page break if not the first survey
            if (index > 0) {
              doc.addPage();
            }

            // Survey header
            doc.fontSize(16).text(survey.title || 'Untitled Survey', { underline: true });
            doc.fontSize(12)
              .text(`Survey ID: ${survey.id}`)
              .text(`Type: ${survey.type}`)
              .text(`Created by: ${survey.creator ? survey.creator.name : 'Unknown'}`)
              .text(`Total Responses: ${survey.responses.length}`);
            doc.moveDown();

            // If there are responses, create a response summary table
            if (survey.responses.length > 0) {
              // Table headers
              const startX = 50;
              let currentY = doc.y;
              const rowHeight = 20;
              const columnWidths = [150, 150, 150]; // Adjust these widths based on your needs

              // Draw table headers
              doc.fontSize(12);
              ['Respondent', 'Department', 'Submission Date'].forEach((header, i) => {
                doc.text(
                  header,
                  startX + (i * columnWidths[i]),
                  currentY,
                  { width: columnWidths[i], align: 'left' }
                );
              });

              currentY += rowHeight;

              // Draw response rows
              survey.responses.forEach(response => {
                // Check if we need a new page
                if (currentY > doc.page.height - 100) {
                  doc.addPage();
                  currentY = 50;
                }

                if (response.user) {
                  const rowData = [
                    response.user.name || 'Unknown',
                    response.user.department || 'Unknown',
                    new Date(response.submittedAt).toLocaleDateString()
                  ];

                  rowData.forEach((cell, i) => {
                    doc.text(
                      cell,
                      startX + (i * columnWidths[i]),
                      currentY,
                      { width: columnWidths[i], align: 'left' }
                    );
                  });

                  currentY += rowHeight;
                }
              });

              doc.moveDown(2);

              // Add question summary if there are questions
              if (survey.SurveyQuestions && survey.SurveyQuestions.length > 0) {
                doc.fontSize(14).text('Questions Summary', { underline: true });
                doc.moveDown();

                survey.SurveyQuestions.forEach((question, qIndex) => {
                  doc.fontSize(12).text(`${qIndex + 1}. ${question.question}`);
                  doc.fontSize(10).text(`Type: ${question.type}`);
                  doc.moveDown();
                });
              }
            } else {
              doc.fontSize(12).text('No responses recorded for this survey.');
            }
          });

          // Finalize the PDF
          doc.end();
        } catch (error) {
          console.error('Error generating PDF:', error);
          // Send error response without ending the stream
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF' });
          }
        }
        return; // Important: return here to prevent further response attempts
      }

      case 'json':
      default: {
        // Format data for JSON response
        const exportData = surveys.map(survey => {
          const responses = survey.responses.filter(response => {
            if (!response.user) return false;
            if (department && response.user.department !== department) return false;
            if (programType && response.user.programType !== programType) return false;
            return true;
          });

          const formattedResponses = responses.map(response => {
            const answers = {};
            response.questionResponses.forEach(qr => {
              answers[qr.question.question] = {
                type: qr.question.type,
                answer: qr.answer || qr.ratingValue || qr.selectedOption
              };
            });

            return {
              respondentId: response.user.id,
              respondentName: response.user.name,
              department: response.user.department,
              programType: response.user.programType,
              submittedAt: response.submittedAt,
              answers
            };
          });

          return {
            surveyId: survey.id,
            title: survey.title,
            type: survey.type,
            status: survey.status,
            createdBy: survey.creator ? {
              id: survey.creator.id,
              name: survey.creator.name,
              role: survey.creator.role
            } : null,
            createdAt: survey.createdAt,
            questions: survey.SurveyQuestions.map(q => ({
              id: q.id,
              question: q.question,
              type: q.type,
              required: q.required
            })),
            responses: formattedResponses
          };
        });

        return res.json({
          filters: {
            startDate: startDate || 'all',
            endDate: endDate || 'all',
            department: department || 'all',
            programType: programType || 'all',
            surveyType: surveyType || 'all'
          },
          totalSurveys: surveys.length,
          data: exportData
        });
      }
    }

  } catch (error) {
    console.error("Error exporting survey results:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update survey template
const updateSurveyTemplate = async (req, res) => {
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the template
    const template = await Survey.findOne({
      where: {
        id: req.params.templateId,
        isTemplate: true
      },
      include: [
        {
          model: SurveyQuestion,
          as: 'SurveyQuestions'
        }
      ],
      transaction
    });

    if (!template) {
      await transaction.rollback();
      return res.status(404).json({ message: "Survey template not found" });
    }

    // Update template
    const {
      title,
      description,
      type,
      targetRole,
      targetProgram,
      status,
      questions
    } = req.body;

    await template.update({
      title: title || template.title,
      description: description || template.description,
      type: type || template.type,
      targetRole: targetRole || template.targetRole,
      targetProgram: targetProgram || template.targetProgram,
      status: status || template.status,
      updatedAt: new Date()
    }, { transaction });

    // Get existing question IDs
    const existingQuestionIds = template.SurveyQuestions.map(q => q.id);
    const updatedQuestionIds = questions.filter(q => q.id).map(q => q.id);
    
    // Find questions to delete (existing but not in update)
    const questionsToDelete = existingQuestionIds.filter(id => !updatedQuestionIds.includes(id));
    
    // Delete removed questions
    if (questionsToDelete.length > 0) {
      await SurveyQuestion.destroy({
        where: {
          id: { [Op.in]: questionsToDelete },
          surveyId: template.id
        },
        transaction
      });
    }

    // Update or create questions
    for (const questionData of questions) {
      const {
        id,
        question,
        type,
        required,
        options,
        questionOrder
      } = questionData;

      if (id) {
        // Update existing question
        await SurveyQuestion.update(
          {
            question,
            type,
            required,
            options: options ? JSON.stringify(options) : null,
            questionOrder,
            updatedAt: new Date()
          },
          {
            where: { id, surveyId: template.id },
            transaction
          }
        );
      } else {
        // Create new question
        await SurveyQuestion.create(
          {
            id: require('uuid').v4(),
            surveyId: template.id,
            question,
            type,
            required,
            options: options ? JSON.stringify(options) : null,
            questionOrder,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { transaction }
        );
      }
    }

    // Fetch updated template with questions
    const updatedTemplate = await Survey.findOne({
      where: { id: template.id },
      include: [
        {
          model: SurveyQuestion,
          as: 'SurveyQuestions',
          order: [['questionOrder', 'ASC']]
        }
      ],
      transaction
    });

    await transaction.commit();

    res.json(updatedTemplate);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating survey template:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Update survey settings
const updateSurveySettings = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      defaultAnonymous,
      allowComments,
      requireEvidence,
      autoReminders,
      reminderFrequency,
      responseDeadlineDays
    } = req.body;

    // Get the first settings record or create if doesn't exist
    let settings = await SurveySettings.findOne({ transaction });
    
    if (!settings) {
      settings = await SurveySettings.create({
        defaultAnonymous: false,
        allowComments: true,
        requireEvidence: false,
        autoReminders: true,
        reminderFrequency: 7,
        responseDeadlineDays: 14,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });
    }

    // Update settings
    await settings.update({
      defaultAnonymous: defaultAnonymous !== undefined ? defaultAnonymous : settings.defaultAnonymous,
      allowComments: allowComments !== undefined ? allowComments : settings.allowComments,
      requireEvidence: requireEvidence !== undefined ? requireEvidence : settings.requireEvidence,
      autoReminders: autoReminders !== undefined ? autoReminders : settings.autoReminders,
      reminderFrequency: reminderFrequency || settings.reminderFrequency,
      responseDeadlineDays: responseDeadlineDays || settings.responseDeadlineDays,
      updatedAt: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      message: "Survey settings updated successfully",
      settings: settings
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error updating survey settings:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

module.exports = {
  getAllSurveys,
  getUserSurveys,
  getAvailableSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitResponse,
  getSurveyResponses,
  getSurveyHistory,
  getTeamSurveyResults,
  getTeamSurveyCompletionStatus,
  getDepartmentAnalytics,
  getDepartmentInsights,
  createSurveyTemplate,
  scheduleSurvey,
  monitorSurveyParticipation,
  exportSurveyResults,
  updateSurveyTemplate,
  updateSurveySettings
};
