import { AppDataSource } from "../config/dataSource";
import { FindOptionsWhere } from "typeorm";
import { UserData, FilterOptions, ScoreWithSkill, UserWithScores } from "../types/services";
import { 
  userRepo,
  roleRepo,
  positionRepo,
  teamRepo,
  subTeamRepo,
  assessmentRequestRepo,
  scoreRepo,
} from '../config/dataSource';
import { AssessmentStatus } from '../enum/enum';
import { PositionType, RoleType, TeamType, subTeamType, UserType } from "../types/entities";

const UserService = {
  // General user operations
  getUserById: async (id: number | string): Promise<UserType> => {
    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.position", "position")
      .leftJoinAndSelect("user.Team", "team")
      .leftJoinAndSelect("user.subTeam", "subteam")
      .leftJoinAndSelect("user.hr", "hr")
      .leftJoinAndSelect("user.lead", "lead")
      .where("user.id = :id", { id })
      .getOne();

    if (!user) throw new Error("User not found");
    return user;
  },

  getAllUsers: async (filter: FilterOptions = {}): Promise<UserType[]> => {
    const where: FindOptionsWhere<UserType> = {};

    // Handle filtering by related entities
    if (filter.leadId) {
      where.leadId = filter.leadId;
    }
    if (filter.position) {
      const position = await positionRepo.findOneBy({ name: filter.position });
      if (position) where.positionId = position.id;
    }
    if (filter.teamName) {
      const team = await teamRepo.findOneBy({ name: filter.teamName });
      if (team) where.teamId = team.id;
    }
    return await userRepo.find({
      where,
      relations:["role","position","Team","subTeam","lead","hr"],
    })
  },

  // Hr CRUD Operations
  createUser: async (data: UserData): Promise<void> => {
    const id = await AppDataSource.query(`SELECT * FROM users ORDER BY  CAST(id AS INTEGER) DESC LIMIT 1;`);

    await AppDataSource.query(`
    SELECT setval(
      pg_get_serial_sequence('auths', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM auths)
      )`);

    try{
      // Convert foreign key names to IDs
      const roleId = await roleRepo.findOneBy({name: data.role});
      const leadId = await userRepo.findOneBy({userId: data.lead});
      const hrId = await userRepo.findOneBy({userId: data.hr});
      const subTeamId = await subTeamRepo.findOneBy({name: data.subTeam});
      const positionId = await positionRepo.findOneBy({name: data.position});
      const teamId = await teamRepo.findOneBy({name: data.team});

      // Create user data with proper foreign key IDs
      const userData: any = {
        ...data,
        id: (parseInt(id[0].id) + 1).toString(),
        roleId: roleId?.id || null,
        positionId: positionId?.id || null,
        teamId: teamId?.id || null,
        subTeamId: subTeamId?.id || null,
        leadId: leadId?.id || null,
        hrId: hrId?.id || null,
      };

      // Remove the string fields that were converted to IDs
      delete userData.role;
      delete userData.position;
      delete userData.team;
      delete userData.subTeam;
      delete userData.lead;
      delete userData.hr;

      await userRepo.save(userData);
    }
    catch(err){
      console.log("Error in createUser:", err);
      throw err;
    }
  },

  updateUser: async (data: UserData): Promise<UserType> => {

    try{
      const roleId = await roleRepo.findOneBy({name: data.role});
      const leadId = await userRepo.findOneBy({userId: data.lead});
      const hrId = await userRepo.findOneBy({userId: data.hr});
      const subTeamId = await subTeamRepo.findOneBy({name: data.subTeam});
      const positionId = await positionRepo.findOneBy({name: data.position});
      const teamId = await teamRepo.findOneBy({name: data.team});
      data.roleId = roleId?.id || null;
      data.positionId = positionId?.id || null;
      data.teamId = teamId?.id || null;
      data.subTeamId = subTeamId?.id || null;
      data.leadId = leadId?.id || null;
      data.hrId = hrId?.id || null;
      delete data.role;
      delete data.position;
      delete data.team;
      delete data.subTeam;
      delete data.lead;
      delete data.hr;
      const updatedUser = await userRepo.save(data);
      return updatedUser;
    }
    catch(err){
      console.error(err);
    }

  },

  // Helper method to ensure a user has the 'lead' role
  ensureLeadRole: async (userId: string): Promise<void> => {
    const lead = await userRepo.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if (!lead) throw new Error("Lead user not found");

  },

  deleteUser: async (id: string) => {
    const user = await userRepo.findOneBy({ id });
    if (!user) throw new Error("User not found");
    await userRepo.delete({id:user.id});
  },

  getTeamMembers: async (teamId: number): Promise<UserType[]> => {
    try {
      const members = await userRepo.find({
        where: { teamId: teamId },
        relations: ["role", "position", "Requests"],
      });
      return members;
    } catch (error: any) {
      console.error(`Error getting team members for team ${teamId}:`, error);
      throw new Error(`Failed to get team members: ${error.message}`);
    }
  },

  getMostRecentApprovedScores: async (userId: number | string): Promise<ScoreWithSkill[]> => {
    try {
     const status = 'COMPLETED'
      // Get the most recent approved assessment for the user
      const latestApprovedAssessment = await assessmentRequestRepo.findOne({
        where: {
          userId: userId.toString(),
          status: status as unknown as AssessmentStatus,
        },
        order: {
          requestedAt: "DESC",
        },
      });

      if (!latestApprovedAssessment) {
        return [];
      }

      // Get all scores for this assessment with skill details
      const scores = await scoreRepo.find({
        where: {
          assessmentId: latestApprovedAssessment.id,
        },
        relations: ["Skill"],
      });

      return scores.map((score) => ({
        skillId: score.skillId,
        skillName: score.Skill.name,
        Score: score.score
      }));
    } catch (error: any) {
      console.error(`Error getting recent scores for user ${userId}:`, error);
      return [];
    }
  },

  getSkillMatrixByTeam: async (teamName: string): Promise<UserWithScores[]> => {
    try {
      // Find the team by name first
      const team = await teamRepo.findOneBy({ name: teamName });
      if (!team) throw new Error("Team not found");

      const users = await userRepo.find({
        where: {
          teamId: team.id,
        },
        select: ["id", "userId","name", "email"],
        relations: ["role", "position", "Team", "subTeam", "lead", "hr"],
      });

      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

      return usersWithScores;
    } catch (error: any) {
      throw new Error(`Failed to get skill matrix by team: ${error.message}`);
    }
  },

  getFullSkillMatrix: async (): Promise<UserWithScores[]> => {
    try {
      const users = await userRepo.find({
        select:["id","name","userId", "email"],
        relations: ["role", "position", "Team", "subTeam", "lead", "hr"],
      });
      
      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

    return usersWithScores;

  } catch (error: any) {
    throw new Error(`Failed to get full skill matrix overview: ${error.message}`);
  }
  },

  getAllPositions: async (): Promise<PositionType[]> => {
    return await positionRepo.find();
  },
  
  getAllRoles: async (): Promise<RoleType[]> => {
    return await roleRepo.find();
  },
  

  // Organization-wide skill level stats
  getOrganizationSkillLevelStats: async (): Promise<{ basic:number; low: number; medium: number; high: number; expert:number }> => {
    try {
      // Get all users
      const users = await userRepo.find({ select: ["id"] });
      // Get all most recent approved scores for all users
      const allScores: number[] = [];
      for (const user of users) {
        const scores = await UserService.getMostRecentApprovedScores(user.id);
        for (const score of scores) {
          if (typeof score.Score === 'number') {
            allScores.push(score.Score);
          }
        }
      }
      // Count by level
      const stats = { basic:0, low: 0, medium: 0, high: 0, expert:0 };
      for (const score of allScores) {
        if (score==1) stats.basic++;
        else if (score == 2) stats.low++;
        else if (score == 3) stats.medium++;
        else if (score == 4) stats.high++;
        else if(score ==5) stats.expert++;
      }
      return stats;
    } catch (error: any) {
      throw new Error(`Failed to get organization skill level stats: ${error.message}`);
    }
  },

  getAllTeams: async (): Promise<TeamType[]> => {
    return await teamRepo.find();
  },

  getAllSubTeams: async (): Promise<subTeamType[]> => {
    return await subTeamRepo.find({
      where: { isActive: true },
      relations: ['teams'],
      order: { name: 'ASC' }
    });
  },
};

export default UserService;