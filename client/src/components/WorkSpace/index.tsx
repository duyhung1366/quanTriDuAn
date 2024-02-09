import { Add as AddIcon, MoreHoriz, Notes } from "@mui/icons-material";
import { Avatar, AvatarGroup, Box, Button, Grid, IconButton, Paper, Popover, TextField, Tooltip, tooltipClasses, TooltipProps } from "@mui/material";
import { styled } from '@mui/material/styles';
import _ from "lodash";
import { useSnackbar } from 'notistack';
import React, { Fragment, useState } from "react";
import { DragDropContext, Draggable, DraggableLocation, Droppable, DropResult } from 'react-beautiful-dnd';
import { EditTextarea } from "react-edit-text";
import { useMatch, useNavigate } from 'react-router-dom';
import { ProjectRole, TaskPriority, TaskStatus } from "../../../../common/constants";
import Sprint from "../../../../common/models/sprint";
import Task, { UpdatePositionTaskArgs } from "../../../../common/models/task";
import { isAdmin } from "../../config/admin-config";
import { useProject } from '../../hooks/useProject';
import { useSprint } from '../../hooks/useSprint';
import { useTask } from '../../hooks/useTask';
import { useTaskAssignment } from '../../hooks/useTaskAssignment';
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { currentTaskActive, updateTaskRealTime, updateTask, getSubTasksBySprintId } from '../../redux/slices/task.slice';
import { getTaskAssignmentBySprintId } from "../../redux/slices/taskAssignment.slice";
import { ROUTER_PROJECT, ROUTER_SPRINT, ROUTER_TASK } from "../../utils/router";
import BootstrapTooltip from "../CustomToolTip";
import { DetailTaskPopup } from "../DetailTask/DetailTaskPopup";
import FilterTaskByUser from "../FilterTaskByUser";
import IconAddTask from "../icons/IconAddTask";
import ItemTaskByBoard from "../ItemTaskByBoard";
import ItemTaskByList from "../ItemTaskByList";
import ManagerStatistical from "../ManagerStatistical";
import TaskItemPopup from "../TaskItemPopup";
import "./WorkSpace.scss";

import { mapTaskStatusLabel } from "../../config/MapContraint";


interface IProps {
  todo: Array<Task>;
  inprogress: Array<Task>;
  bug: Array<Task>;
  review: Array<Task>;
  complete: Array<Task>;
  onCreateNewTask?: (task: Task) => Promise<void>;
  onUpdateTask?: (taskId: string, task: Partial<Task>) => Promise<void>;
  onUpdatePositionTask?: (taskId: string, task: UpdatePositionTaskArgs) => Promise<void>;
  projectId?: string;
  sprintId?: string;
  sprintByProjectId?: Sprint[];
  isProjectPage?: boolean;
}

const statusMap = {
  "To Do": TaskStatus.OPEN,
  "In Progress": TaskStatus.IN_PROGRESS,
  "Bug": TaskStatus.BUG,
  "Review": TaskStatus.REVIEW,
  "Complete": TaskStatus.COMPLETE
}
const priorityMap = {
  "Urgent": TaskPriority.URGENT,
  "Medium": TaskPriority.MEDIUM,
  "Low": TaskPriority.LOW,
}
export const ColorStatus = {
  'To Do': '#B3BEC9',
  'In Progress': '#FFAE18',
  'Bug': '#F94343',
  'Review': '#00CDCD',
  'Complete': '#1DB954'
}
export const mapColorStatus = {
  0: '#B3BEC9',
  1: '#FFAE18',
  2: '#00CDCD',
  3: '#F94343',
  4: '#1DB954'
}
export const ColorPriority = {
  color: {
    0: "#F94343",
    1: "#FFAE18",
    2: "#4FC8F8",
    3: "#DAD1FF",
  },
  background: {
    0: "rgba(223, 168, 116, 0.2)",
    1: "rgba(66, 100, 248, 0.2)",
    2: "rgba(216, 114, 125, 0.1)",
  }
}
export const mapNumPriority = {
  'Low': 0,
  'Normal': 1,
  'High': 2,
  'Urgent': 3
}
export const mapNumDifficuty = {
  'Trivial': 0,
  'Minor': 1,
  'Major': 2,
  'Critical': 3
}

type DataRender = { [status: string]: Array<Task> };

const move = (source: Task[], destination: Task[], droppableSource: DraggableLocation, droppableDestination: DraggableLocation): DataRender => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);
  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone
  };
};

// a little function to help us with reordering the result
const reorder = (list: Task[], startIndex: number, endIndex: number): Task[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};
export const WorkSpace = (props: IProps) => {
  const [disabledAddNewTask, setDisabledAddNewTask] = React.useState<boolean>(false);
  const currentUserId = useAppSelector(state => state.authReducer.user._id)

  const [openDetailDescriptionSprint, setOpenDetailDescriptionSprint] = useState(false)
  const [data, setData] = React.useState<DataRender>({});
  const [newTask, setNewTask] = useState(new Task());
  const [newTaskStatus, setNewTaskStatus] = useState("");
  const [newTaskName, setNewTaskName] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [selectSprintContainer, setSelectSprintContainer] = useState<HTMLDivElement | null>(null);
  // TODO: Cho chọn sprint khi tạo task
  const { enqueueSnackbar } = useSnackbar();

  // const [currentSprint, setCurrentSprint] = React.useState(props?.sprintByProjectId && props?.sprintByProjectId?.length > 0 ? props?.sprintByProjectId[0] : null);

  const {
    sprintState,
  } = useSprint();
  const {
    checkedViewList,
    getUserProject,
    membersProject,
    allUser,
    currentUser,
    projectState,
  } = useProject();

  const currentSprint = sprintState.currentSprint;
  const currentProject = projectState.currentProject;
  const listSprint = _.filter(Object.values(sprintState.sprints), (s) => s.projectId === currentProject?._id);

  const history = useNavigate();
  const userProject = getUserProject(currentProject?._id);


  const checkPermissionUser = [ProjectRole.OWNER, ProjectRole.SPRINT_MASTER].includes(userProject?.role) || isAdmin(currentUser);
  // const listSprinByProjectId = sprintState.sprintById
  // const sprintActive = listSprinByProjectId.find(e => e.status === SprintStatus.ACTIVE)
  // const lastSprint = listSprinByProjectId.slice(-1);
  const { taskAssignmentState } = useTaskAssignment();

  const assigneesBySprintId = taskAssignmentState.taskAssignmentBySprintId.map(item => {
    const findUser = allUser.find(user => user._id === item.userId);
    return { ...item, ...(findUser || {}) }
  })
  // console.log("assigneesBySprintId", assigneesBySprintId)

  const handleCloseMenuTask = () => {
    setAnchorEl(null);
  };
  const openMenuTask = Boolean(anchorEl);

  const [openDetailTaskPopup, setOpenDetailTaskPopup] = React.useState(false)
  const [openTaskItemPopup, setOpenTaskItemPopup] = React.useState(false)
  const { handleUpdateTask, handleDeleteTask } = useTask()
  const taskState = useAppSelector(state => state.taskReducer)
  const dataSubTask = taskState.mapSubTask
  const [members, setListMember] = React.useState(null)
  const [temporaryTask, setTemporaryTask] = React.useState(null);
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const currentTask = taskState?.currentTask;
  // const currentTestSprint = useAppSelector(state => state.sprintReducer.currentSprint)
  // const users = useAppSelector(state => state.userReducer.users);
  // const authState = useAppSelector(state => state.authReducer);
  const curentSprintId = sprintState.currentSprint?._id

  // const urlMatch = useMatch(`${ROUTER_PROJECT}/:projectId`) || useMatch(`${ROUTER_PROJECT}/:projectId${ROUTER_SPRINT}/:sprintId`);
  const handleClickSettingTask = (e: React.MouseEvent<HTMLButtonElement>, taskId) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget)
  }

  const listMember = membersProject.map((member) => {
    const user = allUser.find(e => e._id === member.userId)
    return {
      ...member,
      user
    }
  })
  const openSelectOptionTask = Boolean(anchorEl);

  React.useEffect(() => {
    const keys = ['todo', 'inprogress', 'bug', 'review', 'complete'];
    if (taskState?.searchName) {
      const filterTaskByName: Record<string, Task[]> = {};
      keys.forEach(key => {
        filterTaskByName[key] = props[key]?.filter(item =>
          item.name.toLowerCase().includes(taskState?.searchName.toLowerCase())
        ) ?? [];
      });
      const dataFilter = {
        "To Do": filterTaskByName.todo,
        "In Progress": filterTaskByName.inprogress,
        "Bug": filterTaskByName.bug,
        "Review": filterTaskByName.review,
        "Complete": filterTaskByName.complete,
      };
      setData(dataFilter);
      return;
    } else if (taskState?.searchUser.length > 0) {
      const filterTaskByUser: Record<string, Task[]> = {};
      const filter = keys.map(key => {
        filterTaskByUser[key] = props[key]?.filter((item) => {
          if (taskState?.searchUser.includes(undefined) && item.assignments.length === 0) {
            return item.assignments.length === 0;
          }
          return item.assignments.some(assign => taskState?.searchUser.includes(assign.userId));
        }) ?? []
      })
      const dataFilter = {
        "To Do": filterTaskByUser.todo,
        "In Progress": filterTaskByUser.inprogress,
        "Bug": filterTaskByUser.bug,
        "Review": filterTaskByUser.review,
        "Complete": filterTaskByUser.complete,
      };
      setData(dataFilter);
      return;
    }
    const d = {
      "To Do": props?.todo ?? [],
      "In Progress": props?.inprogress ?? [],
      "Bug": props?.bug ?? [],
      "Review": props?.review ?? [],
      "Complete": props?.complete ?? [],
    }
    setData(d);
    if (newTask && newTaskStatus && disabledAddNewTask) {
      setData((prevData) => ({ ...prevData, [newTaskStatus]: [...prevData[newTaskStatus], newTask] }));
    }
  }, [props?.todo, props?.inprogress, props?.review, props?.bug, props?.complete, taskState?.searchUser, taskState?.searchName, newTask, newTaskStatus, disabledAddNewTask])

  React.useEffect(() => {
    if (listMember.length > 0) {
      setListMember(listMember)
    }
  }, [listMember.length])

  React.useEffect(() => {
    if (curentSprintId && !sprintState.loading) {
      dispatch(getTaskAssignmentBySprintId(curentSprintId))
      dispatch(getSubTasksBySprintId(curentSprintId))
    }
  }, [curentSprintId, taskState.key])

  React.useEffect(() => {
    if (window.history.state === null) {
      setOpenDetailTaskPopup(false);
    }
  }, [window.history.state]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    // dropped outside the list
    if (!destination) {
      return;
    }
    // không cho update khi ở project page
    if (props?.isProjectPage) {
      return;
    }
    const nameCurrentUser = currentUser.name;
    const currentTask = data[source.droppableId][source.index];
    const nameStatusTask = mapTaskStatusLabel[currentTask.status];
    const destinationTask = data[destination.droppableId][destination.index];
    const destinationParentTask = destination.index !== 0 ? data[destination.droppableId][destination.index - 1] : null;
    const currentParentTask = source.index !== 0 ? data[source.droppableId][source.index - 1] : null;
    const destinationChildTask = data[destination.droppableId]?.length > destination.index + 1
      ? data[destination.droppableId][destination.index]
      : null;
    const updateTaskData: Partial<Task> = { status: statusMap[destination.droppableId] };
    if (currentTask.status === TaskStatus.OPEN && destination.droppableId === 'In Progress' || 'Bug' || 'Review' || 'Complete') {
      if (!currentTask.estimatePoints || !currentTask.deadline) {
        enqueueSnackbar("Chưa đặt `Estimate Point` và `Due Date` cho Task", { variant: "warning" });
        return;
      }
      if (!currentTask.startDate) updateTaskData.startDate = Date.now();
    }
    const currentChildTask = data[source.droppableId]?.length > 0 ? data[source.droppableId][source.index + 1] : null;

    if (source.droppableId === destination.droppableId) {
      // không update khi drop lại vị trí cũ
      if (source.index === destination.index) {
        return;
      }

      const newList = reorder(data[source.droppableId], source.index, destination.index);
      const newData = { ...data, [source.droppableId]: newList };
      setData(newData);

      props.onUpdatePositionTask(currentTask._id,
        {
          parentId: currentParentTask?._id,
          childCurrentTaskId: currentChildTask?._id ?? null,
          parentDestinationTaskId: destinationParentTask?._id ?? null,
          childDestinationTaskId: destinationChildTask?._id ?? null,
        });

      return;
    }

    const newData = move(
      data[source.droppableId],
      data[destination.droppableId],
      source,
      destination
    );

    props.onUpdatePositionTask(
      currentTask._id,
      {
        parentId: destinationParentTask?._id,
        childCurrentTaskId: currentChildTask?._id ?? null,
        parentDestinationTaskId: destinationParentTask?._id ?? null,
        childDestinationTaskId: destinationChildTask?._id ?? null,
        status: statusMap[destination.droppableId],
      }
    );
    const newData1 = { ...data, ...newData };
    setData(newData1);
    handleUpdateTask(currentTask._id, updateTaskData)
  };

  const addNewTask = (col: string) => {
    // const status = col;
    // setData({ ...data, [status]: [...data[status], new Task()] });
    setNewTask(newTask);
    setNewTaskStatus(col);

    setDisabledAddNewTask(true);
  }

  const onCancelAddNewTask = (col: string) => {
    // const status = col;
    // const newData = Array.from(data[status]);
    // newData.pop()
    // setData({ ...data, [status]: newData });
    setNewTask(new Task());
    setNewTaskStatus("");
    setDisabledAddNewTask(false);
    setNewTaskName("");
  }

  const onCreateTask = async (status: string, currentIndex: number) => {
    if (loading) return;
    if (!newTaskName) {
      return;
    };
    setLoading(true);
    const task = new Task({
      name: newTaskName,
      userId: currentUserId,
      // TODO: set các task khác cho đúng
      status: statusMap[status],
      projectId: props.projectId,
      sprintId: currentSprint?._id,
      parentId: currentIndex === 0 ? null : data[status][currentIndex - 1],
      statusIndex: data[status]?.length - 1,
    })
    try {
      await props.onCreateNewTask(task);
      setNewTaskName('')
      setLoading(false)
      setDisabledAddNewTask(false);
    } catch (error) {
      setLoading(false)
    }
  }

  const handleClickTask = (event: any, task: Task) => {
    if (event.type === "click") {
      setOpenDetailTaskPopup(true)
      dispatch(currentTaskActive(task));
      window.history.pushState({ projectId: projectState.currentProject?._id, sprintId: sprintState.currentSprint?._id }, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_TASK}/${task._id}`);
    }
    else if (event.type === "contextmenu") {
      setAnchorEl(event.currentTarget);
    }
  }

  const handleCloseTaskDetail = () => {
    const { projectId, sprintId } = window.history.state;
    window.history.pushState(null, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_PROJECT}/${projectId}${ROUTER_SPRINT}/${sprintId}`);
    setOpenDetailTaskPopup(false);
  }


  const handleClickSelectOptionTask = (event: React.MouseEvent<HTMLButtonElement>, task: Task) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setOpenTaskItemPopup(true)
    setTemporaryTask(task)
  }

  const handleCloseSelectOptionTask = () => {
    setAnchorEl(null);
  };

  return <>
    <div className="workspace-container">
      {
        checkedViewList
          ? <Box className='task-by-list-container'>
            <DragDropContext onDragEnd={onDragEnd}>
              {Object.keys(data).map(status => {
                if (data[status]?.length > 0) {
                  return <div className='row-status-container'>
                    <div className='row-status-header'>
                      <div className='row-status-header-left'>
                        <div className='row-status-name' style={{ background: `${ColorStatus[status]}` }}>
                          {status.toUpperCase()}
                        </div>
                        <div className='row-status-header-length'>{data[status]?.length} TASKS</div>
                        {['To Do', 'Bug'].includes(status) && <button
                          className="row-status-btnAddTask"
                          disabled={disabledAddNewTask}
                          onClick={() => addNewTask(status)}>
                          <Box className="icon-add-task-list">
                            <IconAddTask />
                          </Box>
                        </button>}
                      </div>
                      <Grid container spacing={3} className='row-status-header-right'>
                        <Grid xs className='row-status-header-text'>ASSIGNEES</Grid>
                        <Grid xs className='row-status-header-text'>INFOR</Grid>
                        <Grid xs className='row-status-header-text'>SETTINGS</Grid>
                      </Grid>
                    </div>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          className="row-status-body"
                          ref={provided.innerRef}
                        >
                          {data[status].map((row, index) => {
                            if (!row._id) {
                              return <div
                                className='form-task-item-addnew'
                                key={`task-item-${index}`}
                              >
                                <div className='task-item-color' style={{ background: `${ColorStatus[status]}` }}></div>
                                <div className='task-item-add-body'>
                                  <input
                                    className='input-add-new-task'
                                    placeholder="Task name"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        onCreateTask(status, index)
                                      }
                                    }}
                                    onChange={(e) => setNewTaskName(e.currentTarget.value)}
                                  />
                                  <Box width={"50%"} display="flex" justifyContent={"flex-end"}>
                                    <Button onClick={() => onCancelAddNewTask(status)}>Cancel</Button>
                                    <Button onClick={() => onCreateTask(status, index)}>Create</Button>
                                  </Box>
                                </div>
                              </div>
                            }
                            return <div className='task-by-list'>
                              <ItemTaskByList
                                key={row._id}
                                item={row}
                                index={index}
                                color={ColorStatus[status]}
                                nameStatus={status}
                                assignees={assigneesBySprintId}
                                priorityColor={ColorPriority.color[row.priority]}
                                priorityBackgroud={ColorPriority.background[row.priority]}
                                mapPriority={Object.keys(priorityMap)[row.priority]}
                                handleClickTask={handleClickTask}
                              />
                            </div>
                          })}
                        </div>
                      )}
                    </Droppable>
                  </div>
                }
              })}
            </DragDropContext>
          </Box>
          : <Box className='task-by-board-container'>
            <DragDropContext onDragEnd={onDragEnd}>
              {Object.keys(data).map((col, i) => {
                return (
                  <div key={col} className="column-container">
                    <div className="column-task-title-container" >
                      <div className="column-task-title" style={{ borderBottom: `3px solid ${ColorStatus[col]}` }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '20px', background: `${ColorStatus[col]}` }} />
                        <div className="task-title-name">{col.toUpperCase()}</div>
                        <div className="task-title-amoutn">{data[col]?.length}</div>
                        <div className="task-title-bag-btnAddTask">
                          {['To Do', 'Bug'].includes(col) && <button
                            className="task-title-btnAddTask"
                            disabled={disabledAddNewTask}
                            onClick={() => addNewTask(col)}>
                            <Box className="Title-AddIcon"><IconAddTask /></Box>
                          </button>}
                        </div>
                      </div>
                    </div>
                    {/* taskItem popup */}
                    {
                      openTaskItemPopup
                      &&
                      <TaskItemPopup
                        openSelectOptionTask={openSelectOptionTask}
                        anchorEl={anchorEl}
                        handleCloseSelectOptionTask={handleCloseSelectOptionTask}
                        data={temporaryTask}
                        onDeleteSuccess={() => setOpenTaskItemPopup(false)}
                        onDeleteError={() => setOpenTaskItemPopup(false)}
                      />
                    }

                    <Droppable droppableId={col}>
                      {(provided, snapshot) => (
                        <div
                          className='column-body'
                          ref={provided.innerRef}
                          style={{
                            // backgroundColor: !snapshot.isDraggingOver ? '#c8c7c7' : '#737373',

                          }}>
                          {data[col].map((row, index) => {
                            return <Fragment key={index}>
                              {!row._id
                                ? <div
                                  className="task-new-board"
                                  key={`task-item-${index}`}
                                >
                                  <TextField
                                    placeholder="Task name"
                                    className="input-new-task-board"
                                    variant="standard"
                                    autoFocus
                                    fullWidth
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        onCreateTask(col, index)
                                      }
                                    }}
                                    onChange={(e) => setNewTaskName(e.currentTarget.value)}
                                  />
                                  <Box width={"100%"} display="flex" justifyContent={"flex-end"}>
                                    <Button onClick={() => onCancelAddNewTask(col)}>Cancel</Button>
                                    <Button onClick={() => onCreateTask(col, index)}>Create</Button>
                                  </Box>
                                </div>
                                : <div className="task-by-board-component">
                                  <ItemTaskByBoard
                                    key={row._id}
                                    item={row}
                                    index={index}
                                    assignees={assigneesBySprintId}
                                    mapPriority={Object.keys(priorityMap)[row.priority]}
                                    handleClickTask={handleClickTask}
                                    {...(dataSubTask && dataSubTask[row._id] ? { mapSubTask: dataSubTask[row._id] } : {})}
                                  />
                                </div>
                              }
                            </Fragment>
                          })}
                          {provided.placeholder}
                          <div className="box-add-task-bottom-column">
                            {
                              !disabledAddNewTask
                              && ['To Do', 'Bug'].includes(col)
                              && <button
                                className="btn-add-task-bottom-column"
                                onClick={() => {
                                  addNewTask(col)
                                }}
                              >
                                + New task
                              </button>
                            }
                          </div>

                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </DragDropContext >
          </Box >
      }
    </div>
    {!!currentTask && openDetailTaskPopup && <DetailTaskPopup
      open={openDetailTaskPopup}
      handleClose={handleCloseTaskDetail}
      data={currentTask}
      handleConfirmUpdateTask={(data: Task) => {
        handleUpdateTask(currentTask?._id, data)
      }}
    />}
  </>
}