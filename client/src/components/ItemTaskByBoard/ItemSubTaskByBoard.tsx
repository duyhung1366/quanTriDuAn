import { Box, Tooltip } from "@mui/material";
import Task from "../../../../common/models/task";
import { ColorPriority, ColorStatus, mapColorStatus } from "../WorkSpace";
import AssignUserQuick from "./AssignUserQuick";
import React, { useState, useRef, MouseEvent } from "react"
import { useTaskAssignment } from "../../hooks/useTaskAssignment";
import { useProject } from "../../hooks/useProject";
import "./ItemTaskByBoard.scss"
import { FormattedDate } from "../ViewDueDate";
import PriorityIcon from "../icons/PriorityIcon";
import IconStar from "../icons/IconDifficuty";
import ProjectMember from "../../../../common/models/project_member";


interface ItemSubTaskProps {
    item?: Task
    onClickTask: (e: any, task: Task) => void
    hasMasterOrOwnerPermission: ProjectMember
}

const ItemSubTaskByBoard = (props: ItemSubTaskProps) => {
    const { item, onClickTask, hasMasterOrOwnerPermission } = props;
    const { taskAssignmentState } = useTaskAssignment();
    const { allUser } = useProject();
    const assigneesGroupRef = useRef<HTMLDivElement | null>(null);
    const assignButtonRef = useRef<HTMLButtonElement | null>(null);
    const assigneesBySprintId = taskAssignmentState.taskAssignmentBySprintId.map(item => {
        const findUser = allUser.find(user => user._id === item.userId);
        return { ...item, ...(findUser || {}) }
    })
    const [anchorElListMember, setAnchorElListMember] = useState<HTMLLIElement | null>(null);
    const [taskIdTemporary, setTaskIdTemporary] = React.useState("")

    const openListMemAssign = Boolean(anchorElListMember);

    const openListAssign = (evt: React.MouseEvent<HTMLLIElement>, taskId: string) => {
        setAnchorElListMember(evt.currentTarget)
        setTaskIdTemporary(taskId)
    }
    const handleCloseListAssign = () => {
        setAnchorElListMember(null);
    };
    const assigneesTask = assigneesBySprintId.filter((x) => x.taskId === item._id)
        .filter((ele, ind) =>
            ind === assigneesBySprintId.filter((i) => i.taskId === item._id).findIndex(x => x.userId === ele.userId)
        )
    const onClickItem = (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (assigneesGroupRef.current && assigneesGroupRef.current.contains(e.target as Node)) {
            openListAssign({ currentTarget: assigneesGroupRef.current } as any, item._id);
        } else if (assignButtonRef.current && assignButtonRef.current.contains(e.target as Node)) {
            openListAssign({ currentTarget: assignButtonRef.current } as any, item._id);
        } else if (!openListMemAssign) {
            onClickTask(e, item);
        }
    }
    return (
        <Box
            className="item-subtask-container"
            sx={{ borderLeft: `2px solid ${mapColorStatus[item.status]}` }}
            onClick={onClickItem}
        >
            <Box className="header-subtask">
                <Box className="task-name"> {item.name} </Box>
                <Box className="group-assignees-task">
                    <AssignUserQuick
                        assigneesTask={assigneesTask}
                        item={item}
                        taskIdTemporary={taskIdTemporary}
                        openListMemAssign={openListMemAssign}
                        handleCloseListAssign={handleCloseListAssign}
                        anchorElListMember={anchorElListMember}
                        assigneesGroupRef={assigneesGroupRef}
                        assignButtonRef={assignButtonRef}
                    />
                </Box>
            </Box>
            <Box className="body-subtask">
                <div className='task-deadline' >
                    <FormattedDate date={item.deadline} status={item.status} />
                </div>
                <div className="subtask-bottom">
                    <div className="task-assessment-container">
                        {
                            item?.priority?.toString()
                            && <Box
                                className="icon-priority-task-home"
                                sx={{
                                    svg: { width: "14px", height: '16px' },
                                    "path": { fill: `${ColorPriority.color[item.priority]}` }
                                }}
                            >
                                <PriorityIcon />
                            </Box>
                        }
                        {
                            item?.difficulty?.toString() && !!hasMasterOrOwnerPermission
                            && <Box
                                className="icon-difficulty-task-home"
                                sx={{
                                    svg: { width: "16px", height: '16px' },
                                    "path": { fill: `${ColorPriority.color[item.difficulty]}` }
                                }}
                            >
                                <IconStar />
                            </Box>
                        }
                        {
                            item.estimatePoints &&
                            <Tooltip title="Estimate Point" placement="top">
                                <div className="esstimate-point">{item.estimatePoints} </div>
                            </Tooltip>
                        }
                        {
                            item.reviewEstimatePoints &&
                            <Tooltip title="Review Point" placement="top">
                                <div className="review-point">{item.reviewEstimatePoints} </div>
                            </Tooltip>
                        }
                        {
                            item.testEstimatePoints &&
                            <Tooltip title="Test Point" placement="top">
                                <div className="test-point">{item.testEstimatePoints} </div>
                            </Tooltip>
                        }
                    </div>
                </div>
            </Box>
        </Box>
    )
}

export default ItemSubTaskByBoard;