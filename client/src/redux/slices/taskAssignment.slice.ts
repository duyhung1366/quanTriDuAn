
import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import TaskAssignment from "../../../../common/models/task_assignment";
import { normalizedState } from "../../utils/normalizedState";
import { BaseAsyncThunk } from "./base.slice";
import _ from "lodash";
import { apiCreateTaskAssignment, apiGetSprintAssignment, CreateTaskAssignmentArgs } from "../../apis/task.api";
import { TaskRole } from "../../../../common/constants";


export interface TaskAssignmentState {
  taskAssignment: { [taskAssignmentId: string]: TaskAssignment };
  loading: boolean;
  taskAssignmentById: TaskAssignment[],
  taskAssignmentBySprintId: TaskAssignment[],
  allTaskAssignment: TaskAssignment[],
  key: number;
}

const initialState: TaskAssignmentState = {
  taskAssignment: {},
  loading: false,
  taskAssignmentById: [],
  taskAssignmentBySprintId: [],
  allTaskAssignment: [],
  key: 0
}
class TaskAssignmentAsyncThunk extends BaseAsyncThunk<TaskAssignment> {
  constructor() {
    super("tasks");
  }

  getTaskAssignmentById = createAsyncThunk(`${this.name}/getByTaskAssignmentId`, async (taskAssignmentId: string) => {
    const entities = await this.CRUDBase.getTaskAssignmentById(taskAssignmentId);
    return entities;
  })
  getTaskAssignmentBySprintId = createAsyncThunk(`${this.name}/getAssigneesBySprintId`, async (sprintAssignmentId: string) => {
    const entities = await apiGetSprintAssignment(sprintAssignmentId);
    return entities;
  })
  deleteTaskAssignment = createAsyncThunk(`${this.name}/deleteTaskAssignment`, async (props: { taskId: string, userId: string, role: TaskRole }) => {
    const entities = await this.CRUDBase.deleteTaskAssignment(props.userId, props.taskId, props.role);
    return entities;
  })
  createTaskAssignment = createAsyncThunk(`${this.name}/createAssignment`, async (args: CreateTaskAssignmentArgs) => {
    const data = await apiCreateTaskAssignment(args);
    return data;
  })
}

const taskAssignmentAsyncThunk = new TaskAssignmentAsyncThunk();

export const getTaskAssignmentById = taskAssignmentAsyncThunk.getTaskAssignmentById;
export const getTaskAssignmentBySprintId = taskAssignmentAsyncThunk.getTaskAssignmentBySprintId;
export const createTaskAssignment = taskAssignmentAsyncThunk.createTaskAssignment;
export const deleteTaskAssignment = taskAssignmentAsyncThunk.deleteTaskAssignment;


const taskAssignmentSlice = createSlice({
  name: 'taskAssignment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getTaskAssignmentById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getTaskAssignmentById.fulfilled, (state, action) => {
      state.taskAssignmentById = action.payload.data
      state.key = current(state).key + 1;
    });
    builder.addCase(getTaskAssignmentBySprintId.fulfilled, (state, action) => {
      state.taskAssignmentBySprintId = action.payload
    });
    builder.addCase(createTaskAssignment.fulfilled, (state, action) => {
      const data = action.payload;
      state.taskAssignment[data._id] = data;
      state.taskAssignmentById.push(data);
      state.taskAssignmentBySprintId.push(data);
      state.key = current(state).key + 1;

    });

    builder.addCase(deleteTaskAssignment.fulfilled, (state, action) => {
      _.remove(state.taskAssignmentById, (taskAssignment) => taskAssignment._id === action.payload.data._id);
      state.taskAssignmentBySprintId = state.taskAssignmentBySprintId.filter(item => item._id !== action.payload.data._id)
      state.key = current(state).key + 1;

    });
  },
})

export default taskAssignmentSlice.reducer;

