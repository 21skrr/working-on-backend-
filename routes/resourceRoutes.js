const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { auth, checkRole } = require("../middleware/auth");

// GET /api/resources - List all accessible resources
router.get(
  "/",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"),
  resourceController.getAllResources
);

// Define specific routes BEFORE the general /:id route

// GET /api/resources/usage - Get resources relevant to a specific employee
router.get(
  "/usage",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"), // Assuming these roles can view resources based on employee usage
  resourceController.getEmployeeResources
);

// GET /api/resources/summary - View usage summary across teams or departments
router.get(
  "/summary",
  auth,
  checkRole("manager", "hr"), // Accessible to managers and HR
  resourceController.getResourceSummary
);

// GET /api/resources/recommendations - View recommended resources by role or performance data
router.get(
  "/recommendations",
  auth,
  checkRole("manager", "hr", "employee", "supervisor"), // Accessible to roles who might need recommendations
  resourceController.getResourceRecommendations
);

// POST /api/resources/assign - Assign resources to employees
router.post(
  "/assign",
  auth,
  checkRole("supervisor", "hr", "manager"), // Assuming only these roles can assign resources
  resourceController.assignResources
);

// HR Endpoints

// POST /api/resources - Create a new resource
router.post(
  "/",
  auth,
  checkRole("hr", "manager"), // Assuming HR and Manager can create resources
  resourceController.createResource
);

// PUT /api/resources/:id - Update resource metadata
router.put(
  "/:id",
  auth,
  checkRole("hr", "manager"), // Assuming HR and Manager can update resources
  resourceController.updateResource
);

// DELETE /api/resources/:id - Delete a resource
router.delete(
  "/:id",
  auth,
  checkRole("hr", "manager"), // Assuming HR and Manager can delete resources
  resourceController.deleteResource
);

// GET /api/resources/analytics - Get global resource access analytics
router.get(
  "/analytics",
  auth,
  checkRole("hr", "manager"), // Assuming HR and Manager can view analytics
  resourceController.getResourceAnalytics
);

// Now define the general /:id route AFTER all the specific named routes

// GET /api/resources/:id - View specific resource details
router.get(
  "/:id",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"),
  resourceController.getResourceById
);

// GET /api/resources/:id/download - Track and initiate resource download
router.post(
  "/:id/download",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"),
  resourceController.trackResourceDownload
);

// POST /api/resources/:id/complete - Log resource completion
router.post(
  "/:id/complete",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"), // Assuming any user can mark a resource as complete
  resourceController.completeResource
);

// POST /api/resources/:id/start-viewing - Log resource viewing start
router.post(
  "/:id/start-viewing",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"), // Assuming any user can log viewing start
  resourceController.startResourceViewing
);

// POST /api/resources/:id/stop-viewing - Log resource viewing stop
router.post(
  "/:id/stop-viewing",
  auth,
  checkRole("employee", "supervisor", "hr", "manager"), // Assuming any user can log viewing stop
  resourceController.stopResourceViewing
);

module.exports = router; 