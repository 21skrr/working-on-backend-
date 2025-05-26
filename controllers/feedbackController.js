const { Feedback, User, FeedbackNote, FeedbackFollowup, FeedbackFollowupParticipant } = require("../models");
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get sent feedback
const getSentFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { fromUserId: req.user.id },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching sent feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get received feedback
const getReceivedFeedback = async (req, res) => {
  try {
    // HR sees all feedback, others see only their own
    const whereClause =
      req.user.role === "hr"
        ? {} // all feedback
        : { toUserId: req.user.id };

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching received feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get department feedback
const getDepartmentFeedback = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    // Get user's department if they're a manager
    let userDepartment;
    if (req.user.role === 'manager') {
      const user = await User.findByPk(req.user.id);
      userDepartment = user.department;
    }

    // Build base where clause
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add type filter if category is provided
    if (category) {
      whereClause.type = category;
    }

    // Build receiver where clause based on role
    const receiverWhere = {};
    if (req.user.role === 'manager') {
      receiverWhere.department = userDepartment;
    }

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          where: receiverWhere,
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response
    const formattedFeedback = feedback.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error fetching department feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create feedback
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, content, isAnonymous, shareWithSupervisor } = req.body;

    // Get the user's supervisor if shareWithSupervisor is true
    let toUserId = null;
    let toDepartment = null;
    
    if (shareWithSupervisor) {
      const user = await User.findByPk(req.user.id, {
        attributes: ['supervisorId']
      });
      toUserId = user.supervisorId;
    } else {
      // If not sharing with supervisor, send to department
      const user = await User.findByPk(req.user.id, {
        attributes: ['department']
      });
      toDepartment = user.department;
    }

    const feedback = await Feedback.create({
      fromUserId: req.user.id,
      toUserId,
      toDepartment,
      type,
      message: content,
      isAnonymous: isAnonymous ? 1 : 0
    });

    // Include user information in response
    const feedbackWithUser = await Feedback.findByPk(feedback.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'department']
        }
      ]
    });

    res.status(201).json(feedbackWithUser);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only allow sender to delete their feedback
    if (feedback.fromUserId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await feedback.destroy();
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export feedback
const exportFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { format = 'csv', dateRange = 'monthly', category = 'all' } = req.query;

    // Build date filter
    const dateFilter = {};
    const now = new Date();
    switch (dateRange) {
      case 'daily':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'weekly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'monthly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setMonth(now.getMonth() - 1))
        };
        break;
      case 'yearly':
        dateFilter.createdAt = {
          [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1))
        };
        break;
    }

    // Build category filter
    const categoryFilter = category !== 'all' ? { type: category } : {};

    // Fetch feedback with filters
    const feedbacks = await Feedback.findAll({
      where: {
        ...dateFilter,
        ...categoryFilter
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the data
    const formattedData = feedbacks.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        id: f.id,
        type: f.type,
        message: f.message,
        sender: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver: plainFeedback.receiver?.name,
        receiver_department: plainFeedback.receiver?.department,
        status: f.status,
        priority: f.priority,
        categories: f.categories,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        created_at: f.createdAt,
        updated_at: f.updatedAt
      };
    });

    const filename = `feedback_report_${dateRange}_${category}_${new Date().toISOString().split('T')[0]}`;

    // Export based on format
    switch (format) {
      case 'csv': {
        const fields = Object.keys(formattedData[0] || {});
        const parser = new Parser({ fields });
        const csv = parser.parse(formattedData);
        
        res.header('Content-Type', 'text/csv');
        res.attachment(`${filename}.csv`);
        return res.send(csv);
      }

      case 'excel': {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Feedback Report');
        
        // Add headers
        const headers = Object.keys(formattedData[0] || {});
        worksheet.addRow(headers);
        
        // Add data
        formattedData.forEach(feedback => {
          worksheet.addRow(Object.values(feedback));
        });
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`${filename}.xlsx`);
        return workbook.xlsx.write(res);
      }

      case 'pdf': {
        const doc = new PDFDocument();
        
        res.header('Content-Type', 'application/pdf');
        res.attachment(`${filename}.pdf`);
        
        doc.pipe(res);
        
        // Add title
        doc.fontSize(16).text('Feedback Report', { align: 'center' });
        doc.moveDown();
        
        // Add filters info
        doc.fontSize(12).text(`Date Range: ${dateRange}`);
        doc.text(`Category: ${category}`);
        doc.moveDown();
        
        // Add table headers
        const headers = Object.keys(formattedData[0] || {});
        let yPosition = doc.y;
        
        // Add data rows
        formattedData.forEach((feedback, index) => {
          if (doc.y > 700) { // Check if near page end
            doc.addPage();
            yPosition = doc.y;
          }
          
          doc.fontSize(10).text(
            Object.values(feedback).join(' | '),
            { width: 500 }
          );
          doc.moveDown(0.5);
        });
        
        doc.end();
        return;
      }

      default: {
        // JSON format
        return res.json(formattedData);
      }
    }
  } catch (error) {
    console.error("Error exporting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback for a specific user (as receiver)
const getFeedbackByUserId = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { toUserId: req.params.userId },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback by userId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback history (both sent and received)
const getFeedbackHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get both sent and received feedback
    const feedback = await Feedback.findAndCountAll({
      where: {
        [Op.or]: [
          { fromUserId: req.user.id },
          { toUserId: req.user.id }
        ],
        ...dateFilter
      },
      include: [
        { 
          model: User, 
          as: "sender",
          attributes: ['id', 'name', 'email', 'department'] 
        },
        { 
          model: User, 
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      feedback: feedback.rows,
      total: feedback.count,
      currentPage: page,
      totalPages: Math.ceil(feedback.count / limit)
    });
  } catch (error) {
    console.error("Error fetching feedback history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add notes to feedback
const addFeedbackNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { notes, followUpDate, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create feedback note
    const feedbackNote = await FeedbackNote.create({
      feedbackId,
      supervisorId: req.user.id,
      note: notes,
      followUpDate: followUpDate || null,
      status: status || 'pending'
    });

    // Include user information in response
    const noteWithUser = await FeedbackNote.findByPk(feedbackNote.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role'],
        foreignKey: 'supervisorId'
      }]
    });

    res.status(201).json(noteWithUser);
  } catch (error) {
    console.error("Error adding feedback notes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add follow-up to feedback
const addFeedbackFollowup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { scheduledDate, participants, notes } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create the follow-up
    const followup = await FeedbackFollowup.create({
      feedbackId,
      scheduledDate,
      notes,
      createdBy: req.user.id,
      status: "scheduled"
    });

    // Add participants
    await Promise.all(
      participants.map(userId =>
        FeedbackFollowupParticipant.create({
          followupId: followup.id,
          userId
        })
      )
    );

    // Fetch the complete follow-up with participants
    const followupWithDetails = await FeedbackFollowup.findByPk(followup.id, {
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "name", "email", "role"],
          through: { attributes: [] }
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"]
        }
      ]
    });

    res.status(201).json(followupWithDetails);
  } catch (error) {
    console.error("Error adding feedback follow-up:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Department Feedback Analytics
const getDepartmentFeedbackAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let department;

    // Get department based on user role
    if (req.user.role === 'manager') {
      const user = await User.findByPk(req.user.id);
      department = user.department;
    } else if (req.user.role === 'hr') {
      department = req.query.department;
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required for HR users" });
    }

    // Find all users in the department
    const users = await User.findAll({
      where: { department },
      attributes: ["id", "name", "email"]
    });
    const userIds = users.map(u => u.id);

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get feedback for users in department (sent or received)
    const feedbacks = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: { [Op.in]: userIds } },
          { toUserId: { [Op.in]: userIds } },
          { toDepartment: department }
        ],
        ...dateFilter
      },
      include: [
        { model: User, as: "sender", attributes: ["id", "name", "email", "department"] },
        { model: User, as: "receiver", attributes: ["id", "name", "email", "department"] },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Analytics: count by type
    const byType = {};
    feedbacks.forEach(fb => {
      byType[fb.type] = (byType[fb.type] || 0) + 1;
    });

    // Analytics: trend by date
    const trend = {};
    feedbacks.forEach(fb => {
      const date = fb.createdAt.toISOString().slice(0, 10);
      trend[date] = (trend[date] || 0) + 1;
    });

    // Format the response
    const formattedFeedbacks = feedbacks.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json({
      department,
      total: feedbacks.length,
      byType,
      trend,
      feedbacks: formattedFeedbacks
    });
  } catch (error) {
    console.error("Error fetching department feedback analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Respond to feedback
const respondToFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { response, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create feedback note with the response
    const feedbackNote = await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: response,
      status
    });

    // Update feedback status to match the note status
    await feedback.update({ status });

    // Include user information in response
    const noteWithUser = await FeedbackNote.findByPk(feedbackNote.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.json(noteWithUser);
  } catch (error) {
    console.error("Error responding to feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all feedback (HR only)
const getAllFeedback = async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    // Build where clause
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add type filter if provided
    if (type) {
      whereClause.type = type;
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response
    const formattedFeedback = feedback.map(f => {
      const plainFeedback = f.get({ plain: true });
      return {
        ...plainFeedback,
        sender_name: f.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
        sender_email: f.isAnonymous ? null : plainFeedback.sender?.email,
        sender_department: f.isAnonymous ? null : plainFeedback.sender?.department,
        receiver_name: plainFeedback.receiver?.name,
        receiver_email: plainFeedback.receiver?.email,
        receiver_department: plainFeedback.receiver?.department,
        latest_response: plainFeedback.notes?.[0]?.note,
        response_status: plainFeedback.notes?.[0]?.status,
        response_date: plainFeedback.notes?.[0]?.created_at,
        responder_name: plainFeedback.notes?.[0]?.supervisor?.name
      };
    });

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Categorize feedback
const categorizeFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { categories, priority, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Update feedback with new categories and status
    await feedback.update({
      categories: JSON.stringify(categories),
      priority,
      status
    });

    // Create a note about the categorization
    await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: `Feedback categorized as [${categories.join(", ")}] with ${priority} priority`,
      status
    });

    // Get updated feedback with latest note
    const updatedFeedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender", attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: "receiver", attributes: ['id', 'name', 'email', 'department'] },
        {
          model: FeedbackNote,
          as: "notes",
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'supervisor',
            attributes: ['id', 'name', 'role']
          }]
        }
      ]
    });

    // Format the response
    const plainFeedback = updatedFeedback.get({ plain: true });
    const formattedFeedback = {
      ...plainFeedback,
      categories: JSON.parse(plainFeedback.categories || '[]'),
      sender_name: updatedFeedback.isAnonymous ? 'Anonymous' : plainFeedback.sender?.name,
      sender_email: updatedFeedback.isAnonymous ? null : plainFeedback.sender?.email,
      sender_department: updatedFeedback.isAnonymous ? null : plainFeedback.sender?.department,
      receiver_name: plainFeedback.receiver?.name,
      receiver_email: plainFeedback.receiver?.email,
      receiver_department: plainFeedback.receiver?.department,
      latest_response: plainFeedback.notes?.[0]?.note,
      response_status: plainFeedback.notes?.[0]?.status,
      response_date: plainFeedback.notes?.[0]?.created_at,
      responder_name: plainFeedback.notes?.[0]?.supervisor?.name
    };

    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error categorizing feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Escalate feedback
const escalateFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { escalateTo, reason, notifyParties } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId, {
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create a note about the escalation
    const note = await FeedbackNote.create({
      id: uuidv4(),
      feedbackId,
      supervisorId: req.user.id,
      note: `Escalated to ${escalateTo}. Reason: ${reason}`,
      status: "in-progress"
    });

    // Update feedback status
    await feedback.update({
      status: "in_progress"
    });

    // Get the note with supervisor details
    const noteWithDetails = await FeedbackNote.findByPk(note.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.json({
      message: "Feedback escalated successfully",
      feedback,
      escalation: {
        escalateTo,
        reason,
        notifyParties,
        note: noteWithDetails
      }
    });
  } catch (error) {
    console.error("Error escalating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSentFeedback,
  getReceivedFeedback,
  getDepartmentFeedback,
  createFeedback,
  deleteFeedback,
  exportFeedback,
  getFeedbackByUserId,
  getFeedbackHistory,
  addFeedbackNotes,
  addFeedbackFollowup,
  getDepartmentFeedbackAnalytics,
  respondToFeedback,
  getAllFeedback,
  categorizeFeedback,
  escalateFeedback
};
