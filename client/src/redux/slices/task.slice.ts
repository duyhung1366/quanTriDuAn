import { createAsyncThunk, createSlice, current, PayloadAction } from "@reduxjs/toolkit";
import Task, { UpdatePositionTaskArgs } from "../../../../common/models/task";
import { updatePositionTaskApi, apiCloneMultipleTask, apiMoveMultipleTask, apiDeleteMultipleTask, apiGetAllTask, apiCreateTask, apiGetSubTaskBySprintId } from "../../apis/task.api";
import { ClientTask, TaskDashboard } from "../../types/ClientTask";
import { normalizedState } from "../../utils/normalizedState";
import { BaseAsyncThunk } from "./base.slice";
import _, { StringNullableChain } from "lodash";
import { RootState } from "../store";

export interface TaskState {
  tasks: { [taskId: string]: ClientTask };
  loading: boolean;
  tasksByProjectId: { [projectId: string]: string[] };
  currentTask: ClientTask | null,
  searchUser: string[];
  searchName: string;
  key: number;
  checkedViewList: boolean;
  userTyping: string;
  allTask: { [taskId: string]: TaskDashboard };
  mapSubTask: {
    [taskId: string]: {
      [subTaskId: string]: Task
    }
  };
  listTaskCloneOrMove: string[];
  listTaskViewSubTask: string[];
  idsViewSubTaskDashBoard: string[];
  searchUserStatistic: string[];
}

const initialState: TaskState = {
  tasks: {},
  loading: true,
  tasksByProjectId: {},
  currentTask: null,
  checkedViewList: false,
  searchUser: [],
  key: 0,
  searchName: null,
  userTyping: null,
  listTaskCloneOrMove: [],
  listTaskViewSubTask: [],
  idsViewSubTaskDashBoard: [],
  allTask: {},
  mapSubTask: {},
  searchUserStatistic: []
}
const groupSubTasksByParentTaskId = (subTasks) => {
  const mapSubTask = {};

  subTasks.forEach((subTask) => {
    const { _id, parentTaskId } = subTask;

    if (mapSubTask[parentTaskId]) {
      mapSubTask[parentTaskId] = {
        ...mapSubTask[parentTaskId],
        [_id]: subTask,
      };
    } else {
      mapSubTask[parentTaskId] = {
        [_id]: subTask,
      };
    }
  });

  return mapSubTask;
};

class TaskAsyncThunk extends BaseAsyncThunk<ClientTask> {
  constructor() {
    super("tasks");
  }

  // TODO: Write new thunk here

  getTasksByProjectId = createAsyncThunk(`${this.name}/getByProjectId`, async (projectId: string) => {
    const params = {
      projectId
    }
    const entities = await this.CRUDBase.getAll(params);
    return entities;
  });

  updatePositionTask = createAsyncThunk(`${this.name}/updatePositionTask`, async (data: { taskId: string, task: UpdatePositionTaskArgs }) => {
    const result = await updatePositionTaskApi(data.taskId, data.task);
    return result;
  });
  getAllTask = createAsyncThunk(`${this.name}/getAllTask`, async (args: {
    from: number;
    to: number;
    user_id: string;
    project_ids: string[];
  }) => {
    // console.log("project_ids", args.project_ids);
    const entities = await apiGetAllTask(args);
    return entities;
  });

  cloneMultipleTask = createAsyncThunk(`${this.name}/cloneMultipleTask`, async (data: { taskIds: string[], sprintId: string }) => {
    const result = await apiCloneMultipleTask({ taskIds: data.taskIds, sprintId: data.sprintId });
    return result;
  });

  moveMultipleTask = createAsyncThunk(`${this.name}/moveMultipleTask`, async (data: { taskIds: string[], sprintId: string }) => {
    const result = await apiMoveMultipleTask({ taskIds: data.taskIds, sprintId: data.sprintId });
    return result;
  });

  deleteMultipleTask = createAsyncThunk(`${this.name}/deleteMultipleTask`, async (data: { ids: string[] }) => {
    const result = await apiDeleteMultipleTask({ ids: data.ids });
    return result;
  });

  createTask = createAsyncThunk(`${this.name}/createSubTask`, async (props: { task: Task, assignees?: string[] }) => {
    const result = await apiCreateTask({ task: props.task, assignees: props?.assignees });
    return result;
  });

  // getSubTaskByTaskId = createAsyncThunk(`${this.name}/getSubTaskByTaskId`, async (taskId: string) => {
  //   const result = await apiGetSubTaskByTaskId({ taskId });
  //   return result;
  // });
  getSubTaskBySprintId = createAsyncThunk(`${this.name}/getSubTaskBySprintId`, async (sprintId: string, { getState }) => {
    const state = getState() as RootState;
    // if (state.taskReducer.)
    const result = await apiGetSubTaskBySprintId({ sprintId });
    return result;
  });


}

const taskAsyncThunk = new TaskAsyncThunk();
// action
export const getTasksByProjectId = taskAsyncThunk.getTasksByProjectId;
export const getAllTask = taskAsyncThunk.getAllTask;
export const createTask = taskAsyncThunk.createTask;
export const updateTask = taskAsyncThunk.update;
export const deleteTask = taskAsyncThunk.delete;
export const updatePositionTask = taskAsyncThunk.updatePositionTask;
export const getTaskById = taskAsyncThunk.getById;
export const cloneMultipleTask = taskAsyncThunk.cloneMultipleTask;
export const moveMultipleTask = taskAsyncThunk.moveMultipleTask;
export const deleteMultipleTask = taskAsyncThunk.deleteMultipleTask;
// export const getSubTasksByTaskId = taskAsyncThunk.getSubTaskByTaskId;
export const getSubTasksBySprintId = taskAsyncThunk.getSubTaskBySprintId;


const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    currentTaskActive: (state, action) => {
      state.currentTask = action.payload
    },
    checkedViewTaskByList: (state, action) => {
      state.checkedViewList = action.payload
    },
    createTaskRealTime: (state, action) => {
      state.tasks[action.payload._id] = {
        ...action.payload,
        assignments: []
      }

    },
    updateTaskRealTime: (state, action) => {
      const taskId = action.payload?._id;
      if (!!taskId) {
        state.tasks = { ...state.tasks, [taskId]: { ...action.payload, assignments: (state.tasks[taskId] ?? {}).assignments ?? [] } }
        state.key = current(state).key + 1;
      }
    },
    deleteTaskRealTime: (state, action) => {
      const data = Object.values(state.tasks).filter((item: Task) => item._id !== action.payload._id)
      state.tasks = normalizedState<Task>("_id", data);
    },
    deleteMultipleTaskRealTime: (state, action) => {
      const arrayTaskId = action.payload
      arrayTaskId.forEach((taskId) => {
        delete state.tasks[taskId]
      })
    },
    moveTasksRealTime: (state, action) => {
      state.tasks = { ...state.tasks, ...normalizedState("_id", action.payload.data) };
      for (const updatedTask of action.payload.tasksUpdated) {
        if (state.tasks[updatedTask._id]) {
          state.tasks[updatedTask._id] = { ...state.tasks[updatedTask._id], ...updatedTask };
        }
      }

      state.key = current(state).key + 1;
    },
    cloneTasksRealTime: (state, action) => {
      state.tasks = { ...state.tasks, ...normalizedState("_id", action.payload.data) };
      state.key = current(state).key + 1;
    },
    searchUser: (state, action) => {
      const index = state.searchUser.indexOf(action.payload)
      if (index == -1) {
        state.searchUser.push(action.payload)
      }
      else {
        state.searchUser.splice(index, 1)
      }
    },
    clearSearchUser: (state) => {
      state.searchUser = []
      state.key = current(state).key + 1;
    },
    searchUserStatistic: (state, action) => {
      const index = state.searchUserStatistic.indexOf(action.payload)
      if (index == -1) {
        state.searchUserStatistic.push(action.payload)
      }
      else {
        state.searchUserStatistic.splice(index, 1)
      }
    },
    clearSearchUserStatistic: (state) => {
      state.searchUserStatistic = []
    },
    createAssignMemberFromTask: (state, action) => {
      const { taskId, userId, role, assignAt, projectId, sprintId } = action.payload;
      state.tasks[taskId].assignments.push({ taskId, userId, role, assignAt, projectId, sprintId });
    },
    deleteAssignMemberFromTask: (state, action) => {
      const { taskId, userId, role } = action.payload;
      const index = current(state).tasks[taskId].assignments.findIndex((e) => e.userId === userId && e.role === role);
      state.tasks[taskId].assignments.splice(index, 1)
    },
    setImagesCurrentTask: (state, action) => {
      state.currentTask.attachImage = action.payload
    },
    searchName: (state, action) => {
      state.searchName = action.payload
    },
    setUserTyping: (state, action) => {
      state.userTyping = action.payload
    },
    cancelUserTyping: (state) => {
      state.userTyping = null
    },
    handleSelectTask: (state, action: PayloadAction<string>) => {
      const index = state.listTaskCloneOrMove.indexOf(action.payload)
      if (index == -1) {
        state.listTaskCloneOrMove.push(action.payload)
      }
      else {
        state.listTaskCloneOrMove.splice(index, 1)
      }
    },
    handleShowAllSubTasks: (state, action) => {
      state.listTaskViewSubTask = action.payload
    },
    handleViewSubTask: (state, action: PayloadAction<string>) => {
      const index = state.listTaskViewSubTask.indexOf(action.payload)
      if (index == -1) {
        state.listTaskViewSubTask.push(action.payload)
      }
      else {
        state.listTaskViewSubTask.splice(index, 1)
      }
    },
    handleViewSubTaskDashBoard: (state, action) => {
      const index = state.idsViewSubTaskDashBoard.indexOf(action.payload)
      if (index == -1) {
        state.idsViewSubTaskDashBoard.push(action.payload)
      }
      else {
        state.idsViewSubTaskDashBoard.splice(index, 1)
      }
    },
    removeSelectedTasks: (state) => {
      state.listTaskCloneOrMove = []
    },
    createSubTask: (state, action) => {

    },
    syncStatusSubTask: (state, action) => {
      const parentTaskId = action.payload.parentTaskId
      const subTask = Object.values(state.mapSubTask[parentTaskId]).find(item => item.checkListItemRefId === action.payload.itemId)
      const updatedMapSubTask = {
        ...state.mapSubTask,
        [parentTaskId]: {
          ...state.mapSubTask[parentTaskId],
          [subTask._id]: {
            ...state.mapSubTask[parentTaskId][subTask._id],
            ...state.mapSubTask[parentTaskId][subTask._id].status = action.payload.newStatus
          },
        },
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getTasksByProjectId.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getTaskById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllTask.fulfilled, (state, action) => {
      const tasks = Object.values(action.payload);
      state.loading = false;
      if (tasks) {
        state.allTask = normalizedState("_id", tasks);
      }
    });
    builder.addCase(getTasksByProjectId.fulfilled, (state, action) => {
      const tasks = action.payload.data;
      state.loading = false;
      if (tasks.length > 0) {
        state.tasks = { ...state.tasks, ...normalizedState("_id", action.payload.data) };
        state.tasksByProjectId[tasks[0].projectId] = tasks.map(t => t._id);
      }
    });
    builder.addCase(createTask.fulfilled, (state, action) => {
      if (!action.payload.data.parentTaskId) {
        state.tasks[action.payload.data._id] = {
          ...action.payload.data,
          assignments: []
        }
        const projectId = action.payload.data.projectId;
        const taskId = action.payload.data._id;
        state.tasksByProjectId = {
          ...current(state.tasksByProjectId),
          [projectId]: [...(current(state.tasksByProjectId)[projectId] ?? []), taskId],
        }
        state.key = current(state).key + 1;
      }
      else {
        const taskId = action.payload.data.parentTaskId;
        const subTaskId = action.payload.data._id;
        state.mapSubTask[taskId] = state.mapSubTask[taskId] || {};
        state.mapSubTask[taskId][subTaskId] = action.payload.data || { ...state.mapSubTask[taskId][subTaskId], ...action.payload.data };
        state.key = current(state).key + 1;

      }
    });

    builder.addCase(updateTask.fulfilled, (state, action) => {
      if (action.payload.data) {
        const updatedTaskPayload = action.payload.data;
        const taskIdToUpdate = updatedTaskPayload._id;

        if (!updatedTaskPayload.parentTaskId) {
          const updatedTask = {
            ...current(state).tasks[taskIdToUpdate],
            ...updatedTaskPayload,
            assignments: current(state).tasks[taskIdToUpdate].assignments
          };
          const updatedTasks = {
            ...current(state).tasks,
            [taskIdToUpdate]: updatedTask
          };
          state.tasks = updatedTasks;
        } else {
          const parentTaskId = updatedTaskPayload.parentTaskId;
          const subTaskId = taskIdToUpdate;
          state.mapSubTask[parentTaskId] = state.mapSubTask[parentTaskId] || {};
          state.mapSubTask[parentTaskId][subTaskId] = {
            ...current(state).mapSubTask[parentTaskId][subTaskId],
            ...updatedTaskPayload
          };
        }
        state.currentTask = action.payload.data;
      }
    });
    builder.addCase(updatePositionTask.fulfilled, (state, action) => {
      // TODO: get old asssignees & replace to new Task
      const tasks = action.payload.data
      if (tasks.length > 0) {
        const [updatedTaskPayload] = action.payload.data.slice(-1)
        const [updatedCurChillTaskPayload] = action.payload.data.slice(0, 1)
        const [updatedDesChillTaskPayload] = action.payload.data.slice(-2, -1)
        const taskIdToUpdate = updatedTaskPayload._id
        const updatedTask = { ...current(state).tasks[taskIdToUpdate], ...updatedTaskPayload, assignments: current(state).tasks[taskIdToUpdate].assignments };
        const updatedCurChillTask = { ...current(state).tasks[updatedCurChillTaskPayload._id], ...updatedCurChillTaskPayload, assignments: current(state).tasks[updatedCurChillTaskPayload._id].assignments };
        const updatedDesChillTask = { ...current(state).tasks[updatedDesChillTaskPayload._id], ...updatedDesChillTaskPayload, assignments: current(state).tasks[updatedDesChillTaskPayload._id].assignments };
        const updatedTasks = {
          ...current(state).tasks,
          [taskIdToUpdate]: updatedTask,
          [updatedCurChillTaskPayload._id]: updatedCurChillTask,
          [updatedDesChillTaskPayload._id]: updatedDesChillTask
        };
        state.tasks = updatedTasks
      }
    });
    builder.addCase(getTaskById.fulfilled, (state, action) => {
      state.currentTask = action.payload.data
    });
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      if (!action.payload.data.parentTaskId) {
        const data = Object.values(state.tasks).filter((item: Task) => item._id !== action.payload.data._id)
        state.tasks = normalizedState<Task>("_id", data);
      }
      else {
        const parentTaskId = action.payload.data.parentTaskId
        const data = Object.values(state.mapSubTask[parentTaskId])
          .filter(item => item._id !== action.payload.data._id)
        state.mapSubTask[parentTaskId] = normalizedState<Task>("_id", data);
      }
    });

    builder.addCase(cloneMultipleTask.fulfilled, (state, action) => {
      state.tasks = { ...state.tasks, ...normalizedState("_id", action.payload.data) };
      state.key = current(state).key + 1;
    });

    builder.addCase(moveMultipleTask.fulfilled, (state, action) => {
      state.tasks = { ...state.tasks, ...normalizedState("_id", action.payload.data.tasksReturnList) };
      state.key = current(state).key + 1;
      for (const updatedTask of action.payload.data.tasksUpdated) {
        if (state.tasks[updatedTask._id]) {
          state.tasks[updatedTask._id] = { ...state.tasks[updatedTask._id], ...updatedTask };
        }
      }
      // const taskId = action.meta.arg.taskIds
      // const sprintId = action.meta.arg.sprintId
      // taskId.forEach((taskId) => {
      //   state.tasks[taskId] = { ...state.tasks[taskId], sprintId }
      // })
    });
    builder.addCase(deleteMultipleTask.fulfilled, (state, action) => {
      const taskId = action.meta.arg.ids
      taskId.forEach((taskId) => {
        delete state.tasks[taskId]
      })
    })
    builder.addCase(getSubTasksBySprintId.fulfilled, (state, action) => {
      const subTasks = action.payload.data;
      state.mapSubTask = groupSubTasksByParentTaskId(subTasks);
    });

  }
})

export const { currentTaskActive, setUserTyping, searchUser, searchName, removeSelectedTasks,
  clearSearchUser, deleteAssignMemberFromTask, checkedViewTaskByList, createTaskRealTime, updateTaskRealTime, deleteTaskRealTime,
  createAssignMemberFromTask, deleteMultipleTaskRealTime, setImagesCurrentTask, handleSelectTask, handleShowAllSubTasks, handleViewSubTask, cancelUserTyping,
  searchUserStatistic, clearSearchUserStatistic, moveTasksRealTime, cloneTasksRealTime, createSubTask, syncStatusSubTask, handleViewSubTaskDashBoard
} = taskSlice.actions

export default taskSlice.reducer;