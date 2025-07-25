import SkillController from "../../controllers/skill/SkillController";
import { role } from "../../enum/enum";
import authorizeRoles from "../../middlewares/authorizeRole";

const skillRoutes = {
  name: "skill-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "GET",
        path: "/{id}",
        handler: SkillController.getSkillById,
      },
      {
        method: "GET",
        path: "/all-skills",
        options: authorizeRoles([role.HR, role.LEAD, role.ADMIN]),
        handler: SkillController.getAllSkills,
      },
      {
        method: "POST",
        path: "/create",
        options: authorizeRoles([role.HR, role.ADMIN]),
        handler: SkillController.createSkill,
      },
      {
        method: "POST",
        path: "/update",
        options: authorizeRoles([role.HR, role.ADMIN]),
        handler: SkillController.updateSkill,
      },
      {
        method: "DELETE",
        path: "/delete/{id}",
        options: authorizeRoles([role.HR, role.ADMIN]),
        handler: SkillController.deleteSkillById,
      },
      {
        method: "GET",
        path: "/position",
        handler: SkillController.getSkillByPosition,
      },
      {
        method: "GET",
        path: "/guide",
        handler: SkillController.getSkillsWithUpgradeGuides,
      },
    ]);
  },
};

export default skillRoutes;