import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Project from "../../../../common/models/project";
import { normalizedState } from "../../utils/normalizedState";
import { BaseAsyncThunk } from "./base.slice";


export type ProjectStateType = { [id: string]: Project };
export type MapColorProject = { [projectId: string]: string; }
export interface ProjectState {
  // store as map (key value)
  projects: ProjectStateType;
  loading: boolean;
  currentProject: Project | null;
  colorProject: MapColorProject;
}

const initialState: ProjectState = {
  projects: {},
  loading: true,
  currentProject: null,
  colorProject: {},
}

class ProjectAsyncThunk extends BaseAsyncThunk<Project> {
  constructor() {
    super("projects");
  }
  // TODO: Write new thunk here
}
const projectAsyncThunk = new ProjectAsyncThunk();
// action
export const getProjects = projectAsyncThunk.getAll;
export const createProject = projectAsyncThunk.create;
export const getProjectById = projectAsyncThunk.getById;
export const updateProject = projectAsyncThunk.update;
export const deleteProject = projectAsyncThunk.delete;


const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project>) => {
      state.currentProject = action.payload;
    },
    setMapColorProject: (state, action: PayloadAction<MapColorProject>) => {
      state.colorProject = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getProjects.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getProjects.fulfilled, (state, action) => {
      state.loading = false;
      state.projects = normalizedState<Project>("_id", action.payload.data);
    });
    builder.addCase(createProject.fulfilled, (state, action) => {
      state.projects[action.payload.data._id] = action.payload.data;
    });
    builder.addCase(getProjectById.fulfilled, (state, action) => {
      state.projects[action.payload.data._id] = action.payload.data;
      state.currentProject = action.payload.data;
    });
    builder.addCase(updateProject.fulfilled, (state, action) => {
      state.projects[action.payload.data._id] = action.payload.data;
      state.currentProject = action.payload.data;
    });
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      const data = Object.values(state.projects).filter((item: Project) => item._id !== action.payload.data._id)
      state.projects = normalizedState<Project>("_id", data);
      state.currentProject = <Project>{}

    });
  }
});

export const { setMapColorProject, setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;