import {
  AccessTimeTwoTone,
  ArchiveTwoTone,
  UpcomingTwoTone,
  WindowRounded,
} from "@mui/icons-material";
import {
  IconButton,
  MenuItem,
  Select,
  Typography,
  Button,
  Popover,
} from "@mui/material";
import _ from "lodash";
import Box from "@mui/material/Box";
import moment from "moment";
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ProjectRole,
  SprintStatus,
  TaskStatus,
} from "../../../../common/constants";
import Sprint from "../../../../common/models/sprint";
import { CreateOrUpdateSprintPopup } from "../../components/CreateOrUpdateSprintPopup";
import { DetailDescriptionSprintPopup } from "../../components/DetailDescriptionSprintPopup";
import CompleteSprintIcon from "../../components/icons/CompleteSprintIcon";
import DoneIcon from "@mui/icons-material/Done";
import IconPen from "../../components/icons/IconPen";
import { UpdateStatusSprintPopup } from "../../components/UpdateStatusSprintPopup";
import { WorkSpace } from "../../components/WorkSpace";
import { isAdmin } from "../../config/admin-config";
import { useProject } from "../../hooks/useProject";
import { useSprint } from "../../hooks/useSprint";
import { useTask } from "../../hooks/useTask";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setCurrentProject } from "../../redux/slices/project.slice";
import {
  getSprintsByProjectId,
  setCurrentSprint,
} from "../../redux/slices/sprint.slice";
import { clearSearchUserStatistic, getTasksByProjectId } from "../../redux/slices/task.slice";
import { ClientTask } from "../../types/ClientTask";
import { ROUTER_PROJECT, ROUTER_SPRINT } from "../../utils/router";
import BootstrapTooltip from "../../components/CustomToolTip";
import FilterTaskByUser from "../../components/FilterTaskByUser";
import ManagerStatistical from "../../components/ManagerStatistical";
import StatisticalIcon from "../../components/icons/StatisticalIcon";
import IconInfo from "../../components/icons/IconInfo";
import ShowArchivedSprint from "../../components/ShowArchivedSprint";
import DeleteIcon from "../../components/icons/DeleteIcon";
import ConfirmDialog from "../../components/dialog/ConfirmDialog";
import useProjectMember from "../../hooks/useProjectMember"
import DensitySmallIcon from '@mui/icons-material/DensitySmall';

const SprintPage = () => {
  const { projectId, sprintId } = useParams();
  const { userProjectLoading } = useAppSelector(
    (state) => state.projectMemberReducer
  );
  const currentSprint = useAppSelector(
    (state) => state.sprintReducer.currentSprint
  );
  const showArchivedSprint = useAppSelector(
    (state) => state.sprintReducer.showArchivedSprint
  );
  const dataSubTasks = useAppSelector(state => state.taskReducer.mapSubTask)
  const taskIdsByCurentSprint = Object.keys(dataSubTasks)
  // const [searchTasksByName, setSearchTaskByName] = useState("");
  const [anchorElDesSprint, setAnchorElDesSprint] =
    useState<HTMLLIElement | null>(null);

  const openAnchorElDesSprint = Boolean(anchorElDesSprint);

  const handleOpenViewDesSprint = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorElDesSprint(event.currentTarget);
  };
  const handleCloseViewDesSprint = () => {
    setAnchorElDesSprint(null);
  };
  const [openDialogManagerStatistical, setOpenDialogManagerStatistical] =
    useState(false);
  const { projectState, currentUser, getUserProject, hasPermissionOnProject } =
    useProject({ projectId });

  const {
    sprintState,
    openPopup: openUpdateSprintPopup,
    setOpenPopup: setOpenUpdateSprintPopup,
    openUpdateStatusSprint,
    setOpenUpdateStatusSprint,
    handleUpdateSprint,
    handleUpdateStatusSprint,
    handleDeleteSprint
  } = useSprint({ projectId });
  const {
    handleCreateNewTask,
    handleUpdateTask,
    handleUpdatePositionTask,
    taskState,
  } = useTask({ projectId, sprintId });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [openDetailDescriptionSprint, setOpenDetailDescriptionSprint] =
    useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmSprintActive, setOpenConfirmSprintActive] = useState(false);
  const auth = useAppSelector(state => state.authReducer)
  const hasSprintMasterPermission = !!(useProjectMember(currentSprint?.projectId)).find((e) => e.role === ProjectRole.SPRINT_MASTER && e.userId === auth.user._id);



  const projectSprints = useMemo(() => {
    const sortSprints = (sprintOpen: Sprint[]) => {
      const activeSprints: Sprint[] = [];
      const upcomingSprints: Sprint[] = [];
      const archiveSprints: Sprint[] = [];
      sprintOpen.forEach((sprint) => {
        if (sprint.status === SprintStatus.ACTIVE) {
          activeSprints.push(sprint);
        } else if (sprint.status === SprintStatus.UP_COMING) {
          upcomingSprints.push(sprint);
        } else {
          archiveSprints.push(sprint);
        }
      });

      // activeSprints.sort((a, b) => b.startDate - b.startDate);
      upcomingSprints.sort((a, b) => b.startDate - a.startDate);
      archiveSprints.sort((a, b) => b.startDate - a.startDate);

      const result = [...activeSprints, ...upcomingSprints];
      if (showArchivedSprint) result.push(...archiveSprints);

      return result;
    };
    return sortSprints(
      _.filter(
        Object.values(sprintState.sprints) as Sprint[],
        (s) => s.projectId === projectId
      )
    )
  }, [projectId, sprintState.loading, sprintState.key, showArchivedSprint]);

  const tasksDeps = JSON.stringify(taskState.tasks);

  const dataTask = useMemo(() => {
    const sprintId = sprintState.currentSprint?._id;
    const mapTasks: { [taskId: string]: ClientTask } = JSON.parse(tasksDeps);
    const sprintTasks = sprintId
      ? _.filter(Object.values(mapTasks), (t) => t.sprintId === sprintId)
      : [];
    const sortTasks = (taskOpen: ClientTask[]) => {
      let result = [];
      taskOpen.forEach((item) => {
        if (!item.parentId) {
          result = [item, ...result];
          return;
        }
        const currentIndex = result.findIndex((x) => x.parentId === item._id);
        if (currentIndex > -1) {
          result = [
            ...result.slice(0, currentIndex),
            item,
            ...result.slice(currentIndex),
          ];
        } else {
          result.push(item);
        }
      });
      return result;
    };
    return {
      todoTasks: sortTasks(
        _.filter(sprintTasks, (t) => t.status === TaskStatus.OPEN)
      ),
      inprogressTasks: sortTasks(
        _.filter(sprintTasks, (t) => t.status === TaskStatus.IN_PROGRESS)
      ),
      bugTasks: sortTasks(
        _.filter(sprintTasks, (t) => t.status === TaskStatus.BUG)
      ),
      reviewTasks: sortTasks(
        _.filter(sprintTasks, (t) => t.status === TaskStatus.REVIEW)
      ),
      completeTasks: sortTasks(
        _.filter(sprintTasks, (t) => t.status === TaskStatus.COMPLETE)
      ),
    };
  }, [tasksDeps, sprintState.currentSprint?._id]);

  const canManipulateSprint =
    hasPermissionOnProject(projectId, [
      ProjectRole.OWNER,
      ProjectRole.SPRINT_MASTER,
    ]) || isAdmin(currentUser);

  useEffect(() => {
    if (userProjectLoading || projectState.loading) return;
    if (!!projectId) {
      // Set Current Project
      const project = projectState.projects[projectId];
      if (
        project &&
        hasPermissionOnProject(projectId, [
          ProjectRole.OWNER,
          ProjectRole.SPRINT_MASTER,
          ProjectRole.SPRINT_MEMBER,
        ])
      ) {
        dispatch(setCurrentProject(project));
        dispatch(getSprintsByProjectId(projectId));
        dispatch(getTasksByProjectId(projectId));
        // dispatch(setShowArchivedSprint(false))
      } else {
        navigate("/404");
      }
    }
  }, [projectId, projectState.loading, userProjectLoading]);

  useEffect(() => {
    if (!projectState.loading && !sprintState.loading) {
      const projectSprints = _.filter(
        Object.values(sprintState.sprints),
        (s) => s.projectId === projectId
      );
      if (projectSprints.length) {
        const currentSprint = sprintId
          ? sprintState.sprints[sprintId]
          : _.find(projectSprints, (s) => s.status === SprintStatus.ACTIVE) ||
          projectSprints.slice(-1)?.[0];
        if (currentSprint) {
          dispatch(setCurrentSprint(currentSprint));
          history.pushState(null, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_PROJECT}/${projectId}${ROUTER_SPRINT}/${currentSprint._id}`);
        } else {
          navigate("/404");
        }
      }
    }
  }, [projectState.loading, sprintState.loading, sprintId, projectId]);

  const handleSelectSprint = (sprintId: string) => {
    const sprint = sprintState.sprints[sprintId];
    if (sprint) {
      dispatch(setCurrentSprint(sprint));
      history.pushState(null, "", `${process.env.PUBLIC_URL ?? ""}${ROUTER_PROJECT}/${projectId}${ROUTER_SPRINT}/${sprintId}`);
    }
  };

  const handleEditSprint = () => {
    setOpenUpdateSprintPopup(true);
  };

  const handleOpenUpdateStatus = () => {
    setOpenUpdateStatusSprint(true)
  }

  const { todoTasks, inprogressTasks, bugTasks, reviewTasks } = dataTask
  const listTaskNotComplete = [...todoTasks, ...inprogressTasks, ...bugTasks, ...reviewTasks].map(e => e._id)

  const renderSprintView = () => {
    if (projectState.loading || sprintState.loading || taskState.loading)
      return <>Loading...</>;
    if (!projectSprints.length) return <>No Sprint</>;
    if (!sprintState.currentSprint) return <></>;
    return (
      <>
        <div className="sprint-container">
          <div className="sprint-items">
            <Select
              className="sprint-item-select"
              value={sprintState.currentSprint._id}
              classes={{
                select: "select-sprint-option-item",
                iconOutlined: "select-sprint-icon",
                outlined: "select-sprint-outlined",
              }}
              MenuProps={{
                classes: {
                  paper: "select-dropdown-sprint",
                },
              }}
              onChange={(e) => {
                const sprintId = e.target.value;
                handleSelectSprint(sprintId);
              }}>
              {projectSprints?.map((sprint) => {
                return (
                  <MenuItem
                    key={sprint._id}
                    value={sprint._id}
                    classes={{ root: "select-sprint-option-item" }}
                    style={
                      sprint.status === SprintStatus.ACTIVE
                        ? { borderBottom: "2px solid #E8E8EA" }
                        : null
                    }>
                    {sprint.status === SprintStatus.UP_COMING ? (
                      <UpcomingTwoTone htmlColor="#007aff" />
                    ) : sprint.status === SprintStatus.ACTIVE ? (
                      <AccessTimeTwoTone htmlColor="green" />
                    ) : sprint.status === SprintStatus.ARCHIVED ? (
                      <ArchiveTwoTone htmlColor="red" />
                    ) : (
                      <></>
                    )}
                    <Typography
                      sx={{ ml: 1 }}
                      component={
                        sprint.status === SprintStatus.ACTIVE ? "b" : "b"
                      }>
                      {sprint.name} ({" "}
                      {moment(sprint.startDate).format("DD.MM.YYYY")} -{" "}
                      {moment(sprint?.endDate).format("DD.MM.YYYY")})
                    </Typography>
                  </MenuItem>
                );
              })}
            </Select>

            <Popover
              open={openAnchorElDesSprint}
              anchorEl={anchorElDesSprint}
              onClose={handleCloseViewDesSprint}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              classes={{ paper: "paper-description-sprint" }}>
              <div className="custom-icon-arrow" />
              <div className="wraper-des-sprint">
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentSprint?.description,
                  }}
                  style={{ paddingBottom: "20px" }}
                />
              </div>
            </Popover>
            <div className="group-btn-sprint">
              {currentSprint?.description && (
                <BootstrapTooltip
                  placement="top"
                  title="View description sprint">
                  <IconButton
                    disableRipple
                    className="img-sprint"
                    onClick={(e: any) => handleOpenViewDesSprint(e)}>
                    <Box
                      sx={{
                        svg: {
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "1px",
                        },
                      }}>
                      <IconInfo />
                    </Box>
                  </IconButton>
                </BootstrapTooltip>
              )}

              {canManipulateSprint && (
                <BootstrapTooltip
                  placement="top"
                  title="Edit sprint"
                  disableFocusListener>
                  <IconButton
                    disableFocusRipple
                    disableRipple
                    className="img-sprint"
                    onClick={handleEditSprint}
                    disabled={!canManipulateSprint}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}>
                    <Box
                      sx={{
                        svg: {
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "1px",
                        },
                      }}>
                      <IconPen />
                    </Box>
                  </IconButton>
                </BootstrapTooltip>
              )}
              <FilterTaskByUser />
              <BootstrapTooltip placement="top" title="Statistic">
                <IconButton
                  disableRipple
                  className="img-sprint"
                  onClick={() => setOpenDialogManagerStatistical(true)}>
                  <Box
                    sx={{
                      svg: {
                        width: "15px",
                        height: "15px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "1px",
                      },
                    }}>
                    <StatisticalIcon />
                  </Box>
                </IconButton>
              </BootstrapTooltip>

              <ShowArchivedSprint taskIdsByCurentSprint={taskIdsByCurentSprint} />
              {[sprintState.currentSprint.status].includes(
                SprintStatus.ACTIVE
              ) && (
                  <div>
                    {canManipulateSprint && (
                      <BootstrapTooltip
                        placement="top"
                        title="Set complete sprint"
                        disableFocusListener>
                        <IconButton
                          disableFocusRipple
                          disableRipple
                          className="img-sprint"
                          onClick={handleOpenUpdateStatus}
                          disabled={!canManipulateSprint}>
                          <DoneIcon sx={{ color: "#0085FF", fontSize: "20px" }} />
                        </IconButton>
                      </BootstrapTooltip>
                    )}
                  </div>
                )}
              <ConfirmDialog
                open={openConfirmDelete}
                title="Confirm Delete?"
                content={<>Are you sure to delete sprint : {currentSprint?.name} ?</>}
                onClose={() => {
                  setOpenConfirmDelete(false)
                }}
                onConfirm={() => {
                  handleDeleteSprint(sprintState.currentSprint._id)
                  setOpenConfirmDelete(false)
                  window.location.replace(`${window.location.origin}/${currentSprint?.projectId}`)
                }}
              />
              <ConfirmDialog
                open={openConfirmSprintActive}
                title="Confirm Active Sprint?"
                content={<>Are you sure to active sprint : {currentSprint?.name} ?</>}
                onClose={() => {
                  setOpenConfirmSprintActive(false)
                }}
                onConfirm={() => {
                  handleUpdateSprint(sprintState.currentSprint._id, { status: SprintStatus.ACTIVE })
                  setOpenConfirmSprintActive(false)
                }}
              />
              {hasSprintMasterPermission &&
                <BootstrapTooltip placement="top" title="Delete Sprint">
                  <IconButton
                    disableRipple
                    className="img-sprint"
                    onClick={() => setOpenConfirmDelete(true)}>
                    <Box
                      sx={{
                        svg: {
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "1px",
                        },
                      }}>
                      <DeleteIcon />
                    </Box>
                  </IconButton>
                </BootstrapTooltip>}


              {
                sprintState.currentSprint.status === SprintStatus.UP_COMING &&
                <BootstrapTooltip placement="top" title="Active Sprint">
                  <IconButton
                    disableRipple
                    className="img-sprint"
                    onClick={() => setOpenConfirmSprintActive(true)}>
                    <Box
                      sx={{
                        svg: {
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "1px",
                        },
                      }}>
                      <DensitySmallIcon />
                    </Box>
                  </IconButton>
                </BootstrapTooltip>}
            </div>
          </div>
        </div>
        <WorkSpace
          todo={dataTask.todoTasks}
          inprogress={dataTask.inprogressTasks}
          bug={dataTask.bugTasks}
          review={dataTask.reviewTasks}
          complete={dataTask.completeTasks}
          onCreateNewTask={handleCreateNewTask}
          onUpdateTask={handleUpdateTask}
          onUpdatePositionTask={handleUpdatePositionTask}
          projectId={projectId}
          sprintId={sprintId || (sprintState.currentSprint?._id ?? undefined)}
        />
        {openUpdateSprintPopup && (
          <CreateOrUpdateSprintPopup
            open={openUpdateSprintPopup}
            onClose={() => setOpenUpdateSprintPopup(false)}
            nameSprint={sprintState.currentSprint?.name}
            dataUpdate={sprintState.currentSprint}
            onUpdate={(data: Sprint) => {
              data.projectId = projectState.currentProject._id;
              handleUpdateSprint(sprintState.currentSprint._id, data);
            }}
          />
        )}
        {openUpdateStatusSprint && (
          <UpdateStatusSprintPopup
            open={openUpdateStatusSprint}
            handleClose={() => setOpenUpdateStatusSprint(false)}
            title={sprintState.currentSprint?.name}
            handleConfirm={() => {
              const data = {
                status: -1,
                projectId,
              };
              handleUpdateStatusSprint(sprintState.currentSprint._id, data);
            }}
            listTaskNotComplete={listTaskNotComplete}
          />
        )}
        {sprintState.currentSprint && openDetailDescriptionSprint && (
          <DetailDescriptionSprintPopup
            open={openDetailDescriptionSprint}
            onClose={() => setOpenDetailDescriptionSprint(false)}
          />
        )}
        {openDialogManagerStatistical && (
          <ManagerStatistical
            open={openDialogManagerStatistical}
            onClose={() => {
              setOpenDialogManagerStatistical(false)
              dispatch(clearSearchUserStatistic())
            }}
          />
        )}
      </>
    );
  };
  return <>{renderSprintView()}</>;
};

export default SprintPage;
