import { unwrapResult } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSnackbar } from "notistack";
import React from "react";
import { SprintStatus } from "../../../common/constants";
import Sprint, { CreateSprintArgs } from "../../../common/models/sprint";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createSprint, getSprintsByProjectId, deleteSprint, updateSprint } from "../redux/slices/sprint.slice";
import { RootState } from "../redux/store";

interface ISprintProps {
  projectId?: string;
}
export const useSprint = (props?: ISprintProps) => {
  const dispatch = useAppDispatch();
  const sprintState = useAppSelector((state: RootState) => state.sprintReducer);
  const projectState = useAppSelector((state: RootState) => state.projectReducer);
  const [openPopup, setOpenPopup] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [openUpdateStatusSprint, setOpenUpdateStatusSprint] = React.useState(false);
  const listSprintByIdProject = Object.values(sprintState.sprints).filter((e) => e.projectId === projectState.currentProject?._id)
  const isSprintActive = listSprintByIdProject.find((e: Sprint) => e.status === SprintStatus.ACTIVE)


  const handleCreateSprint = async (sprintArg: CreateSprintArgs, projectId: string) => {
    try {
      if (!_.isEmpty(isSprintActive) && sprintArg.status === SprintStatus.ACTIVE) {
        enqueueSnackbar(" Only allow 1 ACTIVE sprint per project", { variant: "error" });
        return;
      }
      sprintArg.projectId = projectId;
      const response = await dispatch(createSprint(sprintArg as Sprint));
      const { data } = unwrapResult(response);
      return data;
      setOpenPopup(false);
      // enqueueSnackbar("Create sprint successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Sprint creation failed !", { variant: "error" });
      throw null;
    }
  }

  const handleUpdateSprint = async (id: string, data: any) => {
    try {
      if (!_.isEmpty(isSprintActive) && data.status === SprintStatus.ACTIVE && id !== isSprintActive._id) {
        enqueueSnackbar(" Only allow 1 ACTIVE sprint per project", { variant: "error" });
        return;
      }
      const response = await dispatch(updateSprint({ id, data })).unwrap();
      setOpenPopup(false);
      // enqueueSnackbar("Update sprint successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Sprint creation failed !", { variant: "error" });
      // TODO: handle error to show message
      throw null;
    }
  }
  const handleUpdateStatusSprint = async (id: string, data: any) => {
    try {
      const response = await dispatch(updateSprint({ id, data })).unwrap();
      setOpenUpdateStatusSprint(false);
      // enqueueSnackbar("Update status sprint successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Update status sprint failed !", { variant: "error" });
      // TODO: handle error to show message
      throw null;
    }
  }

  const handleDeleteSprint = async (id: string) => {
    try {
      const response = await dispatch(deleteSprint(id)).unwrap();
      // enqueueSnackbar("Update status sprint successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Update status sprint failed !", { variant: "error" });
      // TODO: handle error to show message
      throw null;
    }
  }


  const handleLoadSprintByProjectId = async (projectId: string) => {
    dispatch(getSprintsByProjectId(projectId));
  }

  return {
    openPopup, handleUpdateSprint, setOpenPopup, sprintState, handleDeleteSprint,
    handleCreateSprint, handleLoadSprintByProjectId,
    handleUpdateStatusSprint, openUpdateStatusSprint, setOpenUpdateStatusSprint, isSprintActive
  };
}