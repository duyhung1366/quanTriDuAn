import { Router } from "express";
import { CreateSprintArgs } from "../../../common/models/sprint";
import SprintService from "../../services/work/sprint";
import { ParseQuery } from "../../utils/apiUtils";
import asyncHandler from "../../utils/asyncHandler";
import { BadRequestError } from "../../utils/errors";

const router = Router();

// Sprints
router.get("/sprints", asyncHandler(async (req, res) => {
  const projectId = req.query.projectId as string;
  const sortOrder = req.query.sortOrder as ("desc" | "asc");
  const parentId = req.query.parentId as string;
  const skip = +(req.query.skip as string ?? 0);
  const _status = req.query.status as string;
  const status = typeof _status !== "undefined" ? +_status : undefined;
  const loadCurrent = ParseQuery.bool(req.query.loadCurrent);

  const data = await SprintService.listSprints({
    projectId, sortOrder, parentId, skip, status, loadCurrent
  });
  return res.json(data);
}));
/*
tại một project chi có 1 sprint được active

*/

router.post("/sprints", asyncHandler(async (req, res) => {
  const reqBody = <CreateSprintArgs>req.body;
  ["projectId", "startDate", "endDate"].forEach((key) => {
    if (!reqBody[key]) throw new BadRequestError();
  });
  const data = await SprintService.createSprint(reqBody);
  return res.json(data);
}));

router.delete('/sprints/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await SprintService.deleteSprint({ id });
  return res.json(data);
}));
router.patch('/sprints/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reqBody: any = req.body;
  const data = await SprintService.updateSprint({ id, update: reqBody });
  return res.json(data);
}));


export { router as sprintRouter };