
import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { normalizedState } from "../../utils/normalizedState";
import ProjectCheckList from "../../../../common/models/project_check_list";
import { BaseAsyncThunk } from "./base.slice";
import _ from "lodash";


export interface ProjectCheckListState {
    projectCheckList: { [projectCheckListId: string]: ProjectCheckList };
    mapLoadingProjectCheckList: {
        [id: string]: boolean;
    };
    loading: boolean;
    projectCheckListById: any[];
    currentBugItem: ProjectCheckList["items"][number] | null;
    searchStatusBugCheckList: number[],
    searchStatusCheckList: number[],

}


const initialState: ProjectCheckListState = {
    projectCheckList: {},
    mapLoadingProjectCheckList: {},
    loading: false,
    projectCheckListById: [],
    currentBugItem: null,
    searchStatusBugCheckList: [],
    searchStatusCheckList: [],
}

class ProjectCheckListAsyncThunk extends BaseAsyncThunk<ProjectCheckList> {
    constructor() {
        super("projectCheckList");
    }
    getProjectCheckListByParentId = createAsyncThunk(`${this.name}/getProjectCheckListByParentId`, async (projectCheckListById: string) => {
        const entities = await this.CRUDBase.getProjectCheckListByParentId(projectCheckListById);
        return entities;
    })

    deleteItemCheckList = createAsyncThunk(`${this.name}/deleteItemCheckList`, async (props: { projectCheckListId: string, itemId: string }) => {
        const entities = await this.CRUDBase.deleteItemCheckList(props.projectCheckListId, props.itemId);
        return entities;
    })

    updateItemCheckList = createAsyncThunk(`${this.name}/updateItemCheckList`, async (props: { projectCheckListId: string, itemId: string, data: any }) => {
        const entities = await this.CRUDBase.updateItemCheckList(props.projectCheckListId, props.itemId, props.data);
        return entities;
    })

}

const projectCheckListAsyncThunk = new ProjectCheckListAsyncThunk();


export const getProjectCheckListByParentId = projectCheckListAsyncThunk.getProjectCheckListByParentId;
export const createProjectCheckList = projectCheckListAsyncThunk.create;
export const deleteProjectCheckList = projectCheckListAsyncThunk.delete;
export const addItemCheckList = projectCheckListAsyncThunk.update;
export const deleteItemCheckList = projectCheckListAsyncThunk.deleteItemCheckList;
export const updateItemCheckList = projectCheckListAsyncThunk.updateItemCheckList;


const projectCheckListSlice = createSlice({
    name: 'projectCheckList',
    initialState,
    reducers: {
        setCurrentBugItem: (state, action) => {
            state.currentBugItem = action.payload
        },
        searchStatusBugCheckList: (state, action) => {
            const index = state.searchStatusBugCheckList.indexOf(action.payload)
            if (index == -1) {
                state.searchStatusBugCheckList.push(action.payload)
            }
            else {
                state.searchStatusBugCheckList.splice(index, 1)
            }
        },
        clearSearchStatusBugCheckList: (state, action) => {
            state.searchStatusBugCheckList.splice(0, 1000)
        },
        searchStatusCheckList: (state, action) => {
            const index = state.searchStatusCheckList.indexOf(action.payload)
            if (index == -1) {
                state.searchStatusCheckList.push(action.payload)
            }
            else {
                state.searchStatusCheckList.splice(index, 1)
            }
        },
        clearSearchStatusCheckList: (state, action) => {
            state.searchStatusCheckList.splice(0, 1000)
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getProjectCheckListByParentId.pending, (state, action) => {
            const id = action.meta.arg;
            state.loading = true;
            state.mapLoadingProjectCheckList[id] = true;
        });
        builder.addCase(getProjectCheckListByParentId.fulfilled, (state, action) => {
            const id = action.meta.arg;
            state.projectCheckListById = action.payload.data;
            state.mapLoadingProjectCheckList[id] = false;
        });

        builder.addCase(createProjectCheckList.fulfilled, (state, action) => {
            state.projectCheckList[action.payload.data._id] = action.payload.data;
            state.projectCheckListById = state.projectCheckListById.concat(action.payload.data)
        });

        builder.addCase(deleteProjectCheckList.fulfilled, (state, action) => {
            _.remove(state.projectCheckListById, (projectCheckList) => projectCheckList._id === action.payload.data._id);

        });

        builder.addCase(addItemCheckList.fulfilled, (state, action) => {
            const index = _.findIndex(state.projectCheckListById, { _id: action.payload.data._id });
            state.projectCheckListById.splice(index, 1, action.payload.data);
        });
        builder.addCase(deleteItemCheckList.fulfilled, (state, action) => {
            const index = _.findIndex(state.projectCheckListById, { _id: action.payload.data._id });
            state.projectCheckListById.splice(index, 1, action.payload.data);
        });

        builder.addCase(updateItemCheckList.fulfilled, (state, action) => {
            const index = _.findIndex(state.projectCheckListById, { _id: action.payload.data._id });
            state.projectCheckListById.splice(index, 1, action.payload.data);
        });
    },
})
export const { setCurrentBugItem, clearSearchStatusBugCheckList, clearSearchStatusCheckList, searchStatusBugCheckList, searchStatusCheckList } = projectCheckListSlice.actions;
export default projectCheckListSlice.reducer;
