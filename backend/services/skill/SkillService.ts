import { AppDataSource, skillRepo } from "../../config/dataSource";
import { SkillType } from "../../types/entities";

const SkillService = {
  createSkill: async (skillData: SkillType): Promise<SkillType> => {
    try {
      // Reset sequence to ensure proper ID generation
      await AppDataSource.query(`
        SELECT setval(
          pg_get_serial_sequence('skills', 'id'),
          (SELECT COALESCE(MAX(id), 0) FROM skills)
        )
      `);

      // Check if skill already exists
      const existingSkill = await skillRepo.findOneBy({ name: skillData.name });
      if (existingSkill) {
        throw new Error("Skill already exists");
      }

      // Create and save new skill
      const newSkill = skillRepo.create(skillData);
      const savedSkill = await skillRepo.save(newSkill);
      return savedSkill;
    } catch (error: any) {
      throw new Error(`Failed to create skill: ${error.message}`);
    }
  },

  updateSkill: async (updateData: SkillType): Promise<SkillType> => {
    try {
      const { id } = updateData;
      const skill = await skillRepo.findOneBy({ id });
      if (!skill) {
        throw new Error("Skill not found");
      }

      // Merge and save updates
      skillRepo.merge(skill, updateData as any);
      return await skillRepo.save(skill);
    } catch (error: any) {
      throw new Error(`Failed to update skill: ${error.message}`);
    }
  },

  deleteSkillById: async (id: number): Promise<SkillType> => {
    try {
      const skill = await skillRepo.findOneBy({ id });
      if (!skill) {
        throw new Error("Skill not found");
      }

      return await skillRepo.remove(skill);
    } catch (error: any) {
      throw new Error(`Failed to delete skill: ${error.message}`);
    }
  },

  getAllSkills: async (): Promise<SkillType[]> => {
    try {
      return await skillRepo.find({
        order: { id: "ASC" } as any,
      });
    } catch (error: any) {
      throw new Error(`Failed to retrieve skills: ${error.message}`);
    }
  },

  getSkillById: async (id: number): Promise<SkillType> => {
    try {
      const skill = await skillRepo.findOneBy({ id });
      if (!skill) {
        throw new Error("Skill not found");
      }
      return skill;
    } catch (error: any) {
      throw new Error(`Failed to retrieve skill: ${error.message}`);
    }
  },

  getSkillByPosition: async (position: number): Promise<SkillType[]> => {
    try {
      const skills = await skillRepo
        .createQueryBuilder("skill")
        .where({ positionId: position })
        .orderBy("skill.id", "ASC")
        .getMany();

      if (!skills.length) {
        throw new Error("No skills found for this position");
      }
      return skills;
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve skills by position: ${error.message}`
      );
    }
  },

  getSkillsWithUpgradeGuides: async (): Promise<SkillType[]> => {
    try {
      return await skillRepo.find({
        relations: ["upgradeGuides"],
        order: { name: "ASC" },
      });
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve skills with upgrade guides: ${error.message}`
      );
    }
  },

  searchSkills: async (searchTerm: string): Promise<SkillType[]> => {
    try {
      return await skillRepo
        .createQueryBuilder("skill")
        .where("skill.name ILIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orderBy("skill.name", "ASC")
        .getMany();
    } catch (error: any) {
      throw new Error(`Failed to search skills: ${error.message}`);
    }
  },
};

export default SkillService;




