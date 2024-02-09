import { unwrapResult } from "@reduxjs/toolkit";
import { useSnackbar } from "notistack";
import React from "react";
import { ProjectRole } from "../../../common/constants";
import Project, { ICreateProjectArgs, IDeleteProjectArgs, IEditProjectArgs } from "../../../common/models/project";
import ProjectMember, { ICreateProjectMembersArgs } from "../../../common/models/project_member";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createNewProject, deleteMember, inviteMember } from "../redux/slices/project-members.slice";
import { createProject, deleteProject, setCurrentProject, setMapColorProject, updateProject } from "../redux/slices/project.slice";
import { RootState } from "../redux/store";
import useProjectMember from "./useProjectMember";

interface IProjectProps {
  projectId?: string;
}

export const useProject = (props?: IProjectProps) => {
  const dispatch = useAppDispatch();

  const projectState = useAppSelector((state: RootState) => state.projectReducer);
  const allUser = useAppSelector((state: RootState) => state.userReducer.users)
  const membersProject = useAppSelector<ProjectMember[]>((state: RootState) => state.projectMemberReducer.projectMembers)
  const currentUser = useAppSelector((state: RootState) => state.authReducer.user);
  const userProjects = useAppSelector((state) => state.projectMemberReducer.userProjects);
  const checkedViewList = useAppSelector((state) => state.taskReducer.checkedViewList);
  const colorProjects = useAppSelector((state: RootState) => state.projectReducer.colorProject);

  const [openPopupCreate, setOpenPopupCreate] = React.useState(false);
  const [openPopupEdit, setOpenPopupEdit] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const projectId = props?.projectId;
  // console.log("projectId", projectId);

  const currentProject = projectState.projects[projectId];
  // const getProjectMembers = useProjectMember[projectId]
  const getMembersProject = useProjectMember(projectId)


  // React.useEffect(() => {

  // },[projectId])
  const filterMembersProject = membersProject.map(item => {
    const findUser = allUser.find(user => user._id === item.userId);
    return { ...item, ...(findUser || {}) }
  })
  const findCurrentUser = filterMembersProject.find(item => item.userId === currentUser._id);
  // console.log("filterMembersProject", filterMembersProject);

  const handleCreateProject = async (projectArg: ICreateProjectArgs) => {
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, 'e');
    try {
      const res = await dispatch(createProject(projectArg as Project)).unwrap();
      setOpenPopupCreate(false);
      const newColorProjects = {
        ...colorProjects,
        [res.data._id]: color
      }
      dispatch(setMapColorProject(newColorProjects))
      localStorage.setItem("projectColors", JSON.stringify({ ...colorProjects, [res.data._id]: color }));

      const newPrjMember = new ProjectMember({ projectId: res.data._id, userId: projectArg.ownerId, role: ProjectRole.OWNER })
      dispatch(createNewProject(newPrjMember))
      // enqueueSnackbar("Create project successfully!", { variant: "success", autoHideDuration: 2000 });
    } catch (error) {
      enqueueSnackbar("Project creation failed!", { variant: "error", autoHideDuration: 4000 });
      throw null;
    }
  }

  const handleUpdateProject = async (projectArg: IEditProjectArgs, projectId: string) => {
    try {
      await dispatch(updateProject({ id: projectId, data: projectArg }));
      setOpenPopupEdit(false);
      setOpenPopupCreate(false);
      // enqueueSnackbar("Update project successfully!", { variant: "success", autoHideDuration: 2000 });
    } catch (error) {
      // TODO: handle error to show message
      enqueueSnackbar("Update project failed!", { variant: "error", autoHideDuration: 4000 });
      throw null;
    }
  }

  const handleDeleteProject = async (projectArg: IDeleteProjectArgs, projectId: string) => {
    try {
      await dispatch(deleteProject(projectId));
      localStorage.setItem("projectColors", JSON.stringify({ ...colorProjects, [projectId]: undefined }))
    } catch (error) {
      enqueueSnackbar("Delete project failed!", { variant: "error", autoHideDuration: 4000 });
    }
  }
  const handleInviteMember = async (projectArg: ICreateProjectMembersArgs) => {
    try {
      await dispatch(inviteMember(projectArg));
    } catch (error) {
      enqueueSnackbar("Create/Update project member failed!", { variant: "error", autoHideDuration: 4000 });
      throw null;
    }
  }
  const handleDeleteMember = async (projectMemberId: string) => {
    try {
      await dispatch(deleteMember(projectMemberId));
    } catch (error) {
      enqueueSnackbar("Delete member project failed!", { variant: "error", autoHideDuration: 4000 });
      throw null;
    }
  }

  const getUserProject = (projectId: string) => userProjects.find((pm) => pm.projectId === projectId && pm.userId === currentUser?._id);
  const hasPermissionOnProject = (projectId: string, projectRoles: Array<ProjectRole> = []) => {
    const userProjectData = getUserProject(projectId);
    if (!userProjectData) return false;
    if (!projectRoles.length) return true;
    return projectRoles.includes(userProjectData.role);
  }

  return {
    openPopupCreate,
    setOpenPopupCreate,
    openPopupEdit,
    setOpenPopupEdit,
    projectState,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleInviteMember,
    handleDeleteMember,
    allUser,
    filterMembersProject,
    membersProject,
    findCurrentUser,
    colorProjects,
    currentUser,
    checkedViewList,
    currentProject,
    getUserProject,
    hasPermissionOnProject
  };
}