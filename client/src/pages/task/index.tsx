import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { ProjectRole } from "../../../../common/constants";
import Task from "../../../../common/models/task";
import { DetailTaskPopup } from "../../components/DetailTask/DetailTaskPopup";
import { isAdmin } from "../../config/admin-config";
import useProjectMember from "../../hooks/useProjectMember";
import { useTask } from '../../hooks/useTask';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setCurrentProject } from "../../redux/slices/project.slice";
import { getSprintsByProjectId, setCurrentSprint } from "../../redux/slices/sprint.slice";
import { getTaskById, getTasksByProjectId } from "../../redux/slices/task.slice";
import { getTaskAssignmentBySprintId } from "../../redux/slices/taskAssignment.slice";
import { RootState } from "../../redux/store";
import { ROUTER_PROJECT, ROUTER_SPRINT } from "../../utils/router";
import { useSocket } from '../../socketio/SocketIOProvider';



const TaskPage = () => {
    const [openDetailTaskPopup, setOpenDetailTaskPopup] = useState(false)
    const { taskId } = useParams();
    const currentTask = useAppSelector((state: RootState) => state.taskReducer.currentTask);
    const currentUser = useAppSelector((state: RootState) => state.authReducer.user);
    const userProjects = useAppSelector((state: RootState) => state.projectMemberReducer?.userProjects);
    const projectLoading = useAppSelector((state) => state.projectReducer.loading);
    const projects = useAppSelector((state) => state.projectReducer.projects);
    const currentProject = useAppSelector((state) => state.projectReducer.currentProject);
    const sprintLoading = useAppSelector(state => state.sprintReducer.loading);
    const currentSprint = useAppSelector(state => state.sprintReducer.currentSprint);
    const sprints = useAppSelector(state => state.sprintReducer.sprints);
    // const currentSprint = sprintState[sprintId]
    const navigate = useNavigate()
    const dispatch = useAppDispatch();
    const { handleUpdateTask } = useTask()
    // console.log("asg123", taskState.tasks);
    const { socket } = useSocket();
    const auth = useAppSelector(state => state.authReducer);

    // console.log("currentTask123", currentTask);
    const userTask = userProjects.find((pm) => pm.projectId === currentTask?.projectId && pm.userId === currentUser?._id);
    const checkPermissionTask = [ProjectRole.OWNER, ProjectRole.SPRINT_MASTER, ProjectRole.SPRINT_MEMBER].includes(userTask?.role) || isAdmin(currentUser);

    useProjectMember(currentTask?.projectId);

    useEffect(() => {
        if (taskId) {
            setOpenDetailTaskPopup(true)
            dispatch(getTaskById(taskId))
            // handleUpdateTask(taskId, { cancelTyping: true })
        }
    }, [taskId])

    useEffect(() => {
        socket?.emit('typing', { taskId, userId: auth?.user?._id, cancelTyping: true });
    }, [socket])

    useEffect(() => {
        if (!!currentTask) {
            dispatch(getTasksByProjectId(currentTask.projectId))
            dispatch(getSprintsByProjectId(currentTask.projectId))
        }
    }, [currentTask]);

    useEffect(() => {
        if (!!currentTask && !projectLoading && !currentProject) {
            const project = projects[currentTask.projectId];
            if (project) {
                dispatch(setCurrentProject(project));
            }
        }
    }, [currentTask, projectLoading]);

    useEffect(() => {
        if (!!currentTask && !sprintLoading && !currentSprint) {
            const sprint = sprints[currentTask.sprintId];
            if (sprint) {
                dispatch(setCurrentSprint(sprint));
                dispatch(getTaskAssignmentBySprintId(currentTask.sprintId));
            }
        }
    }, [currentTask, sprintLoading]);

    const handleClose = () => {
        navigate(`${ROUTER_PROJECT}/${currentTask.projectId}${ROUTER_SPRINT}/${currentTask.sprintId}`)
        setOpenDetailTaskPopup(false)
    }


    return (
        <div style={{ backgroundColor: 'black !important', width: "100vw", height: '100vh' }}>
            {
                checkPermissionTask
                    ? (currentTask !== null) && openDetailTaskPopup
                    &&
                    <DetailTaskPopup
                        open={openDetailTaskPopup}
                        handleClose={handleClose}
                        data={currentTask}
                        handleConfirmUpdateTask={(data: Task) => {
                            handleUpdateTask(currentTask._id, data)
                        }}
                    />
                    : <>Not Found</>
            }
        </div>
    )
}

export default TaskPage;