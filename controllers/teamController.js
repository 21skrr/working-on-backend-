const { Team, User } = require("../models");
const { Op } = require("sequelize");

// @desc    Get team members
// @route   GET /api/team
// @access  Private
const getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findOne({
      where: { id: req.user.teamId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get team by ID
// @route   GET /api/team/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create new team
// @route   POST /api/team
// @access  Private (HR/Admin)
const createTeam = async (req, res) => {
  try {
    const { name, description, department } = req.body;

    const team = await Team.create({
      name,
      description,
      department,
      createdBy: req.user.id,
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update team
// @route   PUT /api/team/:id
// @access  Private (HR/Admin)
const updateTeam = async (req, res) => {
  try {
    const { name, description, department } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await team.update({
      name: name || team.name,
      description: description || team.description,
      department: department || team.department,
    });

    res.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete team
// @route   DELETE /api/team/:id
// @access  Private (Admin)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if team has members
    const memberCount = await User.count({ where: { teamId: team.id } });
    if (memberCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete team with active members. Reassign members first.",
      });
    }

    await team.destroy();
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTeamMembers,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
