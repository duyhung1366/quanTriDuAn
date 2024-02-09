import { Avatar, AvatarGroup, Box, MenuItem, Popover, TextField } from "@mui/material"
import BootstrapTooltip from "../CustomToolTip"
import { useTaskAssignment } from "../../hooks/useTaskAssignment";
import { useDispatch } from "react-redux";
import { TaskRole } from "../../../../common/constants";
import TaskAssignment from "../../../../common/models/task_assignment";
import { useAppSelector } from "../../redux/hooks";
import { mapTaskStatusLabel } from "../../config/MapContraint";
import Task from "../../../../common/models/task";
import { createAssignMemberFromTask, deleteAssignMemberFromTask } from "../../redux/slices/task.slice";
import { ClientTaskAssignment } from "../../types/ClientTaskAssignment";
import useProjectMember from "../../hooks/useProjectMember";
import { removeAccents } from "../unidecode";
import { useMemo, useState } from "react";
import AddMemIcon from "../icons/AddMemIcon";
import UserCustomIcon from "../icons/UserCustomIcon";
import User from "../../../../common/models/user";

interface IPropsAssignQuick {
    assigneesTask: TaskAssignment[],
    item: Task,
    taskIdTemporary: string,
    openListMemAssign: boolean,
    handleCloseListAssign: () => void,
    anchorElListMember: HTMLLIElement,
    assigneesGroupRef: any,
    assignButtonRef: any
}

const AssignUserQuick = (props: IPropsAssignQuick) => {
    const {
        assigneesTask,
        item,
        taskIdTemporary,
        openListMemAssign,
        handleCloseListAssign,
        anchorElListMember,
        assigneesGroupRef,
        assignButtonRef

    } = props;
    const dispatch = useDispatch();
    const auth = useAppSelector(state => state.authReducer)
    const users = useAppSelector(state => state.userReducer.mapUserData);
    const currentUser = auth.user
    const taskId = item._id;
    const projectId = item.projectId;
    const sprintId = item.sprintId;
    const taskStatus = item.status;
    const { handleCreateTaskAssignment, handleDeleteTaskAssignment, handleLoadTaskAssignmentById } = useTaskAssignment();
    const [searchByName, setSearchByName] = useState("")

    const handleAssign = (userId: string, discordId: string) => {
        const nameUserAssign = currentUser.name;
        const idUserAssign = currentUser._id;
        const nameStatusTask = mapTaskStatusLabel[item.status]

        const isAssigned = !!assigneesTask.find((e) => e.userId === userId && e.role === TaskRole.ASSIGNEE);
        if (isAssigned) {
            // Da assign
            handleDeleteTaskAssignment(taskId, userId, TaskRole.ASSIGNEE);
            dispatch(deleteAssignMemberFromTask({ taskId, role: TaskRole.ASSIGNEE, userId }))
            if (assigneesTask.length === 1) {
                handleCloseListAssign();
            }
            return;
        }
        // Chua assign
        handleCreateTaskAssignment(new ClientTaskAssignment({ taskId, userId, role: TaskRole.ASSIGNEE, projectId, sprintId, nameStatusTask, discordId, nameUserAssign, idUserAssign }));
        dispatch(createAssignMemberFromTask({ taskId, userId: userId, role: TaskRole.ASSIGNEE, projectId, sprintId }));
        if (assigneesTask.length < 1) handleCloseListAssign();
    }
    const getMembersProject = useProjectMember(projectId)

    const getListMembers = useMemo(() => {
        if (getMembersProject) {
            const dataMembers = getMembersProject.map(item => {
                return { ...item, ...(users[item?.userId] || {} as User) }
            })
            return dataMembers;
        }
    }, [getMembersProject])
    const listMembers = useMemo(() => {
        if (getListMembers.length > 0) {
            const filteredMembers = getListMembers.filter((s) => {
                const name = removeAccents(s?.name?.toLowerCase() ?? "");
                const search = removeAccents(searchByName?.toLowerCase() ?? "");
                return name && name.includes(search);
            });
            return filteredMembers;
        }
        return [];

    }, [getListMembers, searchByName])
    const userIdAssigneesTask = assigneesTask.map(item => item.userId)
    listMembers.sort((a, b) => {
        if (userIdAssigneesTask.includes(a.userId) && !userIdAssigneesTask.includes(b.userId)) {
            return -1
        } else if (!userIdAssigneesTask.includes(a.userId) && userIdAssigneesTask.includes(b.userId)) {
            return 1
        } else {
            return 0
        }
    })
    return (
        <>
            <Popover
                id={item._id}
                open={openListMemAssign && taskIdTemporary === item._id}
                anchorEl={anchorElListMember}
                onClose={handleCloseListAssign}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                onClick={(e) => { e.stopPropagation() }}
            >
                <Box sx={{ height: "400px", overflow: 'hidden' }}>
                    <Box sx={{ padding: '10px', height: "70px" }}>
                        <TextField
                            placeholder='Search by name'
                            fullWidth
                            onChange={(e) => setSearchByName(e.target.value)}
                        />
                    </Box>
                    <Box sx={{ height: "330px", overflowY: 'auto' }}>
                        {listMembers.length > 0 && listMembers.map((mem, i) => {
                            const filterMemAssigned = userIdAssigneesTask.includes(mem.userId)

                            return (
                                <div key={i}>
                                    <MenuItem
                                        key={mem.userId}
                                        onClick={() => handleAssign(mem.userId, mem.discordId)}
                                    >
                                        <Box
                                            sx={filterMemAssigned ? { border: '3px solid #5d4ab3', borderRadius: '25px', marginRight: '10px' } : { marginRight: '10px' }}>
                                            <Avatar src={mem.avatar} sx={{ border: '3px solid #fff' }} />
                                        </Box>
                                        <div style={filterMemAssigned ? { fontWeight: 600 } : null}>{mem.name}</div>
                                    </MenuItem>
                                </div>
                            )
                        })}
                    </Box>

                </Box>
            </Popover>
            {
                assigneesTask.length > 0
                    ? <AvatarGroup ref={assigneesGroupRef} max={3} classes={{ avatar: 'group-avatar-assignees' }}>
                        {
                            assigneesTask.map((a: any, i) => {
                                return (
                                    <BootstrapTooltip placement="top" title={a.name} key={i}>
                                        <Avatar key={i} sx={{ width: 23, height: 23 }} src={a.avatar} />
                                    </BootstrapTooltip>

                                )
                            })
                        }
                    </AvatarGroup>
                    : <BootstrapTooltip placement="top" title="Assign">
                        <button
                            ref={assignButtonRef}
                            className="btn-assign-mem-task"
                        >
                            <div className='icon-add-assign-task'><AddMemIcon /></div>
                            <div className='icon-user-assign-task'><UserCustomIcon /></div>
                        </button>
                    </BootstrapTooltip>
            }

        </>
    )

}
export default AssignUserQuick;