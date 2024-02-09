import * as React from 'react';
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { RootState } from "../../redux/store";
import { Box, Button, Divider, Select, TextField, Typography } from '@mui/material';
import Popover from "@mui/material/Popover";
import MenuItem from '@mui/material/MenuItem/MenuItem';
import BootstrapTooltip from "../../components/CustomToolTip";
import { IconButton } from "@mui/material";
import UserAssignIcon from '../icons/UserAssignIcon';
import { SprintStatus } from "../../../../common/constants";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { useTask } from '../../hooks/useTask';
import CopyrightIcon from '@mui/icons-material/Copyright';
import { removeSelectedTasks } from '../../redux/slices/task.slice';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import CopyTaskIcon from '../icons/CopyTaskIcon';
import MoveTaskIcon from '../icons/MoveTaskIcon';
import SelectTaskIcon from '../icons/SelectTaskIcon';
import DismissIcon from '../icons/DismissIcon';
import DeleteIcon from '../icons/DeleteIcon';
import ConfirmDialog from '../dialog/ConfirmDialog';
import useProjectMember from "../../hooks/useProjectMember"
import { ProjectRole } from "../../../../common/constants";


enum Option {
  NONE,
  COPY,
  MOVE,
  DELETE
}

export default function CloneOrMoveTask(props: { clone?: boolean }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover-filtert-task-by-user' : undefined;
  const sprintState = useAppSelector(state => state.sprintReducer)
  const currentProject = useAppSelector(state => state.projectReducer.currentProject)
  const taskIds = useAppSelector((state: RootState) => state.taskReducer.listTaskCloneOrMove);
  const listSprintByProject = Object.values(sprintState.sprints).filter(e => e.projectId === currentProject._id && e.status !== SprintStatus.ARCHIVED);
  const [sprintId, setSprintId] = React.useState(sprintState.currentSprint._id)
  const auth = useAppSelector((state: RootState) => state.authReducer)
  const hasMasterOrOwnerPermission = !!(useProjectMember(sprintState?.currentSprint?.projectId)).find((e) => e.role !== ProjectRole.SPRINT_MEMBER && e.userId === auth.user._id);


  const { handleCloneMultileTask, handleMoveMultileTask, handleDeleteMultipleTask } = useTask()
  const [option, setOption] = useState<Option>(Option.NONE)
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);


  const dispatch = useAppDispatch();


  const handleCloneTaskClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOption(Option.COPY)
  };

  const handleMoveTaskClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOption(Option.MOVE)
  };

  const handleDeleteTaskClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenConfirmDelete(true)
    setOption(Option.DELETE)
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const finishTaskClick = () => {
    dispatch(removeSelectedTasks())
    setAnchorEl(null);
  }

  const handleMultipleTaskClick = () => {
    if (option === Option.COPY) {
      handleCloneMultileTask(taskIds, sprintId)
      finishTaskClick()
      return;
    }
    if (option === Option.MOVE) {
      handleMoveMultileTask(taskIds, sprintId)
      finishTaskClick()
      return;
    }
  }

  return (
    <div>
      <Box>
        <BootstrapTooltip placement="top" title="Move tasks">
          <IconButton disableRipple className='img-sprint' onClick={handleMoveTaskClick} >
            <Box sx={{ svg: { width: "30px", height: '30px', display: 'flex', alignItems: 'center', paddingLeft: '2px', mr: 4 } }}>
              <MoveTaskIcon />
            </Box>
          </IconButton>
        </BootstrapTooltip>

        <BootstrapTooltip placement="top" title="Duplicate tasks">
          <IconButton disableRipple className='img-sprint' onClick={handleCloneTaskClick} >
            <Box sx={{ svg: { width: "30px", height: '30px', display: 'flex', alignItems: 'center', paddingLeft: '2px', mr: 4 } }}>
              <CopyTaskIcon />
            </Box>
          </IconButton>
        </BootstrapTooltip>

        {
          hasMasterOrOwnerPermission &&
          <BootstrapTooltip placement="top" title="Delete tasks">
            <IconButton disableRipple className='img-sprint' onClick={handleDeleteTaskClick} >
              <Box sx={{ svg: { width: "30px", height: '30px', display: 'flex', alignItems: 'center', paddingLeft: '2px', mr: 4 } }}>
                <DeleteIcon />
              </Box>
            </IconButton>
          </BootstrapTooltip>
        }


        <BootstrapTooltip placement="top" title="Dismiss">
          <IconButton disableRipple className='img-sprint' onClick={() => dispatch(removeSelectedTasks())} >
            <Box sx={{ svg: { width: "30px", height: '30px', display: 'flex', alignItems: 'center', paddingLeft: '2px' } }}>
              <DismissIcon />
            </Box>
          </IconButton>
        </BootstrapTooltip>
      </Box>

      <ConfirmDialog
        open={openConfirmDelete}
        title="Confirm Delete?"
        content={<>Are you sure delete {taskIds.length} tasks ?</>}
        onClose={() => {
          setOpenConfirmDelete(false)
          dispatch(removeSelectedTasks())
        }}
        onConfirm={() => {
          handleDeleteMultipleTask(taskIds)
          finishTaskClick()
        }}
      />

      <Popover
        id={id}
        open={open && option !== Option.NONE}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ overflow: 'hidden', width: '300px' }}>
          <FormControl>
            <FormLabel sx={{ my: 1, textAlign: 'center' }} id="demo-radio-buttons-group-label">List Sprint</FormLabel>
            <Divider />
            <Box sx={{ ml: 2, my: 2 }}>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                value={sprintId}
                name="radio-buttons-group"
                onChange={(e) => setSprintId(e.target.value)}
              >
                {
                  listSprintByProject.map((e) => {
                    return (
                      <FormControlLabel value={e._id} label={e.name} control={<Radio />} />
                    )
                  })

                }
              </RadioGroup>
            </Box>
            <Divider />
          </FormControl>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2, ml: 10 }}
            onClick={handleMultipleTaskClick}
          >
            Ok
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ mb: 2, mr: 5, ml: 2 }}
            onClick={() => setAnchorEl(null)}
          >
            Cancel
          </Button>
        </Box>
      </Popover>
    </div >
  );
}