import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Avatar, AvatarGroup, Divider, List, ListItemButton } from '@mui/material';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";
import classNames from "classnames";
import DOMPurify from "dompurify";
import { debounce } from "lodash";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useEffect, useState } from "react";
import { EditTextarea } from "react-edit-text";
import { ImageListType } from "react-images-uploading";
import { $enum } from "ts-enum-util";
import { ProjectRole, SprintStatus, TaskDifficulty, TaskPriority, TaskRole, TaskStatus } from "../../../../common/constants";
import Sprint from '../../../../common/models/sprint';
import Task from "../../../../common/models/task";
import TaskAssignment from "../../../../common/models/task_assignment";
import User from "../../../../common/models/user";
import {
  mapTaskDifficultyLabel,
  mapTaskPriorityLabel,
  mapTaskStatusLabel
} from "../../config/MapContraint";
import { useProjectCheckList } from "../../hooks/useProjectCheckList";
import useProjectMember from "../../hooks/useProjectMember";
import { useTask } from "../../hooks/useTask";
import { useTaskAssignment } from "../../hooks/useTaskAssignment";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { clearSearchStatusBugCheckList, clearSearchStatusCheckList } from '../../redux/slices/projectCheckList.slice';
import {
  deleteAssignMemberFromTask, setUserTyping
} from "../../redux/slices/task.slice";
import { RootState } from "../../redux/store";
import { useSocket } from '../../socketio/SocketIOProvider';
import { apiEndpoint } from "../../utils/request";
import AssignMemberToTaskPopover from "../AssignMember/AssignMemberToTaskPopover";
import AttachedImagesUploader from "../AttachedImagesUploader";
import BootstrapTooltip from "../CustomToolTip";
import DetailCheckListForBug from "../DetailCheckListBug/DetailCheckListBug";
import DetailProjectCheckList from "../DetailProjectCheckList/DetailProjectCheckList";
import ConfirmDialog from "../dialog/ConfirmDialog";
import { DialogTransitionUp } from "../dialog/DialogTransitions";
import AddMemIcon from '../icons/AddMemIcon';
import IconStar from '../icons/IconDifficuty';
import PriorityIcon from '../icons/PriorityIcon';
import UserCustomIcon from '../icons/UserCustomIcon';
import { ColorPriority, ColorStatus } from '../WorkSpace';
import CustomDateTimePicker from './DateTimePicker/CustomDateTimePicker';
import './style.scss';

const URL = `${process.env.REACT_APP_ENDPOINT}/${process.env.REACT_APP_PREFIX_API}`;

interface IProps {
  open: boolean;
  handleClose?: any;
  data?: Task;
  handleConfirmUpdateTask?: any;
  isFromDashboard?: boolean;
  isSubTask?: boolean;
  sprint?: Pick<Sprint, "name">;
}

export const DetailTaskPopup = (props: IProps) => {
  const { handleUpdateTask, handleDeleteTask } = useTask();
  const accessToken = useAppSelector((state) => state.authReducer.accessToken);
  const { open, handleClose, data, handleConfirmUpdateTask, isFromDashboard, sprint } = props;
  const { handleLoadTaskAssignmentById, handleDeleteTaskAssignment } =
    useTaskAssignment();
  const { handleLoadProjectCheckListById } = useProjectCheckList();
  const dispatch = useAppDispatch();

  const { enqueueSnackbar } = useSnackbar();
  const projectState = useAppSelector((state: RootState) => state.projectReducer)
  const sprintState = useAppSelector((state) => state.sprintReducer)
  const currentSprint = useAppSelector(state => state.sprintReducer.currentSprint)
  const auth = useAppSelector((state: RootState) => state.authReducer)
  const taskAssignments = useAppSelector((state: RootState) => state.taskAssignmentReducer.taskAssignmentById)
  const taskState = useAppSelector((state: RootState) => state.taskReducer)
  const currentTask = useAppSelector((state: RootState) => state.taskReducer?.currentTask)
  const isSubTask = currentTask.parentTaskId !== null
  const users = useAppSelector((state: RootState) => state.userReducer.users);
  const [status, setStatus] = useState(currentTask?.status ?? TaskStatus.OPEN);
  const [disableEsstimate, setDisableEsstimate] = useState(false);
  const [disableTestEsstimate, setDisableTestEsstimate] = useState(false);
  const [disableReviewEsstimate, setDisableReviewEsstimate] = useState(false);
  const [anchorElAssign, setAnchorElAssign] = useState<HTMLLIElement | null>(
    null
  );
  const [anchorElPriority, setAnchorElPriority] =
    useState<HTMLLIElement | null>(null);
  const [anchorElDifficulty, setAnchorElDifficulty] =
    useState<HTMLLIElement | null>(null);
  const [anchorElSettingsTask, setAnchorElSettingsTask] =
    useState<HTMLLIElement | null>(null);
  const [checkRoleAssign, setCheckRoleAssign] = useState<number>();
  const [taskAssignees, setTaskAssignees] = useState<
    Array<TaskAssignment & Partial<User>>
  >([]);
  const [taskTesters, setTaskTesters] = useState<
    Array<TaskAssignment & Partial<User>>
  >([]);
  const [taskReviewers, setTaskReviewers] = useState<
    Array<TaskAssignment & Partial<User>>
  >([]);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [disableTying, setDisableTying] = React.useState(false);

  const { socket } = useSocket();

  const [showEditor, setShowEditor] = useState(false);

  const hasMasterOrOwnerPermission = !!(useProjectMember(currentTask?.projectId)).find((e) => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id);
  const isDisabledEditSprint = !hasMasterOrOwnerPermission && (currentSprint?.status === SprintStatus.ARCHIVED) || currentTask.isArchived
  const userTyping = useAppSelector(state => state.userReducer.mapUserData)[taskState?.userTyping]

  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("join-room", { roomId: currentTask._id, roomType: "task-detail", userId: auth.user._id });
    }
    return () => {
      socket.emit('typing', { taskId: currentTask._id, userId: auth.user._id, cancelTyping: true, leaveRoom: true });
    }
  }, [socket])

  useEffect(() => {
    const assigneesByTask = taskAssignments
      .filter((a) => a?.role === TaskRole.ASSIGNEE)
      .map((item) => {
        const findUser = users.find((user) => user?._id === item?.userId);
        return { ...item, ...(findUser || {}) };
      });
    const taskReviewers = taskAssignments
      .filter((a) => a.role === TaskRole.REVIEWER)
      .map((item) => {
        const findUser = users.find((user) => user._id === item?.userId);
        return { ...item, ...(findUser || {}) };
      });
    const taskTesters = taskAssignments
      .filter((a) => a.role === TaskRole.TESTER)
      .map((item) => {
        const findUser = users.find((user) => user._id === item?.userId);
        return { ...item, ...(findUser || {}) };
      });
    setTaskAssignees(assigneesByTask);
    setTaskTesters(taskTesters);
    setTaskReviewers(taskReviewers);
  }, [taskAssignments, users]);

  //Open/Close list assign
  const openAnchorElAssign = Boolean(anchorElAssign);
  const openAnchorElDifficulty = Boolean(anchorElDifficulty);
  const openAnchorElPriority = Boolean(anchorElPriority);
  const openAnchorElSettingsTask = Boolean(anchorElSettingsTask);

  const openListMembers = (e: React.MouseEvent<HTMLLIElement>, role: number) => {
    if (!isDisabledEditSprint) {
      setAnchorElAssign(e.currentTarget)
      setCheckRoleAssign(role)
    }
  }
  const handleCloseListMembers = () => {
    setAnchorElAssign(null);
  };
  const openPopoverDifficulty = (e) => {
    setAnchorElDifficulty(e.currentTarget);
  };
  const handleClosePopoverDifficulty = () => {
    setAnchorElDifficulty(null);
  };
  const openPopoverPriority = (e) => {
    setAnchorElPriority(e.currentTarget);
  };
  const handleClosePopoverPriority = () => {
    setAnchorElPriority(null);
  };
  const openSettingsTask = (e) => {
    setAnchorElSettingsTask(e.currentTarget);
  };
  const handleCloseSettingsTask = () => {
    setAnchorElSettingsTask(null);
  };

  useEffect(() => {
    if (data) {
      handleLoadTaskAssignmentById(data._id);
      handleLoadProjectCheckListById(data._id);
    }
  }, [data]);

  useEffect(() => {
    if (userTyping) {
      setDisableTying(true)
      return;
    }
    setDisableTying(false)
  }, [userTyping])

  useEffect(() => {
    if (!projectState.currentProject?._id) return;
    if (hasMasterOrOwnerPermission) {
      setDisableEsstimate(false);
      setDisableTestEsstimate(false);
      setDisableReviewEsstimate(false);
    } else {
      if (currentTask?.estimatePoints) {
        setDisableEsstimate(true);
      }
      if (currentTask?.testEstimatePoints) {
        setDisableTestEsstimate(true);
      }
      if (currentTask?.reviewEstimatePoints) {
        setDisableReviewEsstimate(true);
      }
    }
  }, [currentTask, projectState.currentProject?._id, hasMasterOrOwnerPermission]);

  const handleCloseDialog = () => {
    handleClose();
    dispatch(setUserTyping(null));
    dispatch(clearSearchStatusBugCheckList(null));
    dispatch(clearSearchStatusCheckList(null));
  };
  const handleChangeStatus = (e: any) => {
    setStatus((prev) => {
      const newValue = +e.target.value;
      const updates: Partial<Task> = { status: newValue };
      if (prev === TaskStatus.OPEN) {
        if (!currentTask?.estimatePoints || !currentTask?.deadline) {
          enqueueSnackbar("Chưa đặt `Estimate Point` và `Due Date` cho Task", { variant: "warning" });
          return prev;
        }
        if (!currentTask?.startDate) updates.startDate = Date.now();
      }
      handleConfirmUpdateTask(updates);
      return newValue;
    })
    // setStatus(e.target.value);
  };
  const handleChangeDifficulty = (value: TaskDifficulty) => {
    handleConfirmUpdateTask({ difficulty: value });
    setAnchorElDifficulty(null);
  };
  const handleChangePriority = (value: TaskPriority) => {
    handleConfirmUpdateTask({ priority: value });
    setAnchorElPriority(null);
  };

  const handleCompleteTask = () => {
    if (currentTask.status === TaskStatus.OPEN && !currentTask.estimatePoints && !currentTask.deadline) {
      enqueueSnackbar("Chưa đặt `Estimate Point` và `Due Date` cho Task", { variant: "warning" });
      return;
    }
    handleUpdateTask(currentTask?._id, { status: TaskStatus.COMPLETE });
    setStatus(TaskStatus.COMPLETE);
  };

  const handleChangeDescription = debounce((event) => {
    if (currentTask?.description?.localeCompare(event.editor.getData()) !== 0) {
      handleConfirmUpdateTask({ description: event.editor.getData() })
      socket.emit('typing', { taskId: currentTask._id, userId: auth.user._id, cancelTyping: false, task: { ...currentTask, description: event.editor.getData() } });
    }
  }, 300);

  const handleSaveName = ({ value }) => {
    handleConfirmUpdateTask({ name: value });
  };

  const handleChangeEstimate = (e: any, field: string) => {
    const value = e.target.value;
    if (value !== "" && value < 0) {
      enqueueSnackbar("Estimate must be greater than equal to 0", { variant: "error" });
      return;
    }
    if (hasMasterOrOwnerPermission) {
      handleConfirmUpdateTask({ [field]: value });
    } else {
      handleConfirmUpdateTask({ [field]: value });
      switch (field) {
        case "estimatePoints":
          setDisableEsstimate(true);
          break;
        case "testEstimatePoints":
          setDisableTestEsstimate(true);
          break;
        case "reviewEstimatePoints":
          setDisableReviewEsstimate(true);
          break;
        default:
          break;
      }
    }
  };

  const handleDeleteAssigneeQuick = (userId: string, role: TaskRole) => {
    handleDeleteTaskAssignment(currentTask?._id, userId, role);
  };

  const handleImageUpload = async (
    imageList: ImageListType,
    addUpdateIndex?: number[]
  ) => {
    await Promise.all(
      imageList.map(async (image, i) => {
        if (addUpdateIndex?.includes(i) ?? false) {
          const formData = new FormData();
          formData.append(
            "upload",
            image.file as File,
            `image-content-${image.file?.name}`
          );
          try {
            const { data, status } = await axios.post(
              `${URL}/upload-image-ckeditor`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            if (status !== 200) {
              return "";
            }

            imageList[i].dataURL = data.url;
            return data.url;
          } catch (e) {
            console.error(e);
            return "";
          }
        }
      })
    );
    const images = imageList.map((e) => {
      return e.dataURL;
    });
    const attachImage = images;

    handleUpdateTask(currentTask._id, { attachImage })
  }

  return (
    <Dialog
      disableAutoFocus
      open={open}
      onClose={handleCloseDialog}
      maxWidth="xl"
      TransitionComponent={DialogTransitionUp}
      classes={{ paper: "dialog-detail-task-container" }}>
      <ConfirmDialog
        open={openConfirmDelete}
        title="Confirm Delete?"
        content={
          <>
            Are you sure to delete task <b>{currentTask?.name}?</b>
          </>
        }
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={() => {
          handleDeleteTask(currentTask._id);
          handleClose();
        }}
      />
      <DialogTitle className="dialog-detail-task-title">
        <Box className="title-detail-task-name">
          {projectState.projects[currentTask?.projectId]?.name}
          <ArrowForwardIosIcon
            classes={{ root: "arrowicon-title-task-detail" }}
          />
          {isFromDashboard ? sprint?.name : currentSprint?.name}
        </Box>
        <IconButton
          onClick={handleCloseDialog}
          className="btn-close-dialog-task">
          <CloseIcon className="closeicon-title-task-detail" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <Box className="task-body-header-container">
        <Box className="task-body-left-header">
          <Box sx={{ margin: "14px 8px 14px 24px" }}>
            <Select
              classes={{
                outlined: "select-status-task",
                iconOutlined: "icon-status-task",
                select: "select-content-status-task",
              }}
              className="select-status-task-root"
              style={{
                backgroundColor: `${ColorStatus[mapTaskStatusLabel[status]]}`,
              }}
              value={status}
              onChange={handleChangeStatus}
              disabled={isDisabledEditSprint}
            >
              {$enum(TaskStatus).getValues().map(value => (
                <MenuItem key={value} value={value}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        background: `${ColorStatus[mapTaskStatusLabel[value]]
                          }`,
                        width: "8px",
                        height: "8px",
                        borderRadius: "3px",
                        marginRight: "10px",
                      }}
                    />
                    {mapTaskStatusLabel[value]}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </Box>
          {currentTask?.status !== TaskStatus.COMPLETE
            && <BootstrapTooltip placement="top" title="Set to complete">
              <Box className='complete-task-container'>
                <button className='btn-complete-task' disabled={isDisabledEditSprint} onClick={handleCompleteTask}>
                  <DoneIcon className='icon-done-task' />
                </button>
              </Box>
            </BootstrapTooltip>}
          <Box className="group-assignees-task">
            <AssignMemberToTaskPopover
              anchorElAssign={anchorElAssign}
              openAnchorElAssign={openAnchorElAssign}
              openListMembers={openListMembers}
              checkRoleAssign={checkRoleAssign}
              handleCloseListMembers={handleCloseListMembers}
              role={TaskRole.ASSIGNEE}
            />
            <div className="group-assignees-container">
              <AvatarGroup
                max={2}
                classes={{ avatar: "avatar-group-detail-task" }}
                onClick={(e: any) => openListMembers(e, TaskRole.ASSIGNEE)}>
                {taskAssignees?.length > 0 &&
                  taskAssignees.map((assignee) => {
                    return (
                      <div
                        key={assignee._id}
                        className="square-avatar-container">
                        <BootstrapTooltip
                          placement="bottom"
                          title={assignee.name}>
                          <Avatar
                            classes={{ root: "avatar-square-detail-task" }}
                            src={assignee?.avatar}
                            onClick={(e: any) =>
                              openListMembers(e, TaskRole.ASSIGNEE)
                            }
                          />
                        </BootstrapTooltip>
                        <div
                          onClick={(e) => {
                            if (!hasMasterOrOwnerPermission) return;
                            handleDeleteAssigneeQuick(
                              assignee.userId,
                              assignee.role
                            );
                            dispatch(
                              deleteAssignMemberFromTask({
                                taskId: currentTask._id,
                                role: assignee.role,
                                userId: assignee.userId,
                              })
                            );
                            e.stopPropagation();
                          }}
                          className="icon-x-custom-delete-asn">
                          <AddMemIcon />
                        </div>
                      </div>
                    );
                  })}
              </AvatarGroup>

              <BootstrapTooltip placement="top" title="Assign">
                <button className='btn-assign-detail-task' onClick={(e: any) => openListMembers(e, TaskRole.ASSIGNEE)}>
                  <div className='custom-assign-detail-task-add'><AddMemIcon /></div>
                  <div className='custom-assign-detail-task-user'><UserCustomIcon /></div>
                </button>
              </BootstrapTooltip>
            </div >
            <label className="label-assignees-detail-task"> Assignees </label>
          </Box >
          <div className="group-reviewers-detail-task">
            <AssignMemberToTaskPopover
              anchorElAssign={anchorElAssign}
              openAnchorElAssign={openAnchorElAssign}
              openListMembers={openListMembers}
              checkRoleAssign={checkRoleAssign}
              handleCloseListMembers={handleCloseListMembers}
              role={TaskRole.REVIEWER}
            />
            <div className="avatar-group-reviewers-container">
              <AvatarGroup
                max={2}
                classes={{ avatar: "avatar-group-detail-task" }}
                onClick={(e: any) => openListMembers(e, TaskRole.REVIEWER)}>
                {taskReviewers?.length > 0 &&
                  taskReviewers.map((assignee) => {
                    return (
                      <div
                        key={assignee._id}
                        className="square-avatar-container">
                        <BootstrapTooltip
                          placement="bottom"
                          title={assignee.name}>
                          <Avatar
                            classes={{ root: "avatar-square-detail-task" }}
                            src={assignee?.avatar}
                            onClick={(e: any) =>
                              openListMembers(e, TaskRole.REVIEWER)
                            }
                          />
                        </BootstrapTooltip>
                        <div
                          onClick={(e) => {
                            if (!hasMasterOrOwnerPermission) return;
                            handleDeleteAssigneeQuick(
                              assignee.userId,
                              assignee.role
                            );
                            dispatch(
                              deleteAssignMemberFromTask({
                                taskId: currentTask._id,
                                role: assignee.role,
                                userId: assignee.userId,
                              })
                            );
                            e.stopPropagation();
                          }}
                          className="icon-x-custom-delete-asn">
                          <AddMemIcon />
                        </div>
                      </div>
                    );
                  })}
              </AvatarGroup>
              <BootstrapTooltip placement="top" title="Assign Reviewer">
                <button className='btn-assign-detail-task' onClick={(e: any) => openListMembers(e, TaskRole.REVIEWER)}>
                  <div className='custom-assign-detail-task-add'><AddMemIcon /></div>
                  <div className='custom-assign-detail-task-user'><UserCustomIcon /></div>
                </button>
              </BootstrapTooltip>
            </div >
            <label className="label-reviewer-detail-task"> Reviewer </label>
          </div >

          <div className="group-testers-detail-task">
            <AssignMemberToTaskPopover
              anchorElAssign={anchorElAssign}
              openAnchorElAssign={openAnchorElAssign}
              openListMembers={openListMembers}
              checkRoleAssign={checkRoleAssign}
              handleCloseListMembers={handleCloseListMembers}
              role={TaskRole.TESTER}
            />
            <div className="avatar-group-testers-container">
              <AvatarGroup
                max={2}
                classes={{ avatar: "avatar-group-detail-task" }}>
                {taskTesters?.length > 0 &&
                  taskTesters.map((assignee) => {
                    return (
                      <div
                        key={assignee._id}
                        className="square-avatar-container">
                        <BootstrapTooltip
                          placement="bottom"
                          title={assignee.name}>
                          <Avatar
                            classes={{ root: "avatar-square-detail-task" }}
                            src={assignee?.avatar}
                            onClick={(e: any) =>
                              openListMembers(e, TaskRole.TESTER)
                            }
                          />
                        </BootstrapTooltip>
                        <div
                          onClick={(e) => {
                            if (!hasMasterOrOwnerPermission) return;
                            handleDeleteAssigneeQuick(
                              assignee.userId,
                              assignee.role
                            );
                            dispatch(
                              deleteAssignMemberFromTask({
                                taskId: currentTask._id,
                                role: assignee.role,
                                userId: assignee.userId,
                              })
                            );
                            e.stopPropagation();
                          }
                          }
                          className="icon-x-custom-delete-asn">
                          <AddMemIcon />
                        </div>
                      </div>
                    );
                  })}
              </AvatarGroup>
              <BootstrapTooltip placement="top" title="Assign Tester">
                <button className='btn-assign-detail-task' onClick={(e: any) => openListMembers(e, TaskRole.TESTER)}>
                  <div className='custom-assign-detail-task-add'><AddMemIcon /></div>
                  <div className='custom-assign-detail-task-user'><UserCustomIcon /></div>
                </button>
              </BootstrapTooltip>
            </div >
            <label className="label-tester-detail-task"> Tester </label>
          </div >
          <Box className="container-priority-difficulty-settings">
            <Box className="priority-detail-task">
              <Popover
                open={openAnchorElPriority}
                anchorEl={anchorElPriority}
                onClose={handleClosePopoverPriority}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}>
                {$enum(TaskPriority)
                  .getValues()
                  .map((value) => (
                    <MenuItem
                      key={value}
                      value={value}
                      onClick={() => handleChangePriority(value)}>
                      <Box
                        sx={{
                          marginRight: "10px",
                          path: { fill: ColorPriority.color[value] },
                          svg: { width: "12px", height: "16px" },
                        }}>
                        <PriorityIcon />
                      </Box>
                      {mapTaskPriorityLabel[value]}
                    </MenuItem>
                  ))}
              </Popover>

              <BootstrapTooltip placement="top" title="Set priority">
                <IconButton
                  disableRipple
                  className="btn-change-priority"
                  sx={
                    currentTask?.priority === undefined
                      ? {
                        border: "1px dashed #DCDFE4",
                        svg: {
                          fill: "#C1C1C1",
                          width: "12px",
                          height: "16px",
                        },
                        ":hover": {
                          border: "1px dashed #0085FF",
                          svg: { fill: "#0085FF" },
                        },
                      }
                      : {
                        border: `1px solid ${ColorPriority.color[currentTask?.priority]
                          }`,
                        ":hover": {
                          border: `1px dashed ${ColorPriority.color[currentTask?.priority]
                            } `,
                        },
                      }
                  }
                  onClick={openPopoverPriority}>
                  <Box
                    sx={{
                      path: {
                        fill: ColorPriority.color[currentTask?.priority],
                      },
                      svg: { width: "12px", height: "16px" },
                    }}>
                    <PriorityIcon />
                  </Box>
                </IconButton>
              </BootstrapTooltip>
            </Box>
            {!!hasMasterOrOwnerPermission && (
              <Box className="difficulty-detail-task">
                <Popover
                  open={openAnchorElDifficulty}
                  anchorEl={anchorElDifficulty}
                  onClose={handleClosePopoverDifficulty}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}>
                  {$enum(TaskDifficulty)
                    .getValues()
                    .map((value) => (
                      <MenuItem
                        key={value}
                        value={value}
                        onClick={() => handleChangeDifficulty(value)}>
                        <Box
                          sx={{
                            marginRight: "10px",
                            path: {
                              fill: ColorPriority.color[value],
                            },
                            svg: { width: "16px", height: "16px" },
                          }}>
                          <IconStar />
                        </Box>
                        {mapTaskDifficultyLabel[value]}
                      </MenuItem>
                    ))}
                </Popover>
                <BootstrapTooltip placement="top" title="Set severity">
                  <IconButton
                    disableRipple
                    className="btn-change-difficulty"
                    sx={
                      currentTask?.difficulty === undefined
                        ? {
                          border: "1px dashed #DCDFE4",
                          svg: {
                            fill: "#C1C1C1",
                            width: "16px",
                            height: "16px",
                          },
                          ":hover": {
                            border: "1px dashed #0085FF",
                            svg: { fill: "#0085FF" },
                          },
                        }
                        : {
                          border: `1px solid ${ColorPriority.color[currentTask?.difficulty]
                            }`,
                          ":hover": {
                            border: `1px dashed ${ColorPriority.color[currentTask?.difficulty]
                              } `,
                          },
                        }
                    }
                    onClick={openPopoverDifficulty}>
                    <Box
                      sx={{
                        path: {
                          fill: ColorPriority.color[currentTask?.difficulty],
                        },
                        svg: { width: "16px", height: "16px" },
                      }}>
                      <IconStar />
                    </Box>
                  </IconButton>
                </BootstrapTooltip>
              </Box>
            )}

            <Popover
              open={openAnchorElSettingsTask}
              anchorEl={anchorElSettingsTask}
              onClose={handleCloseSettingsTask}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}>
              <Box>
                <List>
                  <ListItemButton>Copy Link</ListItemButton>
                  <ListItemButton>Copy ID</ListItemButton>
                  {(!!hasMasterOrOwnerPermission ||
                    currentTask?.userId === auth?.user?._id) && (
                      <ListItemButton
                        onClick={() => {
                          setOpenConfirmDelete(true);
                          setAnchorElSettingsTask(null);
                        }}>
                        Delete
                      </ListItemButton>
                    )}
                </List>
              </Box>
            </Popover>
            <Box>
              <BootstrapTooltip placement="top" title="Task Settings">
                <IconButton
                  disableRipple
                  className="btn-settings-detail-task"
                  onClick={openSettingsTask}>
                  <MoreHorizIcon className="icon-settings-detail-task" />
                </IconButton>
              </BootstrapTooltip>
            </Box>
          </Box>
        </Box >
        <Box className="task-body-right-header">
          <CustomDateTimePicker
            handleConfirmUpdateTask={(data: Task) => {
              handleUpdateTask(currentTask._id, data);
            }}
          />

          <Box className="estimate-container">
            <label className="label-estimate-task">ESTIMATE</label>
            <TextField
              onBlur={(e) => handleChangeEstimate(e, "estimatePoints")}
              defaultValue={currentTask?.estimatePoints}
              disabled={disableEsstimate || isDisabledEditSprint}
              type="number"
              className="estimate-detail-task"
              InputProps={{
                style: {
                  height: "25px",
                },
              }}
            />
          </Box>
          <Box className="estimate-container">
            <label className="label-estimate-task">REVIEW ESTIMATE</label>
            <TextField
              onBlur={(e) => handleChangeEstimate(e, "reviewEstimatePoints")}
              defaultValue={currentTask?.reviewEstimatePoints}
              disabled={disableReviewEsstimate || isDisabledEditSprint}
              type="number"
              className="estimate-detail-task"
              InputProps={{
                style: {
                  height: "25px",
                },
              }}
            />
          </Box>
          <Box className="estimate-container">
            <label className="label-estimate-task">TEST ESTIMATE</label>
            <TextField
              onBlur={(e) => handleChangeEstimate(e, "testEstimatePoints")}
              defaultValue={currentTask?.testEstimatePoints}
              disabled={disableTestEsstimate || isDisabledEditSprint}
              type="number"
              className="estimate-detail-task"
              InputProps={{
                style: {
                  height: "25px",
                },
              }}
            />
          </Box>
        </Box>
      </Box >
      <Box className="dialog-detail-task-body">
        <Box className="detail-task-body-left">
          <Box className="task-body-left-content">
            <div className="name-detail-task">
              <EditTextarea
                name="textbox"
                defaultValue={currentTask?.name}
                className="edit-text-name-detail-task"
                inputClassName="input-edit-name-detail-task"
                onSave={handleSaveName}
                placeholder="Name"
                readonly={isDisabledEditSprint}
              />
            </div>
            <div className='container-description-detail-task'
              onClick={() => {
                if (userTyping) {
                  setShowEditor(false)
                  return;
                }
                setShowEditor(true)
              }}
              style={{ marginBottom: '50px' }}>
              {!showEditor &&
                <div
                  className={classNames('default-description-detail-task', !data?.description ? "empty" : "")}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(taskState.tasks[currentTask?._id]?.description) || 'Description or type/ for commands' }}
                />}
              {showEditor && <CKEditor
                initData={taskState.tasks[currentTask?._id]?.description}
                onChange={handleChangeDescription}
                onBlur={(e) => {
                  console.log("Change data", e.editor.getData())
                  socket.emit('typing', { taskId: currentTask._id, userId: auth.user._id, cancelTyping: true });
                }}
                config={{
                  filebrowserImageUploadUrl: `${URL}/upload-image-ckeditor`,
                  uploadUrl: `${URL}/upload-image-ckeditor`,
                  extraPlugins: "autogrow",
                  fileTools_requestHeaders: {
                    Authorization: `Bearer ${auth.accessToken}`,
                  },
                }}
                onFocus={() => {
                  socket.emit('typing', { taskId: currentTask._id, userId: auth.user._id, cancelTyping: false });
                }}
                onInstanceReady={(event) => {
                  event.editor.focus();
                }}
                readOnly={disableTying || isDisabledEditSprint}
              />}
              {
                userTyping && <span>{userTyping.name} typing</span>
              }
            </div>
            <div className="project-check-list-row">
              <DetailProjectCheckList />
            </div>
            <div className="task-attachments">
              <div className="task-attachments-label">
                {`+ Attachments`}
              </div>
              <div className="task-attachments-image-list" >
                <AttachedImagesUploader
                  apiEndpoint={apiEndpoint}
                  images={currentTask.attachImage?.map((dataURL) => ({ dataURL }))}
                  onChange={(imgList) => {
                    handleImageUpload(imgList)
                  }}
                  isDisabled={isDisabledEditSprint}
                />
              </div>
            </div>
          </Box >
        </Box >
        <Box className="detail-task-body-right">
          <Box className="task-body-right-content">
            <div className="bug-description-container"></div>
            <div className="check-list-for-bug-row">
              <DetailCheckListForBug />
            </div>
          </Box>
        </Box>
      </Box >
    </Dialog >
  );
};
