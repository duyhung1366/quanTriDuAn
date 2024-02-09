import { Router } from "express";
import { ICreateProjectArgs, IEditProjectArgs } from "../../../common/models/project";
import { ICreateProjectMembersArgs } from "../../../common/models/project_member";
import ProjectService from "../../services/work/project";
import { AuthRequest } from "../../types/Request";
import asyncHandler from "../../utils/asyncHandler";
import { BadRequestError } from "../../utils/errors";

const router = Router();

// Projects
router.post("/projects", asyncHandler(async (req, res) => {
  const reqBody = <ICreateProjectArgs>req.body;
  if (!reqBody.name) throw new BadRequestError();
  const data = await ProjectService.createProject(reqBody);
  return res.json(data);
}));

router.get("/projects", asyncHandler(async (req, res) => {
  const data = await ProjectService.listProjects();
  return res.json(data);
}));

router.get("/projects/:projectId", asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  const data = await ProjectService.getProjectById(projectId);
  if (!data) {
    throw new BadRequestError();
  }
  return res.json(data);
}));

router.patch("/projects/:projectId", asyncHandler(async (req, res) => {
  const projectId = <string>req.params.projectId;
  const reqBody = <IEditProjectArgs>req.body;

  const data = await ProjectService.updateProject(projectId, reqBody);
  if (!data) {
    throw new BadRequestError();
  }
  return res.json(data);
}));
router.delete("/projects/:projectId", asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;

  const data = await ProjectService.deleteProject(projectId);

  if (!data) {
    throw new BadRequestError();
  }
  return res.json(data);
}));
router.get("/projects/:projectId/members", asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;

  const data = await ProjectService.getProjectMembers({ projectId })

  return res.json(data)

}))
router.post("/project-members", asyncHandler(async (req, res) => {
  const reqBody = <ICreateProjectMembersArgs>req.body;
  const data = await ProjectService.addOrUpdateProjectMember(reqBody)
  if (!data) {
    throw new BadRequestError();
  }
  return res.json(data);
}))
router.delete("/project-members/:projectMemberId", asyncHandler(async (req, res) => {
  const projectMemberId = req.params.projectMemberId
  const data = await ProjectService.removeProjectMember(projectMemberId)
  if (!data) {
    throw new BadRequestError();
  }
  return res.json(data);
}));

router.get("/user-projects", asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.credentials!.id;

  const data = await ProjectService.getUserProjects({ userId });
  return res.json(data);
}));


export { router as projectRouter };
