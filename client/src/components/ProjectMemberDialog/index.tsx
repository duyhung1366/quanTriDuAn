import * as React from 'react';
import { Close, Delete } from "@mui/icons-material";
import { AppBar, Avatar, Button, Dialog, FormControl, IconButton, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Toolbar, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { PropsWithoutRef, useEffect, useMemo, useState } from "react";
import { ProjectRole } from "../../../../common/constants";
import Project from "../../../../common/models/project";
import { ICreateProjectMembersArgs } from "../../../../common/models/project_member";
import User from "../../../../common/models/user";
import { useProject } from "../../hooks/useProject";
import { useAppDispatch } from "../../redux/hooks";
import { DialogTransitionUp } from "../dialog/DialogTransitions";
import "./style.scss";
import { useForm } from 'react-hook-form';
import useProjectMember from "../../hooks/useProjectMember";
import { removeAccents } from '../unidecode';
const USER_MENU_HEIGHT = 80;
const USER_MENU_PD = 8;

export type FormValues = ICreateProjectMembersArgs;

const ProjectMemberDialog = (props: PropsWithoutRef<{
  open: boolean;
  onClose?: () => void;
  project: Project;
  checkPermission: boolean;
  checkPermissionOwner: boolean;
}>) => {
  const {
    open,
    onClose,
    project,
    checkPermission,
    checkPermissionOwner
  } = props;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [searchTableText, setSearchTableText] = useState("");
  const [searchEmailText, setSearchEmailText] = useState("");

  const dispatch = useAppDispatch();
  const {
    allUser,
    // membersProject,
    handleInviteMember,
    handleDeleteMember,
    // filterMembersProject
  } = useProject();
  const getMembersProject = useProjectMember(project._id)
  const filterMembersProject = useMemo(() => {
    if (getMembersProject) {
      const dataMembers = getMembersProject.map(item => {
        const findUser = allUser.find(user => user._id === item.userId);
        return { ...item, ...(findUser || {}) }
      })
      return dataMembers
    }
  }, [getMembersProject])
  // console.log("membersProject", filterMembersProject);

  const idUserInvitedProject = filterMembersProject.map((i) => i.userId)
  const serializedUsers = JSON.stringify(allUser);
  const userListSearch = useMemo(() => {
    const allUser: Array<User> = JSON.parse(serializedUsers);
    const userList = allUser.filter((user) => {
      const isProjectMember = !!getMembersProject.find((pm) => pm.projectId === project._id && pm.userId === user._id);
      return !isProjectMember;
    });
    return searchEmailText
      ? userList.filter((user) => removeAccents(user.email.toLowerCase()).includes(removeAccents(searchEmailText.toLowerCase())) || removeAccents(user.name.toLowerCase()).includes(removeAccents(searchEmailText.toLowerCase()))
        && !idUserInvitedProject.includes(user._id)) : userList.filter((user) => !idUserInvitedProject.includes(user._id));
  }, [searchEmailText, serializedUsers, filterMembersProject]);

  useProjectMember(project?._id);

  useEffect(() => {
    return () => {
      setSearchEmailText("");
    }
  }, []);
  //Thêm member trong project-members
  const handleAddMember = (data: FormValues) => {

    const inviteMemberArg: ICreateProjectMembersArgs = {
      projectId: project._id,
      userId: data.userId,
      role: data.role
    }
    handleInviteMember(inviteMemberArg);
    setSearchTableText("")
    setSearchEmailText("")
  }
  //Cập nhật role member trong project-members
  const onBlurUpdateRoleMember = (userId: string, role: number, projectId: string, newRole: number) => {
    if (newRole === role) {
      handleInviteMember({ projectId, userId, role })
    }
    else {
      handleInviteMember({ projectId, userId, role: newRole })
    }
  }
  //Xóa member trong project-members
  const handleDeleteMemberProject = (id: string) => {
    const findMemberDelete = getMembersProject.find(item => item.userId === id)
    handleDeleteMember(findMemberDelete._id)
  }
  return <Dialog
    open={open}
    onClose={onClose}
    fullScreen
    TransitionComponent={DialogTransitionUp}
    transitionDuration={600}
  >
    <AppBar className="app-bar-project-members" sx={{ display: "flex" }}>
      <Toolbar>
        <IconButton className='btn-close-memProject' edge="start" color="inherit" onClick={onClose} sx={{ position: "absolute", right: 0 }}><Close /></IconButton>
        <Typography className="app-bar-pm-project-name" variant="h5" component="div">{project.name}</Typography>
      </Toolbar>

    </AppBar>

    <Box display="flex" alignItems="center" mt="100px" >
      <Box>
        <TextField
          sx={{ ml: "100px", width: 500 }}
          label="Search by name or email"
          value={searchTableText}
          onChange={(e) => setSearchTableText(e.target.value)}
        />
      </Box>

      {checkPermission && <>
        <Box display="flex" alignItems="center">
          <form style={{ display: 'flex', alignItems: 'center' }} onSubmit={handleSubmit(handleAddMember)}>
            <FormControl sx={{ m: 1, width: 400, display: "flex", minWidth: '200px' }}>
              <InputLabel id="project-member-label" >Add by Email</InputLabel>
              <Select
                className="select-all-user"
                labelId="project-member-label"
                label="Add by Email"
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: USER_MENU_HEIGHT * 4.5 + USER_MENU_PD, width: "250px" }
                  },
                  autoFocus: false
                }}
                sx={{ width: "400px", display: "flex" }}
                {...register('userId')}
                error={!!errors.userId}
              >
                <TextField
                  sx={{ width: "100%", mb: "20px", p: "10px" }}
                  placeholder="Search by Email"
                  onChange={(e) => setSearchEmailText(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key !== "escape") e.stopPropagation();
                  }}
                />
                {userListSearch.map((user) => <MenuItem
                  key={user._id}
                  value={user._id}
                  sx={{ display: "flex" }}
                >
                  <Avatar src={user.avatar} sx={{ mr: "15px" }} />
                  <div className="">
                    <div className="">{user.name}</div>
                    <div className="" style={{ fontSize: "13px" }}>{user.email}</div>
                  </div>
                </MenuItem>)}
              </Select>
            </FormControl>

            <FormControl>
              <Select
                sx={{ width: "200px" }}
                defaultValue={ProjectRole.SPRINT_MEMBER}
                {...register('role')}
                error={!!errors.role}
              >
                <MenuItem value={ProjectRole.OWNER}>Owner</MenuItem>
                <MenuItem value={ProjectRole.SPRINT_MASTER}>Sprint Master</MenuItem>
                <MenuItem value={ProjectRole.SPRINT_MEMBER}>Member</MenuItem>
              </Select>
            </FormControl>
            <Button type='submit'>Add Member</Button>
          </form>
        </Box>
      </>}
    </Box>
    <TableContainer className='container-table' sx={{ width: "94%", m: '0 auto', mt: '20px', mb: '20px', border: '1px solid #d9d9d9' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '25%' }}>Name</TableCell>
            <TableCell sx={{ width: '25%' }}>Email</TableCell>
            <TableCell sx={{ width: '15%' }}>Role</TableCell>
            <TableCell sx={{ width: '10%' }}>Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filterMembersProject.filter((item) => removeAccents(item.name?.toLowerCase()).includes(removeAccents(searchTableText)) || removeAccents(item.email)?.includes(removeAccents(searchTableText.toLowerCase()))).map((item => {
            return <TableRow key={item._id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Avatar src={item.avatar} sx={{ mr: "15px" }} />
                  <div className="">{item.name}</div>
                </div>
              </TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>
                <Select
                  sx={{ width: "200px" }}
                  defaultValue={ProjectRole[ProjectRole[item.role]]}
                  onBlur={(e) => onBlurUpdateRoleMember(item._id, item.role, item.projectId, +e.target.value)}
                  // TODO: onChange, onBlur          
                  // TODO: Read Only for non master or sprint member
                  disabled={!checkPermission}
                >
                  <MenuItem value={ProjectRole.OWNER}>Owner</MenuItem>
                  <MenuItem value={ProjectRole.SPRINT_MASTER}>Sprint Master</MenuItem>
                  <MenuItem value={ProjectRole.SPRINT_MEMBER}>Member</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                {/* TODO: delete */}
                <IconButton
                  onClick={() => handleDeleteMemberProject(item._id)}
                  disabled={!checkPermission}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          }))}
        </TableBody>
      </Table>
    </TableContainer>
  </Dialog>
}

export default ProjectMemberDialog;