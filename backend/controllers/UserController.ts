import UserService from "../services/UserService";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { UserType } from "../types/entities";
import { Queue, QueueEvents } from "bullmq";
import { config } from "../config/redisConfig";

const UserController: Controller = {
  getUserById: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const user = await UserService.getUserById(userId);
      return h.response(user).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getAllUsers: async (req: Request, h: ResponseToolkit) => {
    try {
      const users = await UserService.getAllUsers(req.payload as any);
      return h.response(users).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  // Single user creation (without Redis)
  createSingleUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const data = req.payload as any;
      if (!data) throw new Error("User data is required!");

      const requiredFields: string[] = [
        'name', 'userId', 'email', 'role',
        'position', 'team', 'subTeam', 'lead', 'hr', 'isActive'
      ];

      // Validate required fields
      requiredFields.forEach((field) => {
        if (!data[field] && data[field] !== false) {
          throw new Error(`Field '${field}' is required`);
        }
      });

      // Create single user without Redis
      await UserService.createUser(data);

      return h.response({
        message: "User created successfully!",
        success: true
      }).code(201);

    } catch (err: any) {
      console.log("Single User Creation Error:", err.message);
      return h.response({ error: err.message }).code(400);
    }
  },

  // Bulk user creation (with Redis)
  createBulkUsers: async (req: Request, h: ResponseToolkit) => {
    try {
      const data = req.payload as any[];
      if (!data || !data.length) throw new Error("Verify User Data!");

    const requiredFields: string[] = [
      'name', 'userId', 'email', 'role',
      'position', 'team', 'subTeam', 'lead', 'hr', 'isActive'
    ];
    const fields = Object.keys(data[0]);

    fields.forEach((field) => {
      if (!requiredFields.includes(field)) throw new Error("Verify fields and upload again");
    });
    requiredFields.forEach((field) => {
      if (!fields.includes(field)) throw new Error("Verify fields and upload again");
    });

    const split = parseInt(process.env.UPLOAD_LIMIT);
    const queue = new Queue("addUsers", config);
    const queueEvents = new QueueEvents("addUsers", config);
    await queueEvents.waitUntilReady();

    let totalSuccess = 0;
    let totalErrors = 0;
    let allErrors: any[] = [];

    for (let i = 0; i < data.length; i += split) {
      const chunk = data.slice(i, i + split);
      const job = await queue.add("users", { users: chunk });
      const result = await job.waitUntilFinished(queueEvents);

      totalSuccess += result.successcount || 0;
      totalErrors += result.errorCount || 0;
      allErrors.push(...(result.errors || []));
    }

    await queueEvents.close();

    return h.response({
      message: `${totalSuccess} Users Added successfully!`,
      successCount: totalSuccess,
      errorCount: totalErrors,
      errors: allErrors || [],
    }).code(201);

  } catch (err: any) {
    console.log("User Bulk Upload Error:", err.message);
    return h.response({ error: err.message }).code(400);
  }
},

  // Legacy method for backward compatibility - routes to appropriate method
  createUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const data = req.payload as any;
      
      // Check if it's a single user (object) or bulk users (array)
      if (Array.isArray(data)) {
        if (data.length === 1) {
          // Single user sent as array, extract and create without Redis
          const singleUserReq = { ...req, payload: data[0] } as Request;
          return UserController.createSingleUser(singleUserReq, h);
        } else {
          // Multiple users, use bulk upload with Redis
          return UserController.createBulkUsers(req, h);
        }
      } else {
        // Single user object, create without Redis
        return UserController.createSingleUser(req, h);
      }
    } catch (err: any) {
      console.log("User Creation Error:", err.message);
      return h.response({ error: err.message }).code(400);
    }
  },


  updateUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const updated = await UserService.updateUser(req.payload as any);
      return h.response({message: "Updated successfully!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  deleteUser: async (req: Request, h: ResponseToolkit) => {
    try {
      await UserService.deleteUser(req.params.id);
      return h.response({message:"Successfully Deleted user with ID " + req.params.id + "!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getTeamMemebers: async (req: Request, h: ResponseToolkit) => {
    try {
      const teamId = req.params.teamId;
      if (!teamId) {
        return h.response({ error: "Team ID is required" }).code(400);
      }
      const members = await UserService.getTeamMembers(teamId);
      console.log("Fetched members:", members);
      return h.response(members).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getTeamMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getSkillMatrixByTeam(req.params.teamName);
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getFullMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getFullSkillMatrix();
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getRecentAssessmentScore: async(req: Request, h: ResponseToolkit) => {

    try{
      const { userId } = req.query as { userId: number };
      const data = await UserService.getMostRecentApprovedScores(userId);

      if(!data)throw new Error("Failed to Fetch Scores");

      return h.response({ message: "Fetched Previous Assessment Scores" , data }).code(500);
    }
    catch(err){
      return h.response({ error: err.message }).code(500);
    }
  },

  getAllDetails: async (req: Request, h: ResponseToolkit) => {
    try {
      const type = req.query.type as string || "all";
      let data;
      
      switch (type) {
        case "all":
          const positions = await UserService.getAllPositions();
          const roles = await UserService.getAllRoles();
          const teams = await UserService.getAllTeams();
          const subTeams = await UserService.getAllSubTeams();
          return h.response({ positions, roles, teams, subTeams }).code(200);
        case "position":
           data = await UserService.getAllPositions();
          break;
        case "role":
          data = await UserService.getAllRoles();
          break;
        case "team":
          data = await UserService.getAllTeams();
          break;
        case "subteam":
          data = await UserService.getAllSubTeams();
          break;
        default:
          return h.response({ error: "Invalid type parameter" }).code(400);
      }
      return h.response(data).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  // Organization-wide skill stats
  getOrganizationSkillStats: async (req: Request, h: ResponseToolkit) => {
    try {
      const stats = await UserService.getOrganizationSkillLevelStats();
      return h.response(stats).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },
};

export default UserController;