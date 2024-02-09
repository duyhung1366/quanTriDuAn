import { useSnackbar } from "notistack";
import React from "react";
import { useParams } from "react-router-dom";
import { TaskStatus } from "../../../common/constants";
import Task, { UpdatePositionTaskArgs } from "../../../common/models/task";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { cloneMultipleTask, moveMultipleTask, createTask, deleteTask, getTaskById, getTasksByProjectId, TaskState, updatePositionTask, updateTask, deleteMultipleTask, getAllTask } from "../redux/slices/task.slice";
import { RootState } from "../redux/store";

interface ITaskProps {
  projectId?: string;
  sprintId?: string;
}
export const useTask = (props?: ITaskProps) => {
  const dispatch = useAppDispatch();
  const taskState = useAppSelector((state: RootState) => state.taskReducer);
  const [openPopup, setOpenPopup] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleLoadTasksByProjectId = (projectId: string) => {
    return dispatch(getTasksByProjectId(projectId));
  }

  const handleCreateNewTask = async (task: Task, assignees?: string[]) => {
    try {
      await dispatch(createTask({ task, assignees }));
      if (task?.parentTaskId) {
        enqueueSnackbar("Create  subtask successfully!", { variant: "success" });
      }
    } catch (error) {
      // TODO: handle error to show message
      enqueueSnackbar("Task creation failed!", { variant: "error" });
      throw null;
    }

  }

  const handleLoadTaskById = async (taskId: string) => {
    dispatch(getTaskById(taskId));
  }

  const handleUpdateTask = async (taskId: string, task: Partial<Task>) => {
    try {
      await dispatch(updateTask({ id: taskId, data: task }));
      // dispatch(getAllTask())
      // enqueueSnackbar(`Update task successfully!`, { variant: "success" });
    } catch (error) {
      // enqueueSnackbar("Task update failed!", { variant: "error" });
      throw null;
    }
  }
  const handleDeleteTask = async (id: string) => {
    try {
      await dispatch(deleteTask(id));
      // enqueueSnackbar("Delete task successfully!", { variant: "success", autoHideDuration: 2000 });
    } catch (error) {
      enqueueSnackbar("Delete task failed!", { variant: "error", autoHideDuration: 2000 });
    }
  }

  const handleUpdatePositionTask = async (taskId: string, task: UpdatePositionTaskArgs) => {
    try {
      await dispatch(updatePositionTask({ taskId, task: task }));
      // enqueueSnackbar("Update task position successfully!", { variant: "success" });
    } catch (error) {
      // TODO: handle error to show message
      // enqueueSnackbar("Task update position failed!", { variant: "error" });
      throw null;
    }
  }

  const handleCloneMultileTask = async (taskIds: string[], sprintId: string) => {
    try {
      await dispatch(cloneMultipleTask({ taskIds, sprintId }));
    } catch (error) {
      enqueueSnackbar("Clone task failed!", { variant: "error", autoHideDuration: 2000 });
    }
  }

  const handleMoveMultileTask = async (taskIds: string[], sprintId: string) => {
    try {
      await dispatch(moveMultipleTask({ taskIds, sprintId }));
    } catch (error) {
      enqueueSnackbar("Move task failed!", { variant: "error", autoHideDuration: 2000 });
    }
  }

  const handleDeleteMultipleTask = async (ids: string[]) => {
    try {
      await dispatch(deleteMultipleTask({ ids }));
    } catch (error) {
      enqueueSnackbar("Delete task failed!", { variant: "error", autoHideDuration: 2000 });
    }
  }


  return {
    openPopup,
    setOpenPopup,
    taskState,
    handleCreateNewTask,
    handleUpdateTask,
    handleDeleteTask,
    handleUpdatePositionTask,
    handleLoadTasksByProjectId,
    handleLoadTaskById,
    handleCloneMultileTask,
    handleMoveMultileTask,
    handleDeleteMultipleTask,
  };
}