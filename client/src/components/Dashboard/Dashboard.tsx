import { Close } from "@mui/icons-material";
import { Avatar, AvatarGroup, Box, Dialog, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import moment from "moment";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { ProjectRole, TaskRole, TaskStatus } from "../../../../common/constants";
import Project from "../../../../common/models/project";
import Sprint from "../../../../common/models/sprint";
import Task from "../../../../common/models/task";
import User from "../../../../common/models/user";
import { isAdmin } from "../../config/admin-config";
import { useProject } from "../../hooks/useProject";
import { useTask } from "../../hooks/useTask";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { currentTaskActive, getAllTask, handleViewSubTaskDashBoard } from "../../redux/slices/task.slice";
import { TaskDashboard } from "../../types/ClientTask";
import { ROUTER_PROJECT, ROUTER_SPRINT, ROUTER_TASK } from "../../utils/router";
import BootstrapTooltip from "../CustomToolTip";
import { DetailTaskPopup } from "../DetailTask/DetailTaskPopup";
import { DialogTransitionUp } from "../dialog/DialogTransitions";
import CalenderDatePicker from "../icons/CalenderDatePicker";
import DueDatePicker from "../icons/DueDatePicker";
import IconStar from "../icons/IconDifficuty";
import PriorityIcon from "../icons/PriorityIcon";
import { removeAccents } from "../unidecode";
import { ColorPriority, ColorStatus } from "../WorkSpace";
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import "./dashboard.scss";
import classNames from "classnames";


type ToltalPoints = {
    estimatePoints: number;
    testEstimatePoints: number;
    reviewEstimatePoints: number;
    completedEstimatePoints: number;
    completedReviewPoints: number;
    completedTestPoints: number;
    mapProjectPoints: {
        [projectId: string]: {
            estimatePoints?: number;
            reviewEstimatePoints?: number;
            testEstimatePoints?: number;
        }
    }
}
type DataRender = { [status: string]: Array<TaskDashboard> };
const mapStatusTask = {
    [TaskStatus.OPEN]: "To Do",
    [TaskStatus.IN_PROGRESS]: "In Progress",
    [TaskStatus.BUG]: "Bug",
    [TaskStatus.REVIEW]: "Review",
    [TaskStatus.COMPLETE]: "Complete"
}
const roleToPointsMap = {
    [TaskRole.ASSIGNEE]: 'estimatePoints',
    [TaskRole.REVIEWER]: 'reviewEstimatePoints',
    [TaskRole.TESTER]: 'testEstimatePoints',
};

const mapPointFieldToCompletedDataField = {
    estimatePoints: "completedEstimatePoints",
    reviewEstimatePoints: "completedReviewPoints",
    testEstimatePoints: "completedTestPoints"
}

const calculatePoints = (tasks: TaskDashboard[], temporaryUser: string) => {
    const result = tasks.reduce((acc, task) => {
        const processItem = (item) => {
            const assignedItems = item.taskAssignments.filter(item => item.userId === temporaryUser);
            assignedItems.forEach(assignedItem => {
                const pointField = roleToPointsMap[assignedItem.role];
                if (pointField && item[pointField]) {
                    acc[pointField] += item[pointField];
                    const oldMapPointProjectData = acc.mapProjectPoints[task.projectId] || {};
                    acc.mapProjectPoints[task.projectId] = {
                        ...oldMapPointProjectData,
                        [pointField]: (oldMapPointProjectData[pointField] || 0) + item[pointField]
                    };
                    if (item.status === TaskStatus.COMPLETE) {
                        const key = mapPointFieldToCompletedDataField[pointField];
                        acc[key] += item[pointField];
                    }
                }
            });
        };
        processItem(task);
        task.subTasks.forEach(processItem);
        return acc;
    }, {
        estimatePoints: 0,
        testEstimatePoints: 0,
        reviewEstimatePoints: 0,
        completedEstimatePoints: 0,
        completedReviewPoints: 0,
        completedTestPoints: 0,
        mapProjectPoints: {}
    });

    return result;
};

const Dashboard = () => {
    const { handleUpdateTask } = useTask();
    const { currentUser } = useProject();
    const today = useMemo(() => moment(), []);
    const firstDayOfWeek = useMemo(() => today.clone().startOf('week'), [today]);
    const lastDayOfWeek = useMemo(() => today.clone().endOf('week'), [today]);
    const allUser = useAppSelector(state => state.userReducer.users);
    const users = useAppSelector((state) => state.userReducer.mapUserData);
    const userProjects = useAppSelector((state) => state.projectMemberReducer.userProjects);
    const projectMemberState = useAppSelector(state => state.projectMemberReducer)
    const allTask = useAppSelector(state => state.taskReducer.allTask);
    const keyTask = useAppSelector(state => state.taskReducer.key);
    const keyAssignment = useAppSelector(state => state.taskAssignmentReducer.key);
    const projects = useAppSelector(state => state.projectReducer.projects);
    const idsShowSubTask = useAppSelector(state => state.taskReducer.idsViewSubTaskDashBoard);
    const currentTask = useAppSelector(state => state.taskReducer?.currentTask);
    const [searchUser, setSearchUser] = useState("");
    const [searchTaskByProject, setSearchTaskByProject] = useState("all");
    const [openDetailTaskPopup, setOpenDetailTaskPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User>(currentUser);
    const [data, setData] = useState<DataRender>({});
    const [fromDate, setFromDate] = useState<moment.Moment>(firstDayOfWeek);
    const [toDate, setToDate] = useState<moment.Moment>(lastDayOfWeek);
    const [toltalPointsUser, setToltalPointsUser] = useState<ToltalPoints>();
    const [sprintCurrentTask, setSprintCurrentTask] = useState<Pick<Sprint, "name">>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(getAllTask({
            from: fromDate.valueOf(),
            to: toDate.valueOf(),
            user_id: selectedUser?._id,
            project_ids: projectIdsTemporary
        }));

    }, [fromDate.valueOf(), toDate.valueOf(), keyTask, keyAssignment, selectedUser, searchTaskByProject]);

    const searchUserList = useMemo(() => {
        return searchUser
            ? allUser.filter(item => removeAccents(item.name.toLowerCase()).includes(removeAccents(searchUser.toLowerCase()))
                || removeAccents(item.email.toLowerCase()).includes(removeAccents(searchUser.toLowerCase()))
            )
            : allUser
    }, [searchUser])

    const projectList = useMemo(() => {
        const projectIds = userProjects.map((e) => e.projectId);
        return Object
            .keys(projects)
            .filter((projectId) => {
                if (isAdmin(currentUser)) return true;
                return projectIds.includes(projectId);
            })
            .map((e) => projects[e])
    }, [allTask, currentUser, projects])
    const arrayProjectId = projectList.map(item => item._id)

    const projectIdsTemporary = useMemo(() => {
        let projectIds: string[] = []
        if (searchTaskByProject && arrayProjectId.length > 0) {
            searchTaskByProject === "all" ? projectIds = arrayProjectId : projectIds = [searchTaskByProject]
        }
        return projectIds
    }, [searchTaskByProject, arrayProjectId])

    useEffect(() => {
        const dataTask = Object.values(allTask)
        const toltalPoints = calculatePoints(dataTask, selectedUser?._id)
        setToltalPointsUser(toltalPoints)
        const newTasksByStatus = {
            "To Do": dataTask.filter(task => task.status === TaskStatus.OPEN),
            "In Progress": dataTask.filter(task => task.status === TaskStatus.IN_PROGRESS),
            "Bug": dataTask.filter(task => task.status === TaskStatus.BUG),
            "Review": dataTask.filter(task => task.status === TaskStatus.REVIEW),
            "Complete": dataTask.filter(task => task.status === TaskStatus.COMPLETE)
        };
        setData(newTasksByStatus)
    }, [allTask, selectedUser, fromDate, toDate, searchTaskByProject])

    const handleChangeFromDate = (newValue: any) => {
        setFromDate(moment(newValue.$d))
    }
    const handleChangeToDate = (newValue: any) => {
        setToDate(moment(newValue.$d))
    }
    const handleShowSubTask = (e, taskId: string) => {
        e.stopPropagation()
        dispatch(handleViewSubTaskDashBoard(taskId))

    }
    const handleClickTask = (event: any, task: TaskDashboard) => {
        if (event.type === "click") {
            setOpenDetailTaskPopup(true)
            setSprintCurrentTask(task.sprint)
            dispatch(currentTaskActive(task));
            window.history.pushState({ projectId: task.projectId, sprintId: task.sprintId }, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_TASK}/${task._id}`);
        }
        else if (event.type === "contextmenu") {
            // setAnchorEl(event.currentTarget);
        }
    }
    const handleCloseTaskDetail = () => {
        const { projectId, sprintId } = window.history.state;
        window.history.pushState(null, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_PROJECT}/${projectId}${ROUTER_SPRINT}/${sprintId}`);
        setOpenDetailTaskPopup(false);
    }

    return (
        <Box
            className="paper-dialog-dashboard-container"
        >

            <Box className="app-bar-dashboard">
                <Box sx={{ fontSize: '16px', fontWeight: '500', marginLeft: '20px' }}>From</Box>
                <Box>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            className="date-picker-dashboard"
                            value={fromDate}
                            inputFormat="DD/MM/YYYY"
                            components={{
                                OpenPickerIcon: CalenderDatePicker
                            }}
                            InputProps={{
                                style: {
                                    height: '45px',
                                },
                            }}
                            onChange={handleChangeFromDate}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ fontSize: '16px', fontWeight: '500' }}>To</Box>
                <Box>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            className="date-picker-dashboard"
                            value={toDate}
                            inputFormat="DD/MM/YYYY"
                            components={{
                                OpenPickerIcon: DueDatePicker,
                            }}
                            InputProps={{
                                style: {
                                    height: '45px',
                                },
                            }}
                            onChange={handleChangeToDate}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ marginLeft: "auto", mr: "10px" }}>
                    <FormControl fullWidth>
                        <InputLabel id="select-project" >Project</InputLabel>
                        <Select
                            className="select-list-user-dashboard"
                            labelId="select-project"
                            label="Project"
                            value={searchTaskByProject}
                            MenuProps={{
                                classes: {
                                    paper: "dropdown-list-user-dashboard",
                                    // list:""
                                },
                                autoFocus: false
                            }}

                        >
                            <MenuItem value="all" onClick={() => setSearchTaskByProject("all")}>
                                <Box className="info-user-dashboard">
                                    --Tất cả--
                                </Box>
                            </MenuItem>
                            {projectList.map((project) => {
                                const projectId = project._id;
                                return (
                                    <MenuItem
                                        key={projectId}
                                        value={projectId}
                                        onClick={() => {
                                            setSearchTaskByProject(projectId)
                                        }}
                                    >
                                        <Box className="info-user-dashboard">
                                            {project?.name}
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </Box>
                {/* <Box sx={{ marginLeft: "auto", marginRight: '10px' }}>
                    <TextField
                        className="textfield-search-task-by-project"
                        label="Search task by project"
                        onChange={(e) => setSearchTaskByProject(e.target.value)}
                    />
                </Box> */}
                <Box sx={{ marginRight: '30px' }}>
                    <FormControl fullWidth>
                        <InputLabel id="select-user" >User</InputLabel>
                        <Select
                            className="select-list-user-dashboard"
                            labelId="select-project"
                            label="User"
                            value={selectedUser?._id}
                            disabled={!(isAdmin(currentUser) || userProjects.some((pm) => pm.role !== ProjectRole.SPRINT_MEMBER))}
                            classes={{

                            }}
                            MenuProps={{
                                classes: {
                                    paper: "dropdown-list-user-dashboard",
                                },
                                autoFocus: false
                            }}

                        >
                            <Box className="textfield-search-user-dashboard">
                                <TextField
                                    className="textfield-search-user"
                                    fullWidth
                                    onKeyDown={(e) => {
                                        if (e.key !== "escape") e.stopPropagation();
                                    }}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    placeholder="Filter User by name"
                                />
                            </Box>
                            {searchUserList.map((user) => {
                                return (
                                    <MenuItem
                                        key={user._id}
                                        value={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        classes={{ root: "" }}
                                    >
                                        <Box className="info-user-dashboard">
                                            <Avatar src={user.avatar} className="avatar-user-dashboard" />
                                            <Box>
                                                <Box className="name-user-dashboard">{user.name}</Box>
                                                <Box className="email-user-dashboard">{user.email}</Box>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </Box>
            </Box>
            <Box className="dialog-content-dashboard">
                <Box className="Toltal-point-dashboard">
                    <TableContainer className='container-table' sx={{ width: "100%", m: '0 auto', mt: '20px', mb: '20px', border: '1px solid #d9d9d9' }}>
                        <Table sx={{ minWidth: "100%", background: '#fff' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" sx={{ width: '25%', fontWeight: '600', borderRight: "1px solid #ccc" }} rowSpan={2}>Project</TableCell>
                                    <TableCell align="center" sx={{ width: '25%', fontWeight: '600' }}>Total Estimate Points </TableCell>
                                    <TableCell align="center" sx={{ width: '25%', fontWeight: '600', borderLeft: '1px solid rgba(224, 224, 224, 1)', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Total Review Estimate Points </TableCell>
                                    <TableCell align="center" sx={{ width: '25%', fontWeight: '600' }}>Total Test Estimate Points </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" sx={{ width: '25%', color: toltalPointsUser?.completedEstimatePoints === toltalPointsUser?.estimatePoints ? "green" : "red" }}>
                                        {toltalPointsUser?.completedEstimatePoints} {`|`} <b>{toltalPointsUser?.estimatePoints}</b>
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        width: '25%', borderLeft: '1px solid rgba(224, 224, 224, 1)', borderRight: '1px solid rgba(224, 224, 224, 1)',
                                        color: toltalPointsUser?.completedReviewPoints === toltalPointsUser?.reviewEstimatePoints ? "green" : "red"
                                    }}>
                                        {toltalPointsUser?.completedReviewPoints} {`|`} <b>{toltalPointsUser?.reviewEstimatePoints}</b>
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        width: '25%',
                                        color: toltalPointsUser?.completedTestPoints === toltalPointsUser?.testEstimatePoints ? "green" : "red"
                                    }}>
                                        {toltalPointsUser?.completedTestPoints} {`|`} <b>{toltalPointsUser?.testEstimatePoints}</b>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {searchTaskByProject && searchTaskByProject === "all" && projectList.map((project) => {
                                    //     {searchTaskByProject && searchTaskByProject === "all" && <Box color="#000" borderTop="1px solid #ccc">
                                    //     <ul>
                                    //         {projectList.map((project, i) => {
                                    //             const point = toltalPointsUser?.mapProjectPoints[project._id]?.estimatePoints ?? 0;
                                    //             const percent = !!toltalPointsUser?.estimatePoints ? Math.round(point / toltalPointsUser?.estimatePoints) * 100 : 0;
                                    //             return <li key={i}>
                                    //                 {`${project.name}: ${point} (${percent}%)`}
                                    //             </li>
                                    //         })}
                                    //     </ul>
                                    // </Box>}
                                    const estimatePoints = toltalPointsUser?.mapProjectPoints[project._id]?.estimatePoints ?? 0;
                                    const estimatePercent = !!toltalPointsUser?.estimatePoints ? Math.round(100 * estimatePoints / toltalPointsUser?.estimatePoints) : 0;
                                    const reviewEstimatePoints = toltalPointsUser?.mapProjectPoints[project._id]?.reviewEstimatePoints ?? 0;
                                    const reviewEstimatePercent = !!toltalPointsUser?.reviewEstimatePoints ? Math.round(100 * reviewEstimatePoints / toltalPointsUser?.reviewEstimatePoints) : 0;
                                    const testEstimatePoints = toltalPointsUser?.mapProjectPoints[project._id]?.testEstimatePoints ?? 0;
                                    const testEstimatePercent = !!toltalPointsUser?.testEstimatePoints ? Math.round(100 * testEstimatePoints / toltalPointsUser?.testEstimatePoints) : 0;
                                    return <TableRow key={project._id}>
                                        <TableCell sx={{ borderRight: "1px solid #ccc" }}>{project.name}</TableCell>
                                        <TableCell sx={{ borderRight: "1px solid #ccc" }}>
                                            {`${estimatePoints} (${estimatePercent}%)`}
                                        </TableCell>
                                        <TableCell sx={{ borderRight: "1px solid #ccc" }}>
                                            {`${reviewEstimatePoints} (${reviewEstimatePercent}%)`}
                                        </TableCell>
                                        <TableCell>
                                            {`${testEstimatePoints} (${testEstimatePercent}%)`}
                                        </TableCell>
                                    </TableRow>
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Box >
                    {
                        Object.values(data)?.length === 0
                            ? <>No tasks yet</>
                            : Object.keys(data).map(status => {
                                if (data[status]?.length > 0) {
                                    return <Box className="dashboard-status-task-container" >
                                        <Box className="dashboard-title-status-task">
                                            <Box className="title-status-left">
                                                <Box className="name-status-task" sx={{ background: `${ColorStatus[status]}` }}>
                                                    {status.toUpperCase()}
                                                </Box>
                                                <Box className="tasks-count">{data[status].length} TASKS</Box>
                                            </Box>
                                            <Grid container spacing={3} className="title-status-right">
                                                <Grid xs md={2} className="title-status-right-text">ASSIGNEES</Grid>
                                                <Grid xs md={2} className="title-status-right-text">PRIORITY</Grid>
                                                <Grid xs md={2} className="title-status-right-text">POINT</Grid>
                                                <Grid xs md={6} className="title-name-project">PROJECT</Grid>
                                            </Grid>
                                        </Box>
                                        <Box className="dashboard-content">
                                            {data[status].map((task, index) => {
                                                if (!task) return null;
                                                return (
                                                    <Box>
                                                        <Box className="task-item-dashboard-container" key={task._id} onClick={(e) => handleClickTask(e, task)}>
                                                            {task.subTasks.length > 0
                                                                && <PlayArrowRoundedIcon
                                                                    color="action"
                                                                    className={classNames("icon-arrow-dropdown-subtask", idsShowSubTask.includes(task._id) ? "show-subtask" : "")}
                                                                    onClick={(e) => handleShowSubTask(e, task._id)}

                                                                />}

                                                            <Box className="task-item-dashboard-left">
                                                                <Box className="task-item-dashboard-status">
                                                                    <Box className="color-status-item-task" sx={{ background: `${ColorStatus[status]}` }} />
                                                                </Box>
                                                                <Box className="name-task-item-dashboard">
                                                                    {task.name}
                                                                </Box>
                                                                {
                                                                    task.subTasks.length > 0 && <Box className="btn-view-subtask-dashboard" onClick={(e) => handleShowSubTask(e, task._id)}>
                                                                        <ShareOutlinedIcon color="action" className="icon-sub-task-dashboard" />
                                                                        <div className="sub-task-dashboard-count">{task.subTasks.length > 0 && task.subTasks.length}</div>
                                                                    </Box>
                                                                }
                                                            </Box>
                                                            <Grid container spacing={4} className="task-item-dashboard-right">
                                                                <Grid xs md={2} className="group-assignee-task-dashboard">
                                                                    <AvatarGroup max={3} classes={{ avatar: 'avatar-group-task-dashboard' }}>
                                                                        {
                                                                            task.taskAssignments.map(item => {
                                                                                return (
                                                                                    <BootstrapTooltip placement="top" title={users[item.userId].name}>
                                                                                        <Avatar
                                                                                            sx={{ width: 25, height: 24 }}
                                                                                            src={users[item.userId].avatar}
                                                                                            className="item-assignee-task-dashboard"
                                                                                        />
                                                                                    </BootstrapTooltip>
                                                                                )
                                                                            })
                                                                        }
                                                                    </AvatarGroup>
                                                                </Grid>
                                                                <Grid xs md={2} className="group-priority-task-dashboard">
                                                                    {
                                                                        task?.priority?.toString()
                                                                        && <BootstrapTooltip placement="top" title="Priority">
                                                                            <Box
                                                                                className="icon-priority-task-dashboard"
                                                                                sx={{
                                                                                    svg: { width: "14px", height: '16px' },
                                                                                    "path": { fill: `${ColorPriority.color[task?.priority]}` }
                                                                                }}
                                                                            >
                                                                                <PriorityIcon />
                                                                            </Box>
                                                                        </BootstrapTooltip>
                                                                    }
                                                                    {
                                                                        isAdmin(currentUser)
                                                                        && task?.difficulty?.toString()
                                                                        && <BootstrapTooltip placement="top" title="Severity">
                                                                            <Box
                                                                                className="icon-priority-task-dashboard"
                                                                                sx={{
                                                                                    svg: { width: "16px", height: '16px' },
                                                                                    "path": { fill: `${ColorPriority.color[task?.difficulty]}` }
                                                                                }}
                                                                            >
                                                                                <IconStar />
                                                                            </Box>
                                                                        </BootstrapTooltip>
                                                                    }
                                                                </Grid>
                                                                <Grid xs md={2} className="point-project-task-dashboard">
                                                                    {
                                                                        task?.estimatePoints
                                                                        && <BootstrapTooltip placement="top" title="Estimate Point">
                                                                            <Box className="item-estimate">
                                                                                {task?.estimatePoints}
                                                                            </Box>
                                                                        </BootstrapTooltip>
                                                                    }
                                                                    {
                                                                        task?.reviewEstimatePoints
                                                                        && <BootstrapTooltip placement="top" title="Review Estimate Point">
                                                                            <Box className="item-review-estimate" >
                                                                                {task?.reviewEstimatePoints}
                                                                            </Box>
                                                                        </BootstrapTooltip>
                                                                    }
                                                                    {
                                                                        task?.testEstimatePoints
                                                                        && <BootstrapTooltip placement="top" title="Test Estimate Point">
                                                                            <Box className="item-test-estimate" >
                                                                                {task?.testEstimatePoints}
                                                                            </Box>
                                                                        </BootstrapTooltip>
                                                                    }
                                                                </Grid>
                                                                <Grid xs md={6} className="name-project-task-dashboard">
                                                                    {task.project.name}
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                        {
                                                            idsShowSubTask.includes(task._id)
                                                            && task.subTasks.map(subtask => {
                                                                return (
                                                                    <Box
                                                                        className="task-item-dashboard-container"
                                                                        key={subtask._id}
                                                                        onClick={(e) => handleClickTask(e, subtask)}
                                                                        style={{ borderTop: "1px solid #F5F5F5" }}
                                                                    >
                                                                        <Box className="task-item-dashboard-left" >
                                                                            <Box className="task-item-dashboard-status"
                                                                                style={{ paddingLeft: '20px' }}
                                                                            >
                                                                                <Box className="color-status-item-task" sx={{ background: `${ColorStatus[mapStatusTask[subtask.status]]}` }} />
                                                                            </Box>
                                                                            <Box className="name-task-item-dashboard">
                                                                                {subtask.name}
                                                                            </Box>
                                                                        </Box>
                                                                        <Grid container spacing={4} className="task-item-dashboard-right">
                                                                            <Grid xs md={2} className="group-assignee-task-dashboard">
                                                                                <AvatarGroup max={3} classes={{ avatar: 'avatar-group-task-dashboard' }}>
                                                                                    {
                                                                                        subtask.taskAssignments.map(item => {
                                                                                            return (
                                                                                                <BootstrapTooltip placement="top" title={users[item.userId].name}>
                                                                                                    <Avatar
                                                                                                        sx={{ width: 25, height: 24 }}
                                                                                                        src={users[item.userId].avatar}
                                                                                                        className="item-assignee-task-dashboard"
                                                                                                    />
                                                                                                </BootstrapTooltip>
                                                                                            )
                                                                                        })
                                                                                    }
                                                                                </AvatarGroup>
                                                                            </Grid>
                                                                            <Grid xs md={2} className="group-priority-task-dashboard">
                                                                                {
                                                                                    subtask?.priority?.toString()
                                                                                    && <BootstrapTooltip placement="top" title="Priority">
                                                                                        <Box
                                                                                            className="icon-priority-task-dashboard"
                                                                                            sx={{
                                                                                                svg: { width: "14px", height: '16px' },
                                                                                                "path": { fill: `${ColorPriority.color[subtask?.priority]}` }
                                                                                            }}
                                                                                        >
                                                                                            <PriorityIcon />
                                                                                        </Box>
                                                                                    </BootstrapTooltip>
                                                                                }
                                                                                {
                                                                                    isAdmin(currentUser)
                                                                                    && subtask?.difficulty?.toString()
                                                                                    && <BootstrapTooltip placement="top" title="Severity">
                                                                                        <Box
                                                                                            className="icon-priority-task-dashboard"
                                                                                            sx={{
                                                                                                svg: { width: "16px", height: '16px' },
                                                                                                "path": { fill: `${ColorPriority.color[subtask?.difficulty]}` }
                                                                                            }}
                                                                                        >
                                                                                            <IconStar />
                                                                                        </Box>
                                                                                    </BootstrapTooltip>
                                                                                }
                                                                            </Grid>
                                                                            <Grid xs md={2} className="point-project-task-dashboard">
                                                                                {
                                                                                    subtask?.estimatePoints
                                                                                    && <BootstrapTooltip placement="top" title="Estimate Point">
                                                                                        <Box className="item-estimate">
                                                                                            {subtask?.estimatePoints}
                                                                                        </Box>
                                                                                    </BootstrapTooltip>
                                                                                }
                                                                                {
                                                                                    subtask?.reviewEstimatePoints
                                                                                    && <BootstrapTooltip placement="top" title="Review Estimate Point">
                                                                                        <Box className="item-review-estimate" >
                                                                                            {subtask?.reviewEstimatePoints}
                                                                                        </Box>
                                                                                    </BootstrapTooltip>
                                                                                }
                                                                                {
                                                                                    subtask?.testEstimatePoints
                                                                                    && <BootstrapTooltip placement="top" title="Test Estimate Point">
                                                                                        <Box className="item-test-estimate" >
                                                                                            {subtask?.testEstimatePoints}
                                                                                        </Box>
                                                                                    </BootstrapTooltip>
                                                                                }
                                                                            </Grid>
                                                                            <Grid xs md={6} className="name-project-task-dashboard">
                                                                                {task.project.name}
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Box>
                                                                )
                                                            })

                                                        }
                                                    </Box>
                                                )
                                            })
                                            }
                                        </Box>

                                    </Box>
                                }
                            })
                    }
                    {!!currentTask && openDetailTaskPopup && <DetailTaskPopup
                        open={openDetailTaskPopup}
                        handleClose={handleCloseTaskDetail}
                        data={currentTask}
                        handleConfirmUpdateTask={(data: Task) => {
                            handleUpdateTask(currentTask?._id, data)
                        }}
                        isFromDashboard={true}
                        sprint={sprintCurrentTask}
                    />}
                </Box>
            </Box>
        </Box>
    )
}
export default Dashboard;





