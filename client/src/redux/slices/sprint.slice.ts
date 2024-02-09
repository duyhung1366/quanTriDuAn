import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import Sprint from "../../../../common/models/sprint";
import { normalizedState } from "../../utils/normalizedState";
import { BaseAsyncThunk } from "./base.slice";

export interface SprintState {
  sprints: { [sprintId: string]: Sprint };
  loading: boolean;
  currentSprint: Sprint | null;
  sprintsByProjectId: { [projectId: string]: string[] };
  listSprintByProjectId: Array<Sprint>;
  key: number;
  showArchivedSprint: boolean;
}

const initialState: SprintState = {
  sprints: {},
  loading: true,
  currentSprint: null,
  sprintsByProjectId: {},
  listSprintByProjectId: [],
  key: 0,
  showArchivedSprint: false
}

class SprintAsyncThunk extends BaseAsyncThunk<Sprint> {
  constructor() {
    super("sprints");
  }

  // TODO: Write new thunk here

  getSprintsByProjectId = createAsyncThunk(`${this.name}/getAll`, async (projectId: string) => {
    const params = {
      projectId,
      loadCurrent: true
    }
    const entities = await this.CRUDBase.getAll(params);
    return entities;
  });
}

const sprintAsyncThunk = new SprintAsyncThunk();
// action
export const getSprintsByProjectId = sprintAsyncThunk.getSprintsByProjectId;
export const createSprint = sprintAsyncThunk.create;
export const deleteSprint = sprintAsyncThunk.delete;
export const updateSprint = sprintAsyncThunk.update;


const sprintSlice = createSlice({
  name: "sprints",
  initialState,
  reducers: {
    setCurrentSprint: (state, action) => {
      state.currentSprint = action.payload
    },
    updateSprintSocket: (state, action) => {
      state.sprints[action.payload._id] = action.payload
      // state.currentSprint = action.payload;
      state.key = current(state).key + 1;
    },
    createSprintSocket: (state, action) => {
      const sprintId = action.payload._id;
      state.sprints[sprintId] = action.payload;
      state.key = current(state).key + 1;
    },
    loadListSprintByProjectId: (state, action) => {
      state.listSprintByProjectId = action.payload
    },
    setShowArchivedSprint: (state, action) => {
      state.showArchivedSprint = action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getSprintsByProjectId.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getSprintsByProjectId.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.data && action.payload.data.length > 0) {
        state.sprints = { ...state.sprints, ...normalizedState("_id", action.payload.data) };
        state.sprintsByProjectId[action.payload.data[0].projectId] = action.payload.data.map(item => item._id);
      }
    });
    builder.addCase(createSprint.fulfilled, (state, action) => {
      const projectId = action.payload.data.projectId;
      const sprintId = action.payload.data._id;
      state.sprints[sprintId] = action.payload.data;
      state.sprintsByProjectId = {
        ...current(state.sprintsByProjectId),
        [projectId]: [...(current(state.sprintsByProjectId)[projectId] ?? []), sprintId]
      }
      state.key = current(state).key + 1;
    });

    builder.addCase(updateSprint.fulfilled, (state, action) => {
      state.sprints[action.payload.data._id] = action.payload.data
      state.currentSprint = action.payload.data;
      state.key = current(state).key + 1;

    });

    builder.addCase(deleteSprint.fulfilled, (state, action) => {
      const sprintId = action.payload.data._id
      state.currentSprint = null
      delete state.sprints[sprintId]
    });

  }
})
export const { setCurrentSprint, updateSprintSocket, createSprintSocket, loadListSprintByProjectId, setShowArchivedSprint } = sprintSlice.actions

export default sprintSlice.reducer;