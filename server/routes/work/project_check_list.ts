

import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { BadRequestError } from "../../utils/errors";
import { CreateProjectCheckListArgs } from "../../../common/models/project_check_list";
import ProjectCheckListService from "../../services/work/project_check_list";

const router = Router();

router.post("/projectCheckList", asyncHandler(async (req, res) => {
  const reqBody = <CreateProjectCheckListArgs>req.body;
  const { name, attachTo, parentId, createDate } = reqBody
  if (!name && !attachTo && !parentId && !createDate) throw new BadRequestError();
  const data = await ProjectCheckListService.createProjectCheckList(reqBody);
  return res.json(data);
}));

router.delete('/projectCheckList/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await ProjectCheckListService.deleteProjectCheckList({ id });
  return res.json(data);
}));

router.delete('/projectCheckList/:projectCheckListId/:itemId', asyncHandler(async (req, res) => {
  const { projectCheckListId, itemId } = req.params;
  const data = await ProjectCheckListService.deleteItemCheckList({ projectCheckListId, itemId });
  return res.json(data);
}));

router.get('/projectCheckList/:parentId', asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  const data = await ProjectCheckListService.getProjectCheckList({ parentId });
  return res.json(data);
}));

router.patch('/projectCheckList/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reqBody: any = req.body;
  const data = await ProjectCheckListService.addItemCheckList({ id, items: reqBody });
  return res.json(data);
}));

router.patch('/projectCheckList/:projectCheckListId/:itemId', asyncHandler(async (req, res) => {
  const { projectCheckListId, itemId } = req.params;
  const reqBody: any = req.body;
  const data = await ProjectCheckListService.updateItemCheckList({ projectCheckListId, itemId, update: reqBody });
  return res.json(data);
}));




export { router as projectCheckListRouter };
