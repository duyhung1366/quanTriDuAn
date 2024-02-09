import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Box, DialogActions, FormControl, FormLabel, RadioGroup, Stack, Switch, TextField } from '@mui/material';
import { Button } from '@mui/material';
import { useAppSelector } from '../redux/hooks';
import { SprintStatus, TaskStatus } from '../../../common/constants';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Typography } from '@mui/material';
import { useTask } from '../hooks/useTask';

const label = { inputProps: { 'aria-label': 'Switch demo' } };


const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});
interface IProps {
    open: boolean,
    title?: string,
    handleClose?: any,
    handleConfirm?: any,
    warningText?: string,
    listTaskNotComplete: string[]
}

export const UpdateStatusSprintPopup = (props: IProps) => {
    const { open, title, handleClose, handleConfirm, warningText } = props;
    const sprintState = useAppSelector(state => state.sprintReducer)
    const currentProject = useAppSelector(state => state.projectReducer.currentProject)
    const [valueConfirm, setValueConfirm] = React.useState('');
    const listSprintByProject = Object.values(sprintState.sprints).filter(e => e.projectId === currentProject._id && e.status === SprintStatus.UP_COMING);
    const [sprintId, setSprintId] = React.useState(sprintState.currentSprint._id)
    const { handleCloneMultileTask } = useTask()
    const [show, setShow] = React.useState(false)

    const handleCloseDialog = () => {
        handleClose();
        setValueConfirm('')
    }

    const handleConfirmDelete = () => {

        if (valueConfirm.trim().toUpperCase() === "OK") {
            if (show) {
                handleConfirm()
                handleCloneMultileTask(props?.listTaskNotComplete, sprintId)
                return;
            }
            handleConfirm()
        }
    }
    // console.log("re-render")
    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleCloseDialog}
            aria-describedby="alert-dialog-slide-description"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle style={{ fontWeight: "bolder" }}> Bạn có chắc chắn muốn cập nhật trạng thái archive cho : {title} ?</DialogTitle>
            <Box sx={{ textAlign: 'center' }}>
                {props?.listTaskNotComplete.length > 0 &&
                    <Box>
                        <Typography sx={{ color: 'red' }}> {`Bạn còn ${props?.listTaskNotComplete.length} task chưa hoàn thành.`}</Typography>
                        <Stack spacing={2} direction="row" >
                            <Typography sx={{ marginTop: "10px", ml: 2 }}> Bạn muốn chuyển sang sprint mới không ?</Typography>
                            <Switch
                                disableRipple
                                checked={show}
                                {...label}
                                onChange={(e) => setShow(e.target.checked)}
                            />
                        </Stack>
                    </Box>
                }
            </Box>
            {
                show &&
                <Box sx={{ ml: 3 }}>
                    <FormControl>
                        <h5>List Sprint</h5>
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
                    </FormControl>
                </Box>
            }


            <DialogContent>
                <small style={{ color: 'red' }}><i>{warningText}</i></small>
                <div>Nhập <strong>OK</strong> để xác nhận</div>
                <TextField
                    error={!(valueConfirm.trim().toUpperCase() === "OK")}
                    autoFocus
                    margin="dense"
                    id="name"
                    size='small'
                    fullWidth
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleConfirmDelete()
                        }
                    }}
                    value={valueConfirm}
                    onChange={(e) => setValueConfirm(e.target.value)}
                    helperText={!(valueConfirm.trim().toUpperCase() === "OK") ? "Nhập OK để xác nhận" : ''}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} color="error" size="small">
                    Đóng
                </Button>
                <Button color="success" variant='contained' onClick={handleConfirmDelete}>Xác nhận </Button>
            </DialogActions>
        </Dialog>
    );
}