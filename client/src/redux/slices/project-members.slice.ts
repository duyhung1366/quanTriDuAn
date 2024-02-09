import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import ProjectMember from "../../../../common/models/project_member";
import { apiGetProjectMembers, apiGetUserProjects } from "../../apis/project.api";
import { BaseAsyncThunk } from "./base.slice";
export interface ProjectMembersState {
    loading: boolean;
    projectMembers: Array<ProjectMember>;
    userProjectLoading: boolean;
    userProjects: Array<ProjectMember>;
    mapProjectMember: {
        [projectId: string]: {
            loading: boolean;
            loaded: boolean;
            data: Array<ProjectMember>;
        }
    };
    key: number
}
const initialState: ProjectMembersState = {
    loading: false,
    projectMembers: [],
    userProjectLoading: true,
    userProjects: [],
    mapProjectMember: {},
    key: 0
}
class MembersAsyncThunk extends BaseAsyncThunk<ProjectMember>{
    constructor() {
        super("project-members");
    }
    getProjectMembers = createAsyncThunk(`${this.name}/getMembersProject`, async (id: string) => {
        const members = await apiGetProjectMembers({ projectId: id });
        return members;
    });
    inviteMember = createAsyncThunk(`${this.name}/create`, async (data: any) => {
        const res = await this.CRUDBase.create(data);
        return res;
    });
    deleteMember = createAsyncThunk(`${this.name}/delete`, async (id: string) => {
        const response = await this.CRUDBase.delete(id);
        return response;
    });
    getUserProjects = createAsyncThunk("projects/getUserProjects", async () => {
        const data = await apiGetUserProjects();
        return data;
    });
}
const membersAsyncThunk = new MembersAsyncThunk();

export const getProjectMember = membersAsyncThunk.getProjectMembers;
export const inviteMember = membersAsyncThunk.inviteMember;
export const deleteMember = membersAsyncThunk.deleteMember;
export const getUserProjects = membersAsyncThunk.getUserProjects;

const projectMembersSlice = createSlice({
    name: "project-members",
    initialState,
    reducers: {
        createNewProject: (state, action) => {
            state.userProjects.push(action.payload)
            state.projectMembers.push(action.payload)
        },


    },
    extraReducers: (builder) => {
        builder.addCase(getProjectMember.pending, (state, action) => {
            const projectId = action.meta.arg;
            state.loading = true;
            state.mapProjectMember[projectId] = {
                ...(state.mapProjectMember[projectId] || {}),
                loading: true,
                loaded: false,
                data: []
            }
        });
        builder.addCase(getProjectMember.fulfilled, (state, action) => {
            const projectId = action.meta.arg;
            state.loading = false;
            state.projectMembers = action.payload;
            state.mapProjectMember[projectId] = {
                ...(state.mapProjectMember[projectId] || {}),
                loading: false,
                loaded: true,
                data: action.payload
            };
        });
        builder.addCase(inviteMember.fulfilled, (state, action) => {
            if (action.payload.data) {
                const idx = current(state).mapProjectMember[action.payload.data.projectId].data.findIndex((e) => e._id === action.payload.data?._id);
                if (idx !== -1) {
                    // UPDATE
                    state.mapProjectMember[action.payload.data.projectId].data.splice(idx, 1, action.payload.data);
                    state.userProjects.splice(idx, 1, action.payload.data);
                } else {
                    // CREATE
                    state.mapProjectMember[action.payload.data.projectId].data.push(action.payload.data);
                    // state.userProjects.push(action.payload.data);
                }
            }
        });
        builder.addCase(deleteMember.fulfilled, (state, action) => {
            const dataRes = action.payload.data as any
            const dataAfterDeleteMember = state.mapProjectMember[action.payload.data.projectId].data.filter((item: ProjectMember) => item.userId !== dataRes.userId)
            state.mapProjectMember[action.payload.data.projectId].data = dataAfterDeleteMember
        });

        builder.addCase(getUserProjects.pending, (state) => {
            state.userProjectLoading = true;
        });
        builder.addCase(getUserProjects.fulfilled, (state, action) => {
            state.userProjects = action.payload;
            state.userProjectLoading = false;
        })

    }
})
export const { createNewProject } = projectMembersSlice.actions;

export default projectMembersSlice.reducer;