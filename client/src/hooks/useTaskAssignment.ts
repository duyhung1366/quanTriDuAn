
import { useSnackbar } from "notistack";
import React from "react";
import { TaskRole } from "../../../common/constants";
import TaskAssignment from "../../../common/models/task_assignment";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createTaskAssignment, deleteTaskAssignment } from '../redux/slices/taskAssignment.slice';
import { getTaskAssignmentById } from "../redux/slices/taskAssignment.slice";
import { RootState } from "../redux/store";
type TaskAssignmentWithDiscord = TaskAssignment & { nameStatusTask?: string; discordId?: string; nameUserAssign?: string; idUserAssign?: string; }

export const useTaskAssignment = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const taskAssignmentState = useAppSelector((state: RootState) => state.taskAssignmentReducer);
  const sprintState = useAppSelector((state: RootState) => state.sprintReducer);

  const handleCreateTaskAssignment = async (taskAssignment: TaskAssignmentWithDiscord) => {
    console.log("taskAssignment", taskAssignment);

    try {
      await dispatch(createTaskAssignment(taskAssignment));
      // enqueueSnackbar("Assignement successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Assignement failed!", { variant: "error" });
      throw null;
    }
  }
  const handleDeleteTaskAssignment = async (taskId: string, userId: string, role: TaskRole) => {
    try {
      await dispatch(deleteTaskAssignment({ taskId, userId, role }));
      // enqueueSnackbar("Unassignment successfully!", { variant: "success", autoHideDuration: 2000 });
    } catch (error) {
      enqueueSnackbar("Unassignment failed!", { variant: "error", autoHideDuration: 2000 });

    }
  }

  const handleLoadTaskAssignmentById = async (taskAssignmentId: string) => {
    if (!taskAssignmentId) return;
    dispatch(getTaskAssignmentById(taskAssignmentId));
  }
  return {
    handleCreateTaskAssignment, handleLoadTaskAssignmentById,
    handleDeleteTaskAssignment,
    taskAssignmentState
  }
}
