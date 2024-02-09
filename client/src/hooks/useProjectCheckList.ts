
import ProjectCheckList from "../../../common/models/project_check_list";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  addItemCheckList, createProjectCheckList, deleteItemCheckList, deleteProjectCheckList, getProjectCheckListByParentId, updateItemCheckList
} from "../redux/slices/projectCheckList.slice";

export const useProjectCheckList = () => {

  const dispatch = useAppDispatch();
  const mapLoadingProjectCheckList = useAppSelector((state) => state.projectCheckListReducer.mapLoadingProjectCheckList);

  const handleCreateProjectCheckList = async (projectCheckList: ProjectCheckList) => {
    try {
      await dispatch(createProjectCheckList(projectCheckList));
    } catch (error) {
      throw null;
    }
  }

  const handleLoadProjectCheckListById = (parentId: string) => {
    if (mapLoadingProjectCheckList[parentId]) return;
    dispatch(getProjectCheckListByParentId(parentId));
  }
  const handleDeleteProjectCheckList = async (id: string) => {
    try {
      await dispatch(deleteProjectCheckList(id));
    } catch (error) {
      throw null;
    }
  }
  const handleAddItemCheckList = async (id: string, data: any) => {
    try {
      const response = await dispatch(addItemCheckList({ id, data })).unwrap();
    } catch (error) {
      throw null;
    }
  }
  const handleDeleteItemCheckList = async (projectCheckListId: string, itemId: string) => {
    try {
      const response = await dispatch(deleteItemCheckList({ projectCheckListId, itemId })).unwrap();
    } catch (error) {
      throw null;
    }
  }

  const handleUpdateItemCheckList = async (projectCheckListId: string, itemId: string, data: any) => {
    try {
      const response = await dispatch(updateItemCheckList({ projectCheckListId, itemId, data })).unwrap();
    } catch (error) {
      throw null;
    }
  }



  return {
    handleCreateProjectCheckList, handleLoadProjectCheckListById,
    handleDeleteProjectCheckList, handleAddItemCheckList,
    handleDeleteItemCheckList, handleUpdateItemCheckList
  }

}