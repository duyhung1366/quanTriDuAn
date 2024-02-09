
import { MoreHoriz } from "@mui/icons-material"
import AdjustIcon from '@mui/icons-material/Adjust'
import NotesIcon from '@mui/icons-material/Notes'
import { Avatar, AvatarGroup, Button, IconButton, MenuItem, Popover, TextField } from "@mui/material"
import ListItemButton from "@mui/material/ListItemButton"
import { Box } from "@mui/system"
import DOMPurify from 'dompurify'
import React, { MouseEvent, useRef } from "react"
import { Draggable } from "react-beautiful-dnd"
import { useDispatch } from "react-redux"
import { LoginCode, SprintStatus, TaskStatus } from "../../../../common/constants"
import { ProjectRole, TaskRole } from "../../../../common/constants"
import Task from "../../../../common/models/task"
import TaskAssignment from "../../../../common/models/task_assignment"
import User from "../../../../common/models/user"
import { mapTaskStatusLabel } from '../../config/MapContraint'
import useProjectMember from "../../hooks/useProjectMember"
import { useTask } from "../../hooks/useTask"
import { useTaskAssignment } from "../../hooks/useTaskAssignment"
import { useAppSelector } from "../../redux/hooks"
import { handleSelectTask, handleViewSubTask } from "../../redux/slices/task.slice"
import BootstrapTooltip from "../CustomToolTip"
import { HtmlTooltip } from "../ItemTaskByList"
import { FormattedDate } from "../ViewDueDate"
import { ColorPriority } from "../WorkSpace"
import ConfirmDialog from "../dialog/ConfirmDialog"
import AddMemIcon from "../icons/AddMemIcon"
import IconStar from "../icons/IconDifficuty"
import PriorityIcon from "../icons/PriorityIcon"
import UserCustomIcon from "../icons/UserCustomIcon"
import SelectTaskIcon from "../icons/SelectTaskIcon"
import classNames from 'classnames';
import SelectTaskCheckIcon from "../icons/SelectTaskCheckIcon"
import Tooltip from '@mui/material/Tooltip';
import "./ItemTaskByBoard.scss"
import ItemSubTask from "./ItemSubTaskByBoard"
import ItemSubTaskByBoard from "./ItemSubTaskByBoard"
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import AssignUserQuick from "./AssignUserQuick"
import AddIcon from '@mui/icons-material/Add';
interface IpropsTaskByBoard {
    item: Task,
    index: number,
    assignees: Array<TaskAssignment>,
    mapPriority: any,
    handleClickTask: (e: any, task: Task) => void,
    mapSubTask?: { [_id: string]: Task }
}

const ItemTaskByBoard = (props: IpropsTaskByBoard) => {
    const taskAssignmentState = useAppSelector(state => state.taskAssignmentReducer)
    const listTaskCloneOrMove = useAppSelector(state => state.taskReducer.listTaskCloneOrMove)
    const listTaskViewSubTask = useAppSelector(state => state.taskReducer.listTaskViewSubTask)
    const auth = useAppSelector(state => state.authReducer)
    const currentUser = auth.user
    const dispatch = useDispatch();
    const [anchorElTask, setAnchorElTask] = React.useState<HTMLLIElement | null>(null);
    const [anchorElListMember, setAnchorElListMember] = React.useState<HTMLLIElement | null>(null);
    const [dataSubTasks, setDataSubTasks] = React.useState<Array<Task>>([]);
    const [taskIdTemporary, setTaskIdTemporary] = React.useState("")
    const [nameNewSubTask, setNameNewSubTask] = React.useState("")
    const [disabledAddSubTask, setDisabledAddSubTask] = React.useState(false);
    const [isHoverBtnSubTask, setIsHoverBtnSubTask] = React.useState(false);
    const [isHoverTaskByBoard, setIsHoverTaskByBoard] = React.useState(false);
    const [checkRename, setCheckRename] = React.useState<boolean>(false);
    const [inputRef, setInputRef] = React.useState<HTMLInputElement>(null);
    const item = props.item;
    const projectId = item.projectId;
    const sprintId = item.sprintId;
    const { handleUpdateTask, handleDeleteTask, handleCreateNewTask } = useTask();
    const { handleLoadTaskAssignmentById } = useTaskAssignment();
    const assigneesGroupRef = useRef<HTMLDivElement | null>(null);
    const assignButtonRef = useRef<HTMLButtonElement | null>(null);
    const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
    const currentSprint = useAppSelector(state => state.sprintReducer.currentSprint)

    const getMembersProject = useProjectMember(projectId)

    const hasMasterOrOwnerPermission = (getMembersProject.find(e => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id))
    React.useMemo(() => {
        if (props.mapSubTask) {
            const arraySubTasks = Object.entries(props.mapSubTask).map(([subTaskId, subTask]) => ({
                id: subTaskId,
                ...subTask,
            }));

            setDataSubTasks(arraySubTasks);
        }
    }, [props.mapSubTask]);
    React.useEffect(() => {
        handleLoadTaskAssignmentById(taskIdTemporary)
    }, [taskIdTemporary])
    React.useEffect(() => {
        if (inputRef) {
            inputRef.focus({ preventScroll: true });
        }
    }, [inputRef]);

    const openSettingsTask = Boolean(anchorElTask);
    const handleCloseSettingsTask = () => {
        setAnchorElTask(null);
        setTaskIdTemporary("");
    };
    const openListMemAssign = Boolean(anchorElListMember);

    const openListAssign = (evt: React.MouseEvent<HTMLLIElement>, taskId: string) => {
        setAnchorElListMember(evt.currentTarget)
        setTaskIdTemporary(taskId)
    }
    const handleCloseListAssign = () => {
        setAnchorElListMember(null);
    };
    //Xử lý chuột trái chuột phải vào button settings của task by board
    const handleClickSettingTask = (evt: React.MouseEvent<HTMLLIElement>) => {
        if (evt.type === "click") {
            evt.preventDefault();
            evt.stopPropagation();
            setAnchorElTask(evt.currentTarget)
        }
        else if (evt.type === "contextmenu") {
            evt.preventDefault();
            evt.stopPropagation();
            setAnchorElTask(evt.currentTarget)
        }
    }
    //Lấy ra assignees của task
    const assigneesTask = props.assignees.filter((x) => x.taskId === item._id)
        .filter((ele, ind) =>
            ind === props.assignees.filter((i) => i.taskId === item._id).findIndex(x => x.userId === ele.userId)
        )


    const onClickItem = (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (assigneesGroupRef.current && assigneesGroupRef.current.contains(e.target as Node)) {
            openListAssign({ currentTarget: assigneesGroupRef.current } as any, item._id);
        } else if (assignButtonRef.current && assignButtonRef.current.contains(e.target as Node)) {
            openListAssign({ currentTarget: assignButtonRef.current } as any, item._id);
        } else if (!openListMemAssign) {
            props.handleClickTask(e, item);
        }
    }
    const onClickShowSubTask = (e) => {
        e.stopPropagation();
        dispatch(handleViewSubTask(item._id))
    }
    const handleCancleCreateSubTask = (e) => {
        e.stopPropagation();
        dataSubTasks.pop()
        setDataSubTasks(dataSubTasks)
        setDisabledAddSubTask(false)
    }
    const handleOpenCreateSubTask = (e) => {
        e.stopPropagation();
        setDataSubTasks([...dataSubTasks, new Task()])
        setDisabledAddSubTask(true)
        if (!listTaskViewSubTask.includes(item._id)) {
            dispatch(handleViewSubTask(item._id))
        }

    }
    const handleCreateSubTask = (e) => {
        e.stopPropagation();
        const data = new Task({
            name: nameNewSubTask,
            projectId: projectId,
            sprintId: sprintId,
            parentTaskId: item._id,
            status: TaskStatus.OPEN,
            userId: currentUser._id
        })
        handleCreateNewTask(data)
        setDisabledAddSubTask(false)
        setNameNewSubTask("")
    }
    const onMouseEnterBtnSubTask = () => {
        setIsHoverBtnSubTask(true)
    }
    const onMouseLeaveBtnSubTask = () => {
        setIsHoverBtnSubTask(false)
    }
    return (
        <Draggable
            draggableId={item._id}
            key={item._id}
            index={props.index}>
            {(providedRow, snapshotRow) => (
                <Box
                    sx={{
                        "& .task-heading": {
                            position: "relative"
                        },
                        "& .task-archived-overlay": {
                            position: "absolute",
                            zIndex: 10,
                            width: "100%", height: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            borderRadius: "10px",
                            cursor: "default !important"
                        },
                        fontStyle: item.isArchived ? "italic !important" : undefined
                    }}
                >
                    <div
                        ref={providedRow.innerRef}
                        {...providedRow.draggableProps}
                        {...providedRow.dragHandleProps}
                        onClick={onClickItem}
                        onMouseEnter={() => { if (item.isArchived) return; setIsHoverTaskByBoard(true) }}
                        onMouseLeave={() => { if (item.isArchived) return; setIsHoverTaskByBoard(false) }}
                        className={classNames("task-container", listTaskViewSubTask.includes(item._id) ? "has-subtask" : "")}
                    >
                        <div className="task-heading">
                            {item.isArchived && <div className="task-archived-overlay" />}
                            {/* <div style={{ color: `${ColorPriority.color[item.priority]}`, background: `${ColorPriority.background[item.priority]}`, fontSize: '12px', padding: '5px 8px 5px 8px', borderRadius: '6px' }} className="task-heading-priority" >
                                {Object.keys(props.mapPriority)[item.priority]}
                            </div> */}
                            <div className='task-name' >
                                {item.name}
                                {
                                    item.description
                                        ? <HtmlTooltip
                                            onClick={(e) => { e.stopPropagation() }}
                                            // classes={{ popper: "new" }}
                                            title={
                                                <div onClick={(e) => { e.stopPropagation() }}
                                                    className="view-des-task-mini">
                                                    <div
                                                        onClick={(e) => { e.stopPropagation() }}
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item?.description) }}

                                                    />
                                                </div>
                                            }
                                        >
                                            <IconButton
                                                onClick={(e) => { e.preventDefault(), e.stopPropagation() }}
                                                sx={{ ":hover": { borderRadius: '5px' }, width: '20px', height: '20px', marginLeft: '5px' }}><NotesIcon sx={{ fontSize: '15px' }} /></IconButton>
                                        </HtmlTooltip>
                                        : null
                                }</div>
                            <div className="group-assignees-task">
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
                            </div>

                        </div>
                        <div style={{ width: '100%', height: '100%' }}>
                            <div className="task-body">
                                {
                                    dataSubTasks.length > 0
                                        ? <div className="group-button-subtask" onClick={(e) => { e.stopPropagation() }} onMouseEnter={onMouseEnterBtnSubTask} onMouseLeave={onMouseLeaveBtnSubTask}>
                                            <div className="btn-view-subtask" onClick={onClickShowSubTask}>
                                                <ShareOutlinedIcon color="action" className="icon-sub-task" />
                                                <div className="sub-task-count">{dataSubTasks.length > 0 && dataSubTasks.length}</div>
                                            </div>
                                            {
                                                isHoverBtnSubTask
                                                && <BootstrapTooltip placement="top" title="Create subtask">
                                                    <button className="btn-create-subtask" onClick={handleOpenCreateSubTask} disabled={disabledAddSubTask}>
                                                        <AddIcon className="icon-create-subtask" color="action" />
                                                    </button>
                                                </BootstrapTooltip>
                                            }
                                        </div>
                                        : isHoverTaskByBoard &&
                                        <BootstrapTooltip placement="top" title="Create subtask">
                                            <div className="btn-create-new-subtask" onClick={handleOpenCreateSubTask}>
                                                <ShareOutlinedIcon color="action" className="icon-subtask" />
                                                <AddIcon className="icon-create-new-subtask" color="action" />
                                            </div>
                                        </BootstrapTooltip>


                                }
                                <div className='task-deadline' >
                                    <FormattedDate date={item.deadline} status={item.status} />
                                </div>
                            </div>
                            {/* <Divider /> */}
                            <div className='task-footer' >
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
                                        && <BootstrapTooltip placement="top" title="Priority">
                                            <Box
                                                className="icon-difficulty-task-home"
                                                sx={{
                                                    svg: { width: "16px", height: '16px' },
                                                    "path": { fill: `${ColorPriority.color[item.difficulty]}` }
                                                }}
                                            >
                                                <IconStar />
                                            </Box>
                                        </BootstrapTooltip>
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

                                <Popover
                                    id={item._id}
                                    open={openSettingsTask}
                                    anchorEl={anchorElTask}
                                    onClose={handleCloseSettingsTask}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'center',
                                        horizontal: 'left',
                                    }}
                                    onClick={(e) => { e.stopPropagation() }}
                                >
                                    <Box>
                                        <ListItemButton
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setOpenConfirmDelete(true)
                                            }}
                                            disabled={
                                                ((item.userId !== auth.user._id) && !hasMasterOrOwnerPermission)
                                                ||
                                                (!hasMasterOrOwnerPermission && currentSprint.status === SprintStatus.ARCHIVED)
                                                ||
                                                (listTaskCloneOrMove.length > 0)
                                            }
                                        >
                                            Remove
                                        </ListItemButton>
                                    </Box>
                                </Popover>
                                {(hasMasterOrOwnerPermission || (item.userId === auth.user._id)) &&
                                    <ConfirmDialog
                                        open={openConfirmDelete}
                                        title="Confirm Delete?"
                                        content={<>Are you sure to delete task <b>{item?.name}?</b></>}
                                        onClose={(e) => {
                                            e.stopPropagation()
                                            setOpenConfirmDelete(false)
                                            setAnchorElTask(null);
                                            setTaskIdTemporary("");
                                        }}
                                        onConfirm={(e) => {
                                            e.stopPropagation()
                                            handleDeleteTask(item._id)
                                        }}
                                    />}
                                <BootstrapTooltip placement="top" title="More options">
                                    <IconButton
                                        disableRipple
                                        onClick={(e: any) => handleClickSettingTask(e)}
                                        className="btn-settings-task-item"
                                    >
                                        <MoreHoriz className="icon-settings-task-item" />
                                    </IconButton>
                                </BootstrapTooltip>

                                <BootstrapTooltip placement="top" title="Select task">
                                    <IconButton
                                        disableRipple
                                        disabled={!hasMasterOrOwnerPermission && currentSprint.status === SprintStatus.ARCHIVED}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(handleSelectTask(item._id))
                                        }}
                                    >
                                        {
                                            listTaskCloneOrMove?.includes(item._id) ? (<SelectTaskCheckIcon />) : (<SelectTaskIcon />)
                                        }
                                    </IconButton>
                                </BootstrapTooltip>
                                {/* {
                                    openCloneTask &&
                                    <CloneOrMoveTaskPopup
                                        open={openCloneTask}
                                        handleClose={() => {
                                            setOpenCloneTask(false)
                                        }}
                                        title="Do you want copy task to sprint ?"
                                        clone={true}
                                    />
                                }

                                {
                                    openMoveTask &&
                                    <CloneOrMoveTaskPopup
                                        open={openMoveTask}
                                        handleClose={() => {
                                            setOpenMoveTask(false)
                                        }}
                                        title="Do you want move task to sprint ?"
                                    /> */}
                                {/* } */}
                            </div>
                            <div className="group-sub-task-by-board" >
                                {
                                    listTaskViewSubTask.includes(item._id)
                                    && dataSubTasks.length > 0 &&
                                    dataSubTasks.map(item => {
                                        if (!item._id) {
                                            return <div
                                                className='form-subtask-item-addnew'
                                                onClick={(e) => { e.stopPropagation() }}
                                            >
                                                <div className='subtask-item-add-body'>
                                                    <TextField
                                                        placeholder="SubTask name"
                                                        className="input-new-task-board"
                                                        variant="standard"
                                                        autoFocus
                                                        fullWidth
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === "Enter") {
                                                                handleCreateSubTask(e)
                                                            }
                                                        }}
                                                        onChange={(e) => setNameNewSubTask(e.currentTarget.value)}
                                                    />
                                                    <Box width={"100%"} display="flex" justifyContent={"flex-end"}>
                                                        <Button onClick={handleCancleCreateSubTask}>Cancel</Button>
                                                        <Button onClick={handleCreateSubTask}>Create</Button>
                                                    </Box>
                                                </div>
                                            </div>

                                        }
                                        return (<>
                                            <ItemSubTask
                                                item={item}
                                                onClickTask={props.handleClickTask}
                                                hasMasterOrOwnerPermission={hasMasterOrOwnerPermission}
                                            />
                                        </>)
                                    })

                                }
                            </div>
                        </div>
                        {
                            listTaskViewSubTask.includes(item._id)
                            && dataSubTasks.length > 0 && !disabledAddSubTask
                            && <div className="footer-task-by-board">
                                <button className="btn-create-subtask-bottom" onClick={handleOpenCreateSubTask}>+ ADD SUBTASK</button>
                            </div>
                        }
                    </div>

                </Box>
            )
            }
        </Draggable >
    )
}

export default ItemTaskByBoard;