import * as React from 'react';
import { TextField } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Popover from "@mui/material/Popover";
import { useEffect, useState } from 'react';
import { TaskRole } from "../../../../common/constants";
import TaskAssignment from "../../../../common/models/task_assignment";
import User from '../../../../common/models/user';
import useProjectMember from '../../hooks/useProjectMember';
import { useTaskAssignment } from '../../hooks/useTaskAssignment';
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { createAssignMemberFromTask, deleteAssignMemberFromTask } from '../../redux/slices/task.slice';
import { RootState } from "../../redux/store";
import { removeAccents } from '../unidecode';
import { ClientTaskAssignment } from '../../types/ClientTaskAssignment';
import { mapTaskStatusLabel } from '../../config/MapContraint';

type TaskAssignmentWithDiscord = TaskAssignment & { discordId?: string; nameUserAssign?: string; };

const AssignMemberToTaskPopover = (props: {
  anchorElAssign?: HTMLLIElement,
  openAnchorElAssign: boolean,
  openListMembers: (event: React.MouseEvent<HTMLLIElement>, role: number) => void,
  checkRoleAssign: number,
  handleCloseListMembers: () => void,
  role: TaskRole
}) => {
  const {
    anchorElAssign,
    openAnchorElAssign,
    checkRoleAssign,
    handleCloseListMembers,
    role
  } = props;

  const taskState = useAppSelector((state: RootState) => state.taskReducer)
  const currentUser = useAppSelector(state => state.authReducer.user)
  const taskAssignmentState = useAppSelector((state: RootState) => state.taskAssignmentReducer);
  const { handleCreateTaskAssignment, handleDeleteTaskAssignment } = useTaskAssignment();
  const taskId = taskState?.currentTask?._id
  const projectId = window?.history?.state?.projectId ?? taskState?.currentTask?.projectId;
  const sprintId = window?.history?.state?.sprintId ?? taskState?.currentTask?.sprintId;
  const users = useAppSelector((state: RootState) => state.userReducer.mapUserData);
  const projectListMemberState = useAppSelector((state: RootState) => state.projectMemberReducer)
  const [searchByName, setSearchByName] = useState("")
  const dispatch = useAppDispatch()
  const getMembersProject = useProjectMember(projectId)

  const memAssigned = taskAssignmentState.taskAssignmentById.filter(item => item.role === checkRoleAssign).map(user => user.userId)
  const listMembers = React.useMemo(() => {
    if (getMembersProject) {
      const dataMembers = getMembersProject.map(item => {
        return { ...item, ...(users[item?.userId] || {} as User) }
      })
      return dataMembers
    }
  }, [getMembersProject])
  listMembers.sort((a, b) => {
    if (memAssigned.includes(a.userId) && !memAssigned.includes(b.userId)) {
      return -1
    } else if (!memAssigned.includes(a.userId) && memAssigned.includes(b.userId)) {
      return 1
    } else {
      return 0
    }
  })
  const mapListMembers = listMembers.filter((s) => removeAccents(s?.name?.toLowerCase())?.includes(removeAccents(searchByName.toLowerCase())))

  const handleAssign = (userId: string, discordId: string) => {
    const nameUserAssign = currentUser.name
    const idUserAssign = currentUser._id
    const nameStatusTask = mapTaskStatusLabel[taskState.currentTask.status]
    const user = taskAssignmentState.taskAssignmentById.find(e => e.userId === userId && e.role === role);
    if (user) {
      const userId = user.userId
      handleDeleteTaskAssignment(taskId, user.userId, role)
      dispatch(deleteAssignMemberFromTask({ taskId, role, userId }))
      return;
    }
    handleCreateTaskAssignment(new ClientTaskAssignment({ taskId, userId, role, projectId, sprintId, nameStatusTask, discordId, nameUserAssign, idUserAssign }));
    dispatch(createAssignMemberFromTask({ taskId, userId, role, projectId, sprintId }))
  }

  return (
    <Popover
      id={taskId}
      open={openAnchorElAssign && checkRoleAssign === role}
      anchorEl={anchorElAssign}
      onClose={() => {
        handleCloseListMembers();
        setSearchByName("")
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Box sx={{ height: "400px", overflow: 'hidden', width: '300px' }}>
        <Box sx={{ padding: '10px', height: "70px" }}>
          <TextField
            placeholder='Search by name'
            fullWidth
            onChange={(e) => setSearchByName(e.target.value)}
          />
        </Box>
        <Box sx={{ height: "330px", overflowY: 'auto' }}>
          {mapListMembers.map((mem, i) => {

            const filterMemAssigned = memAssigned.includes(mem.userId)
            return (
              <div key={i}>
                <MenuItem
                  key={mem._id}
                  onClick={() => handleAssign(mem._id, mem.discordId)}
                >
                  <Box sx={filterMemAssigned ? { border: '3px solid #5d4ab3', borderRadius: '25px', marginRight: '10px' } : { marginRight: '10px' }}>
                    <Avatar src={mem.avatar} sx={{ border: '3px solid #fff' }} />
                  </Box>
                  <div style={filterMemAssigned ? { fontWeight: 600 } : undefined}>{mem.name}</div>
                </MenuItem>
              </div>
            )
          })}
        </Box>
      </Box>
    </Popover>
  );
}

export default AssignMemberToTaskPopover;